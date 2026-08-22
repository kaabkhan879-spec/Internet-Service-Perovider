const db = require('../config/db');
const { hashPassword } = require('../utils/password');

/**
 * List all employees with search filters
 * GET /api/admin/employees
 */
async function listEmployees(req, res) {
  const { search } = req.query;

  try {
    let queryStr = `
      SELECT 
        e.id, e.user_id, e.employee_code, e.full_name, e.phone, e.cnic, e.address, e.designation, e.role, e.status,
        u.email, e.created_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
    `;

    const queryParams = [];
    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      queryStr += `
        WHERE e.full_name ILIKE $1 
           OR u.email ILIKE $1 
           OR e.phone ILIKE $1 
           OR e.employee_code ILIKE $1
      `;
    }

    queryStr += ' ORDER BY e.id DESC;';

    const result = await db.query(queryStr, queryParams);
    return res.json(result.rows);
  } catch (err) {
    console.error('[AdminEmployeeController] Error listing employees:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve employee roster.' });
  }
}

/**
 * Get details for a specific employee, including their assigned support tickets
 * GET /api/admin/employees/:id
 */
async function getEmployeeDetails(req, res) {
  const { id } = req.params;

  try {
    const empQuery = `
      SELECT 
        e.id, e.user_id, e.employee_code, e.full_name, e.phone, e.cnic, e.address, e.designation, e.role, e.status,
        u.email, e.created_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $1;
    `;
    const empResult = await db.query(empQuery, [id]);
    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const employee = empResult.rows[0];

    // Fetch assigned complaints
    const complaintsQuery = `
      SELECT id, subject, status, priority, created_at
      FROM complaints
      WHERE assigned_employee_id = $1
      ORDER BY created_at DESC;
    `;
    const complaintsResult = await db.query(complaintsQuery, [id]);

    // Return profile data. Include empty array for tasks since tasks table does not exist in schema yet
    return res.json({
      employee,
      complaints: complaintsResult.rows,
      tasks: []
    });
  } catch (err) {
    console.error('[AdminEmployeeController] Error fetching details:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve employee file.' });
  }
}

/**
 * Provision a new employee and securely hash their password (Preventing plain-text storage)
 * POST /api/admin/employees
 */
async function createEmployee(req, res) {
  const { full_name, email, phone, cnic, address, designation, role, password, status } = req.body;

  // 1. Basic validation
  if (!full_name || !email || !role || !password) {
    return res.status(400).json({ error: 'Full name, email, role, and password are required.' });
  }

  if (!['Employee', 'Technician'].includes(role)) {
    return res.status(400).json({ error: 'Valid role designation ("Employee" or "Technician") is required.' });
  }

  try {
    // 2. Prevent duplicate user profiles by email
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // 3. Securely hash password using bcrypt
    const passwordHash = await hashPassword(password);

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 4. Create user record (Non-admin staff have role = 'employee' in users table)
      const userStatusVal = status || 'active';
      const userResult = await client.query(`
        INSERT INTO users (name, email, password_hash, role, status)
        VALUES ($1, $2, $3, 'employee', $4)
        RETURNING id;
      `, [full_name, email.trim().toLowerCase(), passwordHash, userStatusVal]);

      const userId = userResult.rows[0].id;

      // 5. Generate employee code
      const employeeCode = 'EMP-' + Math.floor(100000 + Math.random() * 900000);

      // 6. Insert employee record
      await client.query(`
        INSERT INTO employees (user_id, employee_code, full_name, phone, cnic, address, designation, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `, [
        userId,
        employeeCode,
        full_name,
        phone || '',
        cnic || '',
        address || '',
        designation || '',
        role,
        userStatusVal
      ]);

      await client.query('COMMIT');
      return res.status(201).json({ message: 'Employee provisioned successfully.', employeeCode });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[AdminEmployeeController] Error creating employee:', err.message);
    return res.status(500).json({ error: 'Failed to provision employee.' });
  }
}

/**
 * Update employee record
 * PUT /api/admin/employees/:id
 */
async function updateEmployee(req, res) {
  const { id } = req.params;
  const { full_name, email, phone, cnic, address, designation, role, status } = req.body;

  if (!full_name || !email || !role) {
    return res.status(400).json({ error: 'Full name, email, and role are required.' });
  }

  if (!['Employee', 'Technician'].includes(role)) {
    return res.status(400).json({ error: 'Valid role designation ("Employee" or "Technician") is required.' });
  }

  try {
    const checkEmp = await db.query('SELECT user_id FROM employees WHERE id = $1', [id]);
    if (checkEmp.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const userId = checkEmp.rows[0].user_id;

    // Check duplicate email
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.trim().toLowerCase(), userId]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Another account with this email address already exists.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const empStatusVal = status || 'active';

      // 1. Update employee record
      await client.query(`
        UPDATE employees
        SET full_name = $1, phone = $2, cnic = $3, address = $4, designation = $5, role = $6, status = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8;
      `, [full_name, phone || '', cnic || '', address || '', designation || '', role, empStatusVal, id]);

      // 2. Update users credentials record
      await client.query(`
        UPDATE users
        SET name = $1, email = $2, status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4;
      `, [full_name, email.trim().toLowerCase(), empStatusVal, userId]);

      await client.query('COMMIT');
      return res.json({ message: 'Employee profile updated successfully.' });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[AdminEmployeeController] Error updating employee:', err.message);
    return res.status(500).json({ error: 'Failed to update employee details.' });
  }
}

/**
 * Toggle employee status (Active / Inactive)
 * PATCH /api/admin/employees/:id/status
 */
async function toggleEmployeeStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Valid status ("active" or "inactive") is required.' });
  }

  try {
    const checkEmp = await db.query('SELECT user_id FROM employees WHERE id = $1', [id]);
    if (checkEmp.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const userId = checkEmp.rows[0].user_id;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update employee
      await client.query('UPDATE employees SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);

      // Update user credentials
      await client.query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, userId]);

      await client.query('COMMIT');
      return res.json({ message: `Employee status successfully set to ${status}.` });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[AdminEmployeeController] Error toggling employee status:', err.message);
    return res.status(500).json({ error: 'Failed to toggle employee active status.' });
  }
}

/**
 * Change employee login password
 * PATCH /api/admin/employees/:id/password
 */
async function changeEmployeePassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'New password is required.' });
  }

  try {
    const checkEmp = await db.query('SELECT user_id FROM employees WHERE id = $1', [id]);
    if (checkEmp.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const userId = checkEmp.rows[0].user_id;

    // Securely hash the password
    const passwordHash = await hashPassword(password);

    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, userId]);

    return res.json({ message: 'Employee password updated successfully.' });
  } catch (err) {
    console.error('[AdminEmployeeController] Error changing password:', err.message);
    return res.status(500).json({ error: 'Failed to update employee login password.' });
  }
}

module.exports = {
  listEmployees,
  getEmployeeDetails,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  changeEmployeePassword
};
