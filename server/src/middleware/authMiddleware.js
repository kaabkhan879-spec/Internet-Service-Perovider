const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set in environment variables. JWT authentication is unconfigured.');
}

/**
 * Middleware to enforce authentication using JWT token.
 * Extracts token from HTTP-only cookie or Authorization header.
 */
async function requireAuth(req, res, next) {
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
    
    // Validate that the user account status in database is active
    const userStatus = await db.query('SELECT status FROM users WHERE id = $1', [decoded.id]);
    if (userStatus.rows.length === 0 || userStatus.rows[0].status !== 'active') {
      return res.status(401).json({ 
        error: 'Account Deactivated', 
        message: 'Your account has been deactivated by the administrator. Please contact your administrator for assistance.' 
      });
    }

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

/**
 * Middleware to enforce Employee or Admin access.
 * Must be executed AFTER requireAuth.
 */
function requireEmployee(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. User context missing.' });
  }

  if (req.user.role !== 'employee' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Employee access required.' });
  }

  next();
}

/**
 * Middleware to enforce Technician or Admin access.
 * Must be executed AFTER requireAuth.
 */
function requireTechnician(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. User context missing.' });
  }

  if (req.user.role !== 'technician' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Technician access required.' });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireEmployee,
  requireTechnician
};
