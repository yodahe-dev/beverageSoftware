const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // try getting token from Authorization header: "Bearer token"
  const authHeader = req.headers['authorization'];
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7); // remove "Bearer "
  } else if (req.cookies && req.cookies.token) {
    // fallback to cookie token
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'No token found' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = auth;
