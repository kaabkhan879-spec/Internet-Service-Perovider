const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set in environment variables. JWT authentication is unconfigured.');
}

/**
 * Middleware to enforce authentication using JWT token.
 * Extracts token from HTTP-only cookie or Authorization header.
 */
function requireAuth(req, res, next) {
  let token = null;

  // 1. Try to read token from cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Authentication token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET || 'fallback_secret_only_for_dev');
    req.user = decoded; // Attaches { id, name, email, role }
    next();
  } catch (err) {
    console.error('[Middleware] JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
  }
}

/**
 * Middleware to enforce Admin-only access.
 * Must be executed AFTER requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. User context missing.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Administrative access required.' });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
