const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_only_for_dev';

/**
 * Handle Customer Authentication Login via CNIC and Password
 * POST /api/customer/login
 */
async function customerLogin(req, res) {
  const { cnic, password } = req.body;

  if (!cnic || !password) {
    return res.status(400).json({ error: 'CNIC number and password are required.' });
  }

  try {
    const cleanCnic = cnic.replace(/\D/g, '');
    console.log(`[CustomerLogin DEBUG] Attempting login for clean CNIC: "${cleanCnic}"`);
    
    // 1. Find user/customer associated with this CNIC
    const queryStr = `
      SELECT c.id as customer_id, c.full_name, c.email, c.status as customer_status, c.cnic as customer_cnic,
             u.id as user_id, u.password_hash, u.status as user_status, u.role as user_role
      FROM customers c
      JOIN users u ON c.user_id = u.id
      WHERE REGEXP_REPLACE(c.cnic, '\\D', '', 'g') = $1;
    `;
    const result = await db.query(queryStr, [cleanCnic]);
    console.log(`[CustomerLogin DEBUG] Query returned ${result.rows.length} rows.`);

    if (result.rows.length === 0) {
      console.log(`[CustomerLogin DEBUG] Customer found: false`);
      return res.status(401).json({ error: 'Invalid CNIC or password.' });
    }

    const account = result.rows[0];
    console.log(`[CustomerLogin DEBUG] Customer found: true`);
    console.log(`[CustomerLogin DEBUG] Auth account found: true`);
    console.log(`[CustomerLogin DEBUG] Role: ${account.user_role}`);
    console.log(`[CustomerLogin DEBUG] Password hash exists: ${!!account.password_hash}`);

    // Verify role is customer
    if (account.user_role !== 'customer') {
      console.log(`[CustomerLogin DEBUG] Forbidden. Role is not customer: ${account.user_role}`);
      return res.status(403).json({ error: 'Access restricted to customer accounts.' });
    }

    // 2. Validate status
    if (account.user_status !== 'active' || account.customer_status === 'inactive') {
      console.log(`[CustomerLogin DEBUG] Account is inactive or customer status is inactive`);
      return res.status(403).json({ error: 'Your account is inactive. Please contact support.' });
    }

    // 3. Verify the password
    const isMatch = await comparePassword(password, account.password_hash);
    console.log(`[CustomerLogin DEBUG] Password verification result: ${isMatch}`);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid CNIC or password.' });
    }

    // 4. Generate JSON Web Token (JWT)
    const token = jwt.sign(
      {
        id: account.user_id,
        customerId: account.customer_id,
        name: account.full_name,
        email: account.email,
        role: 'customer'
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

    // 6. Return sanitized user data
    return res.json({
      message: 'Login successful.',
      user: {
        id: account.user_id,
        customerId: account.customer_id,
        name: account.full_name,
        email: account.email,
        role: 'customer'
      }
    });
  } catch (err) {
    console.error('[CustomerSelfServiceController] Login Error:', err.message);
    return res.status(500).json({ error: 'Internal server error occurred during login.' });
  }
}

/**
 * Get Customer Dashboard stats and details
 * GET /api/customer/dashboard
 */
async function getCustomerDashboard(req, res) {
  const userId = req.user.id;

  try {
    // 1. Resolve customer context
    const customerQuery = `
      SELECT c.id, c.full_name, c.status as customer_status, p.name as package_name, p.speed_mbps
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id AND (s.status = 'active' OR s.status = 'suspended')
      LEFT JOIN packages p ON s.package_id = p.id
      WHERE c.user_id = $1;
    `;
    const customerRes = await db.query(customerQuery, [userId]);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer profile not found.' });
    }

    const customer = customerRes.rows[0];
    const customerId = customer.id;

    // 2. Fetch outstanding balance
    const outstandingRes = await db.query(
      "SELECT COALESCE(SUM(amount), 0)::float as outstanding FROM bills WHERE customer_id = $1 AND status IN ('unpaid', 'overdue')",
      [customerId]
    );

    // 3. Fetch count of open complaints
    const complaintsRes = await db.query(
      "SELECT COUNT(*)::int as count FROM complaints WHERE customer_id = $1 AND status IN ('pending', 'open', 'in_progress')",
      [customerId]
    );

    // 4. Fetch count of pending service requests
    const requestsRes = await db.query(
      "SELECT COUNT(*)::int as count FROM technical_tasks WHERE customer_id = $1 AND status IN ('assigned', 'accepted', 'on_the_way', 'in_progress', 'pending')",
      [customerId]
    );

    return res.json({
      fullName: customer.full_name,
      packageName: customer.package_name || 'No Active Package',
      speedMbps: customer.speed_mbps || 0,
      accountStatus: customer.customer_status,
      currentBill: outstandingRes.rows[0].outstanding,
      openComplaintsCount: complaintsRes.rows[0].count,
      pendingRequestsCount: requestsRes.rows[0].count
    });
  } catch (err) {
    console.error('[CustomerSelfServiceController] Dashboard Error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve dashboard information.' });
  }
}

/**
 * Get Customer Profile (safe fields only)
 * GET /api/customer/profile
 */
async function getCustomerProfile(req, res) {
  try {
    const query = `
      SELECT id, customer_code, full_name, phone, email, address, cnic, status, installation_date
      FROM customers
      WHERE user_id = $1;
    `;
    const result = await db.query(query, [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer profile not found.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[CustomerSelfServiceController] Profile Fetch Error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve profile details.' });
  }
}

/**
 * Update Customer Profile (safe fields only)
 * PUT /api/customer/profile
 */
async function updateCustomerProfile(req, res) {
  const { full_name, phone, email, address } = req.body;

  if (!full_name || !phone || !email) {
    return res.status(400).json({ error: 'Full name, phone, and email are required.' });
  }

  try {
    const userId = req.user.id;

    // Resolve customer profile
    const findCust = await db.query('SELECT id, email FROM customers WHERE user_id = $1', [userId]);
    if (findCust.rows.length === 0) {
      return res.status(404).json({ error: 'Customer profile not found.' });
    }

    const customerId = findCust.rows[0].id;
    const currentEmail = findCust.rows[0].email;

    // Verify email uniqueness if email has changed
    if (email.trim().toLowerCase() !== currentEmail.toLowerCase()) {
      const checkEmail = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.trim().toLowerCase(), userId]);
      if (checkEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email address is already registered to another account.' });
      }
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update users
      await client.query(
        'UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [full_name.trim(), email.trim().toLowerCase(), userId]
      );

      // 2. Update customers
      await client.query(
        'UPDATE customers SET full_name = $1, phone = $2, email = $3, address = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        [full_name.trim(), phone.trim(), email.trim().toLowerCase(), address ? address.trim() : null, customerId]
      );

      await client.query('COMMIT');
      return res.json({ message: 'Profile details updated successfully.' });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[CustomerSelfServiceController] Update Profile Error:', err.message);
    return res.status(500).json({ error: 'Failed to update profile details.' });
  }
}

/**
 * Change Customer Password
 * PUT /api/customer/change-password
 */
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  try {
    const userId = req.user.id;

    // Fetch user password hash
    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User context not found.' });
    }

    const isMatch = await comparePassword(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    // Hash and update
    const hashed = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashed, userId]);

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[CustomerSelfServiceController] Change Password Error:', err.message);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
}

/**
 * Get Internet Service Details
 * GET /api/customer/service
 */
async function getInternetService(req, res) {
  try {
    const query = `
      SELECT p.name as package_name, p.speed_mbps, p.monthly_price::float as monthly_price, p.description,
             s.start_date, s.status as service_status, c.installation_date
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id AND (s.status = 'active' OR s.status = 'suspended')
      LEFT JOIN packages p ON s.package_id = p.id
      WHERE c.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT 1;
    `;
    const result = await db.query(query, [req.user.id]);
    if (result.rows.length === 0 || !result.rows[0].package_name) {
      return res.json({ message: 'No active subscription found.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[CustomerSelfServiceController] Service Fetch Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch internet service details.' });
  }
}

/**
 * Get Billing History
 * GET /api/customer/billing
 */
async function getBillingHistory(req, res) {
  try {
    const query = `
      SELECT b.id, b.billing_month, b.amount::float as amount, b.due_date, b.status, b.paid_at
      FROM bills b
      JOIN customers c ON b.customer_id = c.id
      WHERE c.user_id = $1
      ORDER BY b.due_date DESC;
    `;
    const result = await db.query(query, [req.user.id]);
    return res.json(result.rows);
  } catch (err) {
    console.error('[CustomerSelfServiceController] Billing Fetch Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch billing history.' });
  }
}

/**
 * Get Customer Complaints
 * GET /api/customer/complaints
 */
async function getComplaints(req, res) {
  try {
    const query = `
      SELECT co.id, co.subject, co.description, co.priority, co.status, co.created_at, co.resolved_at, co.updated_at
      FROM complaints co
      JOIN customers c ON co.customer_id = c.id
      WHERE c.user_id = $1
      ORDER BY co.created_at DESC;
    `;
    const result = await db.query(query, [req.user.id]);
    return res.json(result.rows);
  } catch (err) {
    console.error('[CustomerSelfServiceController] Complaints Fetch Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch complaints list.' });
  }
}

/**
 * Submit Customer Complaint
 * POST /api/customer/complaints
 */
async function submitComplaint(req, res) {
  const { subject, description, priority, complaint_type } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required.' });
  }

  try {
    const userId = req.user.id;

    // Resolve customer context
    const customerRes = await db.query('SELECT id FROM customers WHERE user_id = $1', [userId]);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer context not found.' });
    }

    const customerId = customerRes.rows[0].id;
    const finalSubject = complaint_type ? `[${complaint_type}] ${subject}` : subject;

    const query = `
      INSERT INTO complaints (customer_id, subject, description, priority, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id;
    `;
    const result = await db.query(query, [customerId, finalSubject.trim(), description.trim(), priority || 'medium']);

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      id: result.rows[0].id
    });
  } catch (err) {
    console.error('[CustomerSelfServiceController] Submit Complaint Error:', err.message);
    return res.status(500).json({ error: 'Failed to submit complaint.' });
  }
}

/**
 * Get Complaint Details & Status Updates History
 * GET /api/customer/complaints/:id
 */
async function getComplaintDetails(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 1. Fetch details matching customer verification
    const query = `
      SELECT co.id, co.subject, co.description, co.priority, co.status, co.created_at, co.resolved_at, co.updated_at
      FROM complaints co
      JOIN customers c ON co.customer_id = c.id
      WHERE co.id = $1 AND c.user_id = $2;
    `;
    const result = await db.query(query, [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = result.rows[0];

    // 2. Fetch complaint updates
    const updatesQuery = `
      SELECT cu.status, cu.comment, cu.created_at, e.full_name as employee_name
      FROM complaint_updates cu
      LEFT JOIN employees e ON cu.employee_id = e.id
      WHERE cu.complaint_id = $1
      ORDER BY cu.created_at DESC;
    `;
    const updatesRes = await db.query(updatesQuery, [id]);

    return res.json({
      complaint,
      history: updatesRes.rows
    });
  } catch (err) {
    console.error('[CustomerSelfServiceController] Get Complaint Details Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch complaint details.' });
  }
}

/**
 * Get Technical / Service Requests
 * GET /api/customer/service-requests
 */
async function getServiceRequests(req, res) {
  try {
    const query = `
      SELECT t.id, t.task_type, t.description, t.priority, t.status, t.due_date, t.created_at, t.completed_at
      FROM technical_tasks t
      JOIN customers c ON t.customer_id = c.id
      WHERE c.user_id = $1
      ORDER BY t.created_at DESC;
    `;
    const result = await db.query(query, [req.user.id]);
    return res.json(result.rows);
  } catch (err) {
    console.error('[CustomerSelfServiceController] Fetch Service Requests Error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve service requests.' });
  }
}

/**
 * Submit New Technical / Service Request
 * POST /api/customer/service-requests
 */
async function submitServiceRequest(req, res) {
  const { request_type, description } = req.body;

  if (!request_type || !description) {
    return res.status(400).json({ error: 'Request type and description are required.' });
  }

  try {
    const userId = req.user.id;

    // Resolve customer context
    const customerRes = await db.query('SELECT id FROM customers WHERE user_id = $1', [userId]);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer context not found.' });
    }

    const customerId = customerRes.rows[0].id;

    const query = `
      INSERT INTO technical_tasks (task_type, customer_id, description, status, priority)
      VALUES ($1, $2, $3, 'pending', 'medium')
      RETURNING id;
    `;
    const result = await db.query(query, [request_type.trim(), customerId, description.trim()]);

    return res.status(201).json({
      message: 'Service request submitted successfully.',
      id: result.rows[0].id
    });
  } catch (err) {
    console.error('[CustomerSelfServiceController] Submit Service Request Error:', err.message);
    return res.status(500).json({ error: 'Failed to submit service request.' });
  }
}

module.exports = {
  customerLogin,
  getCustomerDashboard,
  getCustomerProfile,
  updateCustomerProfile,
  changePassword,
  getInternetService,
  getBillingHistory,
  getComplaints,
  submitComplaint,
  getComplaintDetails,
  getServiceRequests,
  submitServiceRequest
};
