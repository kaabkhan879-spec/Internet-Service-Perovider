const db = require('../config/db');
const { comparePassword } = require('../utils/password');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_only_for_dev';

/**
 * Handle Admin Authentication Login
 * POST /api/auth/login
 */
async function login(req, res) {
  const { email, password } = req.body;

  // 1. Basic inputs validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 2. Lookup the user and employee record
    const queryStr = `
      SELECT u.id, u.name, u.email, u.password_hash, u.role, u.status as user_status,
             e.status as employee_status
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      WHERE u.email = $1;
    `;
    const userResult = await db.query(queryStr, [email.trim().toLowerCase()]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    // 3. Confirm role is admin or employee
    if (user.role !== 'admin' && user.role !== 'employee') {
      return res.status(403).json({ error: 'Forbidden. Access restricted to administrator or employee accounts.' });
    }

    // 4. Verify account status
    if (user.role === 'admin') {
      if (user.user_status !== 'active') {
        return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
      }
    } else if (user.role === 'employee') {
      if (user.user_status !== 'active' || user.employee_status !== 'active') {
        return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
      }
    }

    // 5. Verify the password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 6. Generate JSON Web Token (JWT)
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 7. Store JWT in secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // 8. Return sanitised user data (omit password_hash)
    return res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[AuthController] Login Error:', err.message);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
}

/**
 * Get authenticated user profile details
 * GET /api/auth/me
 */
async function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Profile missing.' });
  }

  // req.user has already been verified and populated by requireAuth middleware
  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
}

/**
 * Handle Admin Authentication Logout
 * POST /api/auth/logout
 */
async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
}

module.exports = {
  login,
  me,
  logout
};
