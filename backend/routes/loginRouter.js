const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const redis = require('../utils/redis');
const { User } = require('../models');
const { sendResetEmail } = require('../utils/passwordMailer');
const { Op } = require('sequelize');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const LOGIN_RATE_LIMIT = 10;
const LOGIN_WINDOW = 60;

const RESET_CODE_TTL = 600;
const RESET_RESEND_COOLDOWN = 60;

const MAX_FAILED_LOGIN = 20;
const ACCOUNT_LOCK_TIME = 3600;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET env variable');
}
const JWT_EXPIRATION = '1h'; // access token expires in 1 hour
const REFRESH_TOKEN_EXPIRATION = 7 * 24 * 3600; // 7 days in seconds

function generateCode(length = 6) {
  const digits = '0123456789'
  const bytes = crypto.randomBytes(length)
  return [...bytes].map(b => digits[b % digits.length]).join('')
}

async function safeRedisCall(fn, ...args) {
  try {
    return await fn(...args);
  } catch (e) {
    console.error('Redis error:', e);
    return null;
  }
}

// Basic sliding window rate limit using Redis sorted set
async function rateLimitSliding(key, windowSeconds, limit) {
  const now = Date.now();
  const redisKey = `rate:${key}`;
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, now - windowSeconds * 1000);
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`); // unique member
  pipeline.zcard(redisKey);
  pipeline.expire(redisKey, windowSeconds);
  const [, , count] = await pipeline.exec();
  return count[1] <= limit;
}

async function isBlockedIp(ip) {
  return Boolean(await safeRedisCall(redis.exists.bind(redis), `blockip:${ip}`));
}

async function isAccountLocked(userId) {
  return Boolean(await safeRedisCall(redis.exists.bind(redis), `lockuser:${userId}`));
}

async function recordFailedLogin(userId, ip) {
  const key = `failedlogin:${userId}`;
  const fails = await safeRedisCall(redis.incr.bind(redis), key);
  if (fails === 1) await safeRedisCall(redis.expire.bind(redis), key, ACCOUNT_LOCK_TIME);
  if (fails >= MAX_FAILED_LOGIN) {
    await safeRedisCall(redis.set.bind(redis), `lockuser:${userId}`, '1', 'EX', ACCOUNT_LOCK_TIME);
    console.log(`User ${userId} locked out due to failed login attempts`);
  }

  const ipFailsKey = `failedloginip:${ip}`;
  const ipFails = await safeRedisCall(redis.incr.bind(redis), ipFailsKey);
  if (ipFails === 1) await safeRedisCall(redis.expire.bind(redis), ipFailsKey, ACCOUNT_LOCK_TIME);

  return fails;
}

function validatePassword(password) {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

function requireBody(req, res, next) {
  if (!req.body) return res.status(400).json({ error: 'Missing request body' });
  next();
}


// LOGIN with refresh tokens and device logging
router.post('/login', requireBody, async (req, res) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const { identifier, password } = req.body;

  if (!identifier || !password)
    return res.status(400).json({ error: 'Missing credentials' });

  if (await isBlockedIp(ip)) return res.status(403).json({ error: 'Access denied' });

  if (!(await rateLimitSliding(ip + ':login', LOGIN_WINDOW, LOGIN_RATE_LIMIT)))
    return res.status(429).json({ error: 'Too many requests from IP' });

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
    });

    if (!user || !user.password)
      return res.status(401).json({ error: 'Invalid credentials' });

    if (await isAccountLocked(user.id)) {
      return res.status(403).json({ error: 'Account temporarily locked' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await recordFailedLogin(user.id, ip);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    await safeRedisCall(redis.del.bind(redis), `failedlogin:${user.id}`);
    await safeRedisCall(redis.del.bind(redis), `failedloginip:${ip}`);


    const payload = { id: user.id, username: user.username, email: user.email };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    const refreshToken = uuidv4();
    await safeRedisCall(redis.set.bind(redis), `refresh_token:${refreshToken}`, JSON.stringify({
      userId: user.id,
      userAgent,
      ip,
    }), 'EX', REFRESH_TOKEN_EXPIRATION);

    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRATION * 1000,
    });

    console.log(`User ${user.id} logged in from IP ${ip}, agent ${userAgent}`);

    res.json({ message: 'Login successful', userId: user.id, username: user.username, email: user.email, token: accessToken});

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// REFRESH TOKEN endpoint to get new access token
router.post('/refresh-token', requireBody, async (req, res) => {
  const { refreshToken } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });

  try {
    const data = await safeRedisCall(redis.get.bind(redis), `refresh_token:${refreshToken}`);
    if (!data) return res.status(403).json({ error: 'Invalid or expired refresh token' });

    const tokenData = JSON.parse(data);

    // Optional: Verify IP and userAgent match stored values (extra security)
    if (tokenData.ip !== ip || tokenData.userAgent !== userAgent) {
      // Revoke token if mismatch
      await safeRedisCall(redis.del.bind(redis), `refresh_token:${refreshToken}`);
      return res.status(403).json({ error: 'Invalid refresh token environment' });
    }

    const user = await User.findByPk(tokenData.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Issue new access token
    const payload = { id: user.id, name: user.username, email: user.email };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    // Optional: Rotate refresh token for more security
    const newRefreshToken = uuidv4();
    await safeRedisCall(redis.set.bind(redis), `refresh_token:${newRefreshToken}`, JSON.stringify({
      userId: user.id,
      userAgent,
      ip,
    }), 'EX', REFRESH_TOKEN_EXPIRATION);
    await safeRedisCall(redis.del.bind(redis), `refresh_token:${refreshToken}`);

    // Set new cookies
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    });
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRATION * 1000,
    });

    res.json({ message: 'Token refreshed' });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// LOGOUT clears both tokens from client and Redis
router.post('/logout', (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    safeRedisCall(redis.del.bind(redis), `refresh_token:${refreshToken}`);
  }
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: 'Logged out' });
});

// REQUEST RESET CODE
router.post('/forgot-password', requireBody, async (req, res) => {
  const ip = req.ip;
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email required' });

  if (!(await rateLimitSliding(ip + ':forgot', LOGIN_WINDOW, LOGIN_RATE_LIMIT)))
    return res.status(429).json({ error: 'Too many requests from IP' });

  if (!(await rateLimitSliding(email.toLowerCase() + ':forgot', LOGIN_WINDOW, LOGIN_RATE_LIMIT)))
    return res.status(429).json({ error: 'Too many requests for this email' });

  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Don't reveal if email exists or not
      return res.status(200).json({ message: 'If the email is valid, a code was sent.' });
    }

    const resendKey = `reset_resend:${user.id}`;
    const canResend = !(await safeRedisCall(redis.exists.bind(redis), resendKey));
    if (!canResend) {
      return res.status(429).json({ error: 'Please wait before requesting another code' });
    }

    const resetToken = uuidv4();
    const code = generateCode(8);
    const codeHash = await bcrypt.hash(code, 12);

    await safeRedisCall(redis.set.bind(redis), `reset_code:${resetToken}`, codeHash, 'EX', RESET_CODE_TTL);
    await safeRedisCall(redis.set.bind(redis), `reset_user:${resetToken}`, user.id, 'EX', RESET_CODE_TTL);

    await safeRedisCall(redis.set.bind(redis), resendKey, '1', 'EX', RESET_RESEND_COOLDOWN);

    await sendResetEmail(user.email, code, resetToken);

    res.json({ message: 'Reset code sent', resetToken });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// RESEND RESET CODE
router.post('/resend-reset-code', requireBody, async (req, res) => {
  const ip = req.ip;
  const { resetToken } = req.body;

  if (!resetToken) return res.status(400).json({ error: 'Missing reset token' });

  try {
    const userId = await safeRedisCall(redis.get.bind(redis), `reset_user:${resetToken}`);
    if (!userId) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resendKey = `reset_resend:${user.id}`;
    const canResend = !(await safeRedisCall(redis.exists.bind(redis), resendKey));
    if (!canResend) {
      return res.status(429).json({ error: 'Please wait before resending the code' });
    }

    const code = generateCode(8);
    const codeHash = await bcrypt.hash(code, 12);
    const newResetToken = uuidv4();

    await safeRedisCall(redis.del.bind(redis), `reset_code:${resetToken}`);
    await safeRedisCall(redis.del.bind(redis), `reset_user:${resetToken}`);

    await safeRedisCall(redis.set.bind(redis), `reset_code:${newResetToken}`, codeHash, 'EX', RESET_CODE_TTL);
    await safeRedisCall(redis.set.bind(redis), `reset_user:${newResetToken}`, user.id, 'EX', RESET_CODE_TTL);

    await safeRedisCall(redis.set.bind(redis), resendKey, '1', 'EX', RESET_RESEND_COOLDOWN);

    await sendResetEmail(user.email, code, newResetToken);

    res.json({ message: 'Reset code resent', resetToken: newResetToken });
  } catch (err) {
    console.error('Resend reset code error:', err);
    res.status(500).json({ error: 'Failed to resend reset code' });
  }
});

// VERIFY CODE AND RESET PASSWORD
router.post('/reset-password', requireBody, async (req, res) => {
  const { resetToken, code, newPassword } = req.body;

  if (!resetToken || !code || !newPassword)
    return res.status(400).json({ error: 'Missing fields' });

  if (newPassword.length > 100)
    return res.status(400).json({ error: 'Password too long' });

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ error: 'Password does not meet strength requirements' });
  }

  try {
    const storedHash = await safeRedisCall(redis.get.bind(redis), `reset_code:${resetToken}`);
    const userId = await safeRedisCall(redis.get.bind(redis), `reset_user:${resetToken}`);

    if (!storedHash || !userId)
      return res.status(400).json({ error: 'Code expired or invalid' });

    const valid = await bcrypt.compare(code, storedHash);
    if (!valid) return res.status(400).json({ error: 'Invalid code' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();

    await safeRedisCall(redis.del.bind(redis), `reset_code:${resetToken}`);
    await safeRedisCall(redis.del.bind(redis), `reset_user:${resetToken}`);

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
});



module.exports = router;