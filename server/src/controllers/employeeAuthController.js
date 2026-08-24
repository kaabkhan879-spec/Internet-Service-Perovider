const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { comparePassword } = require('../utils/password');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_only_for_dev';

/**
 * Log in an employee or technician, checking active statuses
 * POST /api/employee/login
 */
async function employeeLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 1. Fetch user and employee profiles from database
    const queryStr = `
      SELECT u.id, u.name, u.email, u.password_hash, u.role, u.status as user_status,
             e.id as employee_id, e.employee_code, e.role as employee_role, e.status as employee_status
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id
      WHERE u.email = $1;
    `;
    const result = await db.query(queryStr, [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Verify it is an employee role user
    if (user.role !== 'employee') {
      return res.status(403).json({ error: 'Forbidden. Access restricted to employee accounts.' });
    }

    // 2. Assert active account status
    if (user.user_status !== 'active' || user.employee_status !== 'active') {
      return res.status(403).json({
        error: 'Account Deactivated',
        message: 'Your account has been deactivated by the administrator. Please contact your administrator for assistance.'
      });
    }

    // 3. Verify password securely
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Generate authenticated JWT session
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role // 'employee'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 5. Store JWT in secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Log login activity
    try {
      await db.query('INSERT INTO employee_activities (employee_id, action) VALUES ($1, $2)', [user.employee_id, 'Login']);
    } catch (e) {
      console.error('[EmployeeAuthController] Activity logging failed:', e.message);
    }

    // 6. Return sanitized user context
    return res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee_role: user.employee_role,
        employee_code: user.employee_code
      }
    });
  } catch (err) {
    console.error('[EmployeeAuthController] Login error:', err.message);
    return res.status(500).json({ error: 'Database error occurred during login.' });
  }
}

/**
 * Retrieve current authenticated employee profile
 * GET /api/employee/profile
 */
async function employeeProfile(req, res) {
  try {
    const queryStr = `
      SELECT u.id, u.name, u.email, u.role,
             e.id as employee_id, e.employee_code, e.phone, e.cnic, e.address, e.designation, e.role as employee_role, e.status, e.created_at
      FROM users u
      JOIN employees e ON e.user_id = u.id
      WHERE u.id = $1;
    `;
    const result = await db.query(queryStr, [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee profile not found.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[EmployeeAuthController] Error loading profile:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve profile information.' });
  }
}

module.exports = {
  employeeLogin,
  employeeProfile
};
