const express = require('express')
const redis = require('../utils/redis')
const { sendVerificationEmail, renderWelcomePage } = require('../utils/mailer');
const router = express.Router()
const bcrypt = require('bcryptjs')
const zxcvbn = require('zxcvbn')
const crypto = require('crypto')
const { User } = require('../models')
const { Op } = require('sequelize')
const { v4: uuidv4 } = require('uuid')

const RATE_LIMIT_WINDOW = 60
const RATE_LIMIT_MAX = 10

const MAX_ACCOUNTS_PER_IP = 3000
const ACCOUNT_LIMIT_WINDOW = 86400

const VERIFY_CODE_TTL = 3600 * 24 * 7
const RESEND_CODE_TTL = 300 

const MAX_VERIFY_ATTEMPTS = 10
const VERIFY_BLOCK_TIME = 3600 * 2

function generateCode(length = 6) {
  const digits = '0123456789'
  const bytes = crypto.randomBytes(length)
  return [...bytes].map(b => digits[b % digits.length]).join('')
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username)
}

async function safeRedisCall(fn, ...args) {
  try {
    return await fn(...args)
  } catch (err) {
    console.error('Redis error:', err)
    return null
  }
}

async function safeSendEmail(email, code, signupToken, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await sendVerificationEmail(email, code, signupToken)
      console.log(code)
      return true
      
    } catch (err) {
      console.log(code)
      console.error(`Email send failed attempt ${i + 1}:`, err)
      if (i === retries - 1) return false
      await new Promise(r => setTimeout(r, 1000 * (i + 1))) // exponential backoff
    }
  }
}

async function isIpBlocked(ip) {
  return Boolean(await safeRedisCall(redis.exists.bind(redis), `blockip:${ip}`))
}

async function blockIp(ip) {
  await safeRedisCall(redis.set.bind(redis), `blockip:${ip}`, '1', 'EX', 3600)
}

async function checkAndCountAccountIp(ip) {
  const key = `accounts_created:${ip}`
  const count = await safeRedisCall(redis.incr.bind(redis), key)
  if (count === 1) await safeRedisCall(redis.expire.bind(redis), key, ACCOUNT_LIMIT_WINDOW)
  if (count > MAX_ACCOUNTS_PER_IP) {
    await blockIp(ip)
    return false
  }
  return true
}

async function rateLimit(ip, action) {
  const key = `rate:${action}:${ip}`
  const hits = await safeRedisCall(redis.incr.bind(redis), key)
  if (hits === 1) await safeRedisCall(redis.expire.bind(redis), key, RATE_LIMIT_WINDOW)
  return hits <= RATE_LIMIT_MAX
}

async function emailRateLimit(email, action) {
  const key = `rate:${action}:${email}`
  const hits = await safeRedisCall(redis.incr.bind(redis), key)
  if (hits === 1) await safeRedisCall(redis.expire.bind(redis), key, RATE_LIMIT_WINDOW)
  return hits <= RATE_LIMIT_MAX
}

async function incrementVerifyAttempts(signupToken) {
  const key = `verify_attempts:${signupToken}`
  const attempts = await safeRedisCall(redis.incr.bind(redis), key)
  if (attempts === 1) await safeRedisCall(redis.expire.bind(redis), key, VERIFY_BLOCK_TIME)
  return attempts
}

async function blockSignupToken(signupToken) {
  await safeRedisCall(redis.set.bind(redis), `block_signup:${signupToken}`, '1', 'EX', VERIFY_BLOCK_TIME)
}

async function isSignupTokenBlocked(signupToken) {
  return Boolean(await safeRedisCall(redis.exists.bind(redis), `block_signup:${signupToken}`))
}

async function cleanupExpiredPendingUsers() {
  try {
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'pending_user:*', 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) {
        for (const key of keys) {
          const ttl = await redis.ttl(key)
          if (ttl === -2) {
            continue
          }
          if (ttl === -1) {
            await redis.del(key)
          }
        }
      }
    } while (cursor !== '0')
  } catch (err) {
    console.error('Cleanup job error:', err)
  }
}

setInterval(cleanupExpiredPendingUsers, 3600 * 1000)


router.post('/signup', async (req, res) => {
  const ip = req.ip

  if (await isIpBlocked(ip)) {
    return res.status(403).json({ error: 'Your IP is temporarily blocked due to suspicious activity' })
  }

  if (!(await rateLimit(ip, 'signup'))) {
    return res.status(429).json({ error: 'Too many requests, try later' })
  }

  let { name, username, email, password } = req.body
  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  name = name.trim()
  username = username.trim().toLowerCase()
  email = email.trim().toLowerCase()

  if (name.length > 50) return res.status(400).json({ error: 'Name too long' })
  if (!isValidUsername(username)) return res.status(400).json({ error: 'Invalid username' })
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' })
  if (password.length > 100) return res.status(400).json({ error: 'Password too long' })

  const passwordStrength = zxcvbn(password)
  if (passwordStrength.score < 3) return res.status(400).json({ error: 'Weak password' })

  try {
    const existing = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    })
    if (existing) return res.status(400).json({ error: 'User already exists' })

    const allowed = await checkAndCountAccountIp(ip)
    if (!allowed) {
      return res.status(403).json({ error: 'Too many accounts created from your IP. Try later.' })
    }

    const hashed = await bcrypt.hash(password, 12)

    const tempUser = {
      name,
      username,
      email,
      password: hashed,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const signupToken = uuidv4()

    await safeRedisCall(redis.set.bind(redis), `pending_user:${signupToken}`, JSON.stringify(tempUser), 'EX', VERIFY_CODE_TTL)

    const code = generateCode()
    const codeHash = await bcrypt.hash(code, 10)
    await safeRedisCall(redis.set.bind(redis), `verify_code:${signupToken}`, codeHash, 'EX', VERIFY_CODE_TTL)

    const emailSent = await safeSendEmail(email, code, signupToken)
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' })
    }

    res.status(201).json({ message: 'Signup successful. Check email for verification.', signupToken })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Signup failed' })
  }
})

router.get('/verify/:signupToken/:code', async (req, res) => {
  const { signupToken, code } = req.params;

  try {
    const storedUserJson = await safeRedisCall(redis.get.bind(redis), `pending_user:${signupToken}`);
    const storedCodeHash = await safeRedisCall(redis.get.bind(redis), `verify_code:${signupToken}`);
    if (!storedUserJson || !storedCodeHash) {
      return res.status(400).send('Verification link expired or invalid.');
    }

    const codeValid = await bcrypt.compare(code, storedCodeHash);
    if (!codeValid) {
      return res.status(400).send('Invalid verification code.');
    }

    const storedUser = JSON.parse(storedUserJson);

    const existing = await User.findOne({
      where: {
        [Op.or]: [{ email: storedUser.email }, { username: storedUser.username }],
      },
    });
    if (existing) return res.status(400).send('User already exists.');

    await User.create({ ...storedUser, emailVerified: true });

    await safeRedisCall(redis.del.bind(redis), `pending_user:${signupToken}`);
    await safeRedisCall(redis.del.bind(redis), `verify_code:${signupToken}`);
    await safeRedisCall(redis.del.bind(redis), `verify_attempts:${signupToken}`);

    // Render welcome HTML page and send
    const welcomeHtml = await renderWelcomePage(storedUser.name || storedUser.username || 'User');
    res.status(200).send(welcomeHtml);

  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).send('Verification failed.');
  }
});

router.post('/verify', async (req, res) => {
  const ip = req.ip
  const { signupToken, code } = req.body

  if (await isIpBlocked(ip)) {
    return res.status(403).json({ error: 'Your IP is temporarily blocked due to suspicious activity' })
  }

  if (!(await rateLimit(ip, 'verify'))) {
    return res.status(429).json({ error: 'Too many requests, try later' })
  }

  if (!signupToken || !code) return res.status(400).json({ error: 'Missing signupToken or code' })

  if (await isSignupTokenBlocked(signupToken)) {
    return res.status(403).json({ error: 'Too many failed attempts. Please try again later.' })
  }

  try {
    const storedUserJson = await safeRedisCall(redis.get.bind(redis), `pending_user:${signupToken}`)
    const storedCodeHash = await safeRedisCall(redis.get.bind(redis), `verify_code:${signupToken}`)
    if (!storedUserJson || !storedCodeHash) return res.status(400).json({ error: 'Code expired or not found' })

    const codeValid = await bcrypt.compare(code, storedCodeHash)
    if (!codeValid) {
      const attempts = await incrementVerifyAttempts(signupToken)
      if (attempts >= MAX_VERIFY_ATTEMPTS) {
        await blockSignupToken(signupToken)
      }
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    const storedUser = JSON.parse(storedUserJson)

    const existing = await User.findOne({
      where: {
        [Op.or]: [{ email: storedUser.email }, { username: storedUser.username }]
      }
    })
    if (existing) return res.status(400).json({ error: 'User already exists' })

    const user = await User.create({ ...storedUser, emailVerified: true })

    await safeRedisCall(redis.del.bind(redis), `pending_user:${signupToken}`)
    await safeRedisCall(redis.del.bind(redis), `verify_code:${signupToken}`)
    await safeRedisCall(redis.del.bind(redis), `verify_attempts:${signupToken}`)

    res.json({ message: 'Email verified successfully', userId: user.id })
  } catch (err) {
    console.error('Verification error:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
})

router.post('/resend-code', async (req, res) => {
  const ip = req.ip
  const { signupToken } = req.body

  if (await isIpBlocked(ip)) {
    return res.status(403).json({ error: 'Your IP is temporarily blocked due to suspicious activity' })
  }

  if (!(await rateLimit(ip, 'resend-code'))) {
    return res.status(429).json({ error: 'Too many requests, try later' })
  }

  if (!signupToken) return res.status(400).json({ error: 'Missing signupToken' })

  try {
    const storedUserJson = await safeRedisCall(redis.get.bind(redis), `pending_user:${signupToken}`)
    if (!storedUserJson) return res.status(400).json({ error: 'Signup session expired or not found' })

    const cooldownKey = `resend_cooldown:${signupToken}`
    if (await safeRedisCall(redis.exists.bind(redis), cooldownKey)) {
      return res.status(429).json({ error: 'Please wait before requesting a new code' })
    }

    const user = JSON.parse(storedUserJson)

    if (!(await emailRateLimit(user.email, 'resend-code'))) {
      return res.status(429).json({ error: 'Too many resend requests for this email. Try later.' })
    }

    const code = generateCode()
    const codeHash = await bcrypt.hash(code, 10)
    await safeRedisCall(redis.set.bind(redis), `verify_code:${signupToken}`, codeHash, 'EX', VERIFY_CODE_TTL)

    await safeRedisCall(redis.set.bind(redis), cooldownKey, '1', 'EX', RESEND_CODE_TTL)

    const emailSent = await safeSendEmail(user.email, code, signupToken)
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' })
    }

    res.json({ message: 'Verification code resent' })
  } catch (err) {
    console.error('Resend code error:', err)
    res.status(500).json({ error: 'Resend code failed' })
  }
})

// Add this route to your backend router
router.get('/check-username', async (req, res) => {
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Trim and lowercase the username
    const cleanUsername = username.trim().toLowerCase();
    
    // Validate username format
    if (!isValidUsername(cleanUsername)) {
      return res.status(400).json({ 
        error: 'Username must be 3-20 characters and can only contain letters, numbers, and underscores' 
      });
    }

    // Check if username exists in database
    const user = await User.findOne({ where: { username: cleanUsername } });
    
    res.json({ available: !user });
  } catch (err) {
    console.error('Error checking username:', err);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
});

module.exports = router
