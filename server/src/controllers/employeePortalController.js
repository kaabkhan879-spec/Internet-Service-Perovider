const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');

// Helper to get employee ID from user ID
async function getEmployeeId(userId) {
  const result = await db.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new Error('Employee profile context not found.');
  }
  return result.rows[0].id;
}

/**
 * Get assigned complaints
 */
async function getAssignedComplaints(req, res) {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const queryStr = `
      SELECT c.id, c.subject, c.description, c.priority, c.status, c.created_at, c.resolved_at,
             cust.full_name as customer_name, cust.phone as customer_phone, cust.address as customer_address
      FROM complaints c
      JOIN customers cust ON cust.id = c.customer_id
      WHERE c.assigned_employee_id = $1
      ORDER BY c.created_at DESC;
    `;
    const result = await db.query(queryStr, [employeeId]);
    return res.json(result.rows);
  } catch (err) {
    console.error('[EmployeePortalController] getAssignedComplaints error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to retrieve complaints.' });
  }
}

/**
 * Update complaint status
 */
async function updateComplaintStatus(req, res) {
  const { id } = req.params;
  const { status, comment } = req.body;

  const validStatuses = ['pending', 'open', 'in_progress', 'resolved', 'closed', 'on_the_way'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid complaint status.' });
  }

  try {
    const employeeId = await getEmployeeId(req.user.id);
    
    // Ownership check
    const checkRes = await db.query('SELECT id, status FROM complaints WHERE id = $1 AND assigned_employee_id = $2', [id, employeeId]);
    if (checkRes.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You cannot modify complaints assigned to others.' });
    }

    const currentStatus = checkRes.rows[0].status;

    // Map status if technician chooses 'on_the_way' (we can treat it as 'in_progress' or map it in updates)
    const dbStatus = status === 'on_the_way' ? 'in_progress' : status;

    await db.query(
      `UPDATE complaints 
       SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END 
       WHERE id = $2`, 
      [dbStatus, id]
    );

    // Insert log to complaint_updates
    const updateComment = comment || `Technician changed status from '${currentStatus}' to '${status}'.`;
    await db.query(
      'INSERT INTO complaint_updates (complaint_id, employee_id, status, comment) VALUES ($1, $2, $3, $4)',
      [id, employeeId, dbStatus, updateComment]
    );

    return res.json({ message: 'Complaint status updated successfully.' });
  } catch (err) {
    console.error('[EmployeePortalController] updateComplaintStatus error:', err.message);
    return res.status(500).json({ error: 'Failed to update complaint status.' });
  }
}

/**
 * Get assigned technical tasks
 */
async function getAssignedTasks(req, res) {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const queryStr = `
      SELECT t.id, t.task_type, t.description, t.priority, t.status, t.admin_notes, t.due_date, t.created_at, t.completed_at,
             cust.full_name as customer_name, cust.phone as customer_phone, cust.address as customer_address
      FROM technical_tasks t
      JOIN customers cust ON cust.id = t.customer_id
      WHERE t.assigned_employee_id = $1
      ORDER BY t.created_at DESC;
    `;
    const result = await db.query(queryStr, [employeeId]);
    return res.json(result.rows);
  } catch (err) {
    console.error('[EmployeePortalController] getAssignedTasks error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve technical tasks.' });
  }
}

/**
 * Update technical task status
 */
async function updateTaskStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['assigned', 'on_the_way', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid task status.' });
  }

  try {
    const employeeId = await getEmployeeId(req.user.id);

    // Ownership check
    const checkRes = await db.query('SELECT id FROM technical_tasks WHERE id = $1 AND assigned_employee_id = $2', [id, employeeId]);
    if (checkRes.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You cannot modify tasks assigned to others.' });
    }

    await db.query(
      `UPDATE technical_tasks 
       SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END 
       WHERE id = $2`, 
      [status, id]
    );

    return res.json({ message: 'Task status updated successfully.' });
  } catch (err) {
    console.error('[EmployeePortalController] updateTaskStatus error:', err.message);
    return res.status(500).json({ error: 'Failed to update task status.' });
  }
}

/**
 * Submit work report
 */
async function submitWorkReport(req, res) {
  const { complaint_id, task_id, problem_found, work_performed, solution, equipment_used, additional_notes } = req.body;

  try {
    const employeeId = await getEmployeeId(req.user.id);

    // Enforce ownership checks
    if (complaint_id) {
      const checkRes = await db.query('SELECT id FROM complaints WHERE id = $1 AND assigned_employee_id = $2', [complaint_id, employeeId]);
      if (checkRes.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied. Complaint ownership mismatch.' });
      }
    }
    if (task_id) {
      const checkRes = await db.query('SELECT id FROM technical_tasks WHERE id = $1 AND assigned_employee_id = $2', [task_id, employeeId]);
      if (checkRes.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied. Task ownership mismatch.' });
      }
    }

    const queryStr = `
      INSERT INTO work_reports (complaint_id, task_id, employee_id, problem_found, work_performed, solution, equipment_used, additional_notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const result = await db.query(queryStr, [
      complaint_id || null,
      task_id || null,
      employeeId,
      problem_found,
      work_performed,
      solution,
      equipment_used,
      additional_notes
    ]);

    return res.json({ message: 'Work report logged successfully.', report: result.rows[0] });
  } catch (err) {
    console.error('[EmployeePortalController] submitWorkReport error:', err.message);
    return res.status(500).json({ error: 'Failed to submit work report.' });
  }
}

/**
 * Get work history
 */
async function getWorkHistory(req, res) {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const queryStr = `
      SELECT 
        t.id, 
        'task' as type, 
        t.task_type as work_type, 
        t.description, 
        t.priority, 
        t.status, 
        t.created_at,
        t.completed_at as completed_date, 
        cust.full_name as customer_name,
        cust.phone as customer_phone,
        cust.address as customer_address,
        cust.customer_code,
        wr.problem_found, 
        wr.work_performed, 
        wr.solution, 
        wr.equipment_used, 
        wr.additional_notes,
        wr.created_at as report_created_at
      FROM technical_tasks t
      JOIN customers cust ON cust.id = t.customer_id
      LEFT JOIN work_reports wr ON wr.task_id = t.id
      WHERE t.assigned_employee_id = $1 AND t.status = 'completed'
      UNION ALL
      SELECT 
        c.id, 
        'complaint' as type, 
        c.subject as work_type, 
        c.description, 
        c.priority, 
        c.status, 
        c.created_at,
        c.resolved_at as completed_date, 
        cust.full_name as customer_name,
        cust.phone as customer_phone,
        cust.address as customer_address,
        cust.customer_code,
        wr.problem_found, 
        wr.work_performed, 
        wr.solution, 
        wr.equipment_used, 
        wr.additional_notes,
        wr.created_at as report_created_at
      FROM complaints c
      JOIN customers cust ON cust.id = c.customer_id
      LEFT JOIN work_reports wr ON wr.complaint_id = c.id
      WHERE c.assigned_employee_id = $1 AND c.status = 'resolved'
      ORDER BY completed_date DESC;
    `;
    const result = await db.query(queryStr, [employeeId]);
    return res.json(result.rows);
  } catch (err) {
    console.error('[EmployeePortalController] getWorkHistory error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve completed work history.' });
  }
}

/**
 * Get notifications list
 */
async function getNotifications(req, res) {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const result = await db.query(
      'SELECT * FROM employee_notifications WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 50',
      [employeeId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[EmployeePortalController] getNotifications error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
}

/**
 * Get unread notification counts
 */
async function getUnreadNotificationsCount(req, res) {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const result = await db.query(
      'SELECT COUNT(*) FROM employee_notifications WHERE employee_id = $1 AND is_read = FALSE',
      [employeeId]
    );
    return res.json({ count: parseInt(result.rows[0].count, 10) || 0 });
  } catch (err) {
    console.error('[EmployeePortalController] getUnreadNotificationsCount error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve notifications count.' });
  }
}

/**
 * Mark notifications as read
 */
async function markNotificationsAsRead(req, res) {
  try {
    const employeeId = await getEmployeeId(req.user.id);
    const { id } = req.body;
    if (id) {
      await db.query('UPDATE employee_notifications SET is_read = TRUE WHERE employee_id = $1 AND id = $2', [employeeId, id]);
      return res.json({ success: true, message: 'Notification marked as read.' });
    } else {
      await db.query('UPDATE employee_notifications SET is_read = TRUE WHERE employee_id = $1', [employeeId]);
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }
  } catch (err) {
    console.error('[EmployeePortalController] markNotificationsAsRead error:', err.message);
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
}

/**
 * Change employee password
 */
async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old and new passwords are required.' });
  }

  try {
    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const isMatch = await comparePassword(oldPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashed = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, req.user.id]);
    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[EmployeePortalController] changePassword error:', err.message);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
}

/**
 * Update profile phone or address
 */
async function updateProfile(req, res) {
  const { phone, address } = req.body;

  try {
    await db.query(
      'UPDATE employees SET phone = $1, address = $2 WHERE user_id = $3',
      [phone, address, req.user.id]
    );
    return res.json({ message: 'Profile details updated successfully.' });
  } catch (err) {
    console.error('[EmployeePortalController] updateProfile error:', err.message);
    return res.status(500).json({ error: 'Failed to update profile information.' });
  }
}

/**
 * Get ISP operations data for employee portal dashboard
 */
async function getOperationsDashboardData(req, res) {
  try {
    const totalCustomersQuery = db.query('SELECT COUNT(*)::int FROM customers');
    const activeServicesQuery = db.query("SELECT COUNT(*)::int FROM subscriptions WHERE status = 'active'");
    const pendingRequestsQuery = db.query("SELECT COUNT(*)::int FROM technical_tasks WHERE status != 'completed'");
    const openComplaintsQuery = db.query("SELECT COUNT(*)::int FROM complaints WHERE status IN ('pending', 'open', 'in_progress')");
    const todayInstallationsQuery = db.query("SELECT COUNT(*)::int FROM technical_tasks WHERE task_type = 'Installation' AND due_date = CURRENT_DATE");
    const pendingPaymentsQuery = db.query("SELECT COUNT(*)::int FROM bills WHERE status IN ('unpaid', 'overdue')");

    const recentRequestsQuery = db.query(`
      SELECT t.id, t.task_type, t.priority, t.status, t.due_date, t.created_at, cust.full_name as customer_name, emp.full_name as technician_name
      FROM technical_tasks t
      JOIN customers cust ON t.customer_id = cust.id
      LEFT JOIN employees emp ON t.assigned_employee_id = emp.id
      ORDER BY t.created_at DESC
      LIMIT 10;
    `);

    const recentComplaintsQuery = db.query(`
      SELECT c.id, c.subject, c.priority, c.status, c.created_at, cust.full_name as customer_name, emp.full_name as technician_name
      FROM complaints c
      JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN employees emp ON c.assigned_employee_id = emp.id
      ORDER BY c.created_at DESC
      LIMIT 10;
    `);

    const todayInstallationsListQuery = db.query(`
      SELECT t.id, t.task_type, t.due_date, cust.full_name as customer_name, emp.full_name as technician_name, cust.address as customer_address, t.status
      FROM technical_tasks t
      JOIN customers cust ON t.customer_id = cust.id
      LEFT JOIN employees emp ON t.assigned_employee_id = emp.id
      WHERE t.task_type = 'Installation' AND t.due_date = CURRENT_DATE
      ORDER BY t.created_at ASC;
    `);

    const techniciansQuery = db.query(`
      SELECT emp.id, emp.full_name as name, emp.status, emp.designation, emp.phone,
        (SELECT COUNT(*)::int FROM technical_tasks WHERE assigned_employee_id = emp.id AND status != 'completed') as active_jobs
      FROM employees emp
      WHERE emp.status = 'active'
      ORDER BY emp.full_name;
    `);

    const customersQuery = db.query(`
      SELECT c.id, c.customer_code, c.full_name as name, c.email, c.phone, c.address, c.status, c.created_at,
             p.name as package_name, p.speed_mbps, p.monthly_price::float as package_price
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id AND (s.status = 'active' OR s.status = 'suspended')
      LEFT JOIN packages p ON s.package_id = p.id
      ORDER BY c.created_at DESC;
    `);

    const billingQuery = db.query(`
      SELECT b.id as invoice_id, c.full_name as customer, b.amount::float as amount, b.status, b.due_date
      FROM bills b
      JOIN customers c ON b.customer_id = c.id
      ORDER BY b.created_at DESC;
    `);

    const packagesQuery = db.query(`
      SELECT id, name, speed_mbps, monthly_price::float as price, description, status
      FROM packages
      ORDER BY id ASC;
    `);

    const [
      totalCustomersRes,
      activeServicesRes,
      pendingRequestsRes,
      openComplaintsRes,
      todayInstallationsRes,
      pendingPaymentsRes,
      recentRequestsRes,
      recentComplaintsRes,
      todayInstallationsListRes,
      techniciansRes,
      customersRes,
      billingRes,
      packagesRes
    ] = await Promise.all([
      totalCustomersQuery,
      activeServicesQuery,
      pendingRequestsQuery,
      openComplaintsQuery,
      todayInstallationsQuery,
      pendingPaymentsQuery,
      recentRequestsQuery,
      recentComplaintsQuery,
      todayInstallationsListQuery,
      techniciansQuery,
      customersQuery,
      billingQuery,
      packagesQuery
    ]);

    return res.json({
      stats: {
        totalCustomers: totalCustomersRes.rows[0].count,
        activeServices: activeServicesRes.rows[0].count,
        pendingRequests: pendingRequestsRes.rows[0].count,
        openComplaints: openComplaintsRes.rows[0].count,
        todayInstallations: todayInstallationsRes.rows[0].count,
        pendingPayments: pendingPaymentsRes.rows[0].count
      },
      recentRequests: recentRequestsRes.rows,
      recentComplaints: recentComplaintsRes.rows,
      todayInstallationsList: todayInstallationsListRes.rows,
      technicians: techniciansRes.rows,
      customers: customersRes.rows,
      billing: billingRes.rows,
      packages: packagesRes.rows
    });
  } catch (err) {
    console.error('[EmployeePortalController] getOperationsDashboardData error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve operations dashboard statistics.' });
  }
}

/**
 * Provision a new customer profile via employee operations
 */
async function createCustomer(req, res) {
  const { full_name, phone, email, cnic, address, status, package_id } = req.body;
  if (!full_name || !phone || !email) {
    return res.status(400).json({ error: 'Full name, phone, and email are required fields.' });
  }
  try {
    const checkEmail = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const customerCode = `CUST-${randomDigits}`;
    const defaultPassword = 'customer123';
    const passwordHash = await hashPassword(defaultPassword);
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query(
        "INSERT INTO users (name, email, password_hash, role, status) VALUES ($1, $2, $3, 'customer', $4) RETURNING id",
        [full_name, email, passwordHash, status || 'active']
      );
      const userId = userRes.rows[0].id;
      const customerRes = await client.query(
        "INSERT INTO customers (user_id, customer_code, full_name, phone, email, address, cnic, status, installation_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
        [userId, customerCode, full_name, phone, email, address || null, cnic || null, status || 'active', new Date()]
      );
      const customerId = customerRes.rows[0].id;
      if (package_id) {
        await client.query(
          "INSERT INTO subscriptions (customer_id, package_id, start_date, status) VALUES ($1, $2, $3, 'active')",
          [customerId, package_id, new Date()]
        );
      }
      await client.query('COMMIT');
      return res.status(201).json({ message: 'Customer created successfully.', customer: { id: customerId, customer_code: customerCode, full_name } });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[EmployeePortalController] createCustomer error:', err.message);
    return res.status(500).json({ error: 'Failed to create customer.' });
  }
}

/**
 * File a new connection task via employee operations
 */
async function createTask(req, res) {
  const { task_type, customer_id, assigned_employee_id, description, priority, due_date } = req.body;
  if (!task_type || !customer_id || !assigned_employee_id) {
    return res.status(400).json({ error: 'Task type, customer ID, and assigned technician are required.' });
  }
  try {
    const queryStr = `
      INSERT INTO technical_tasks (task_type, customer_id, assigned_employee_id, description, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await db.query(queryStr, [
      task_type,
      customer_id,
      assigned_employee_id,
      description || '',
      priority || 'medium',
      due_date || null
    ]);
    const task = result.rows[0];
    await db.query(
      `INSERT INTO employee_notifications (employee_id, title, message) VALUES ($1, $2, $3)`,
      [assigned_employee_id, 'New Technical Task Assigned', `You have been assigned a new task: ${task_type}.`]
    );
    return res.json({ message: 'Technical task created successfully.', task });
  } catch (err) {
    console.error('[EmployeePortalController] createTask error:', err.message);
    return res.status(500).json({ error: 'Failed to create technical task.' });
  }
}

/**
 * Register a new customer complaint via employee operations
 */
async function createComplaint(req, res) {
  const { customer_id, subject, description, priority } = req.body;
  if (!customer_id || !subject || !description) {
    return res.status(400).json({ error: 'Customer ID, subject, and description are required.' });
  }
  try {
    const queryStr = `
      INSERT INTO complaints (customer_id, subject, description, priority, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *;
    `;
    const result = await db.query(queryStr, [
      customer_id,
      subject,
      description,
      priority || 'medium'
    ]);
    return res.json({ message: 'Complaint filed successfully.', complaint: result.rows[0] });
  } catch (err) {
    console.error('[EmployeePortalController] createComplaint error:', err.message);
    return res.status(500).json({ error: 'Failed to create complaint.' });
  }
}

/**
 * Assign a crew technician to a task or complaint
 */
async function assignTechnician(req, res) {
  const { type, ticketId, technicianId } = req.body;
  if (!type || !ticketId || !technicianId) {
    return res.status(400).json({ error: 'Type (task/complaint), ticket ID, and technician ID are required.' });
  }
  try {
    if (type === 'task') {
      await db.query(
        'UPDATE technical_tasks SET assigned_employee_id = $1 WHERE id = $2',
        [technicianId, ticketId]
      );
      await db.query(
        'INSERT INTO employee_notifications (employee_id, title, message) VALUES ($1, $2, $3)',
        [technicianId, 'Technical Task Assigned', `Task #${ticketId} has been assigned to you.`]
      );
    } else if (type === 'complaint') {
      await db.query(
        'UPDATE complaints SET assigned_employee_id = $1 WHERE id = $2',
        [technicianId, ticketId]
      );
      await db.query(
        'INSERT INTO employee_notifications (employee_id, title, message) VALUES ($1, $2, $3)',
        [technicianId, 'Complaint Ticket Assigned', `Complaint #${ticketId} has been assigned to you.`]
      );
    } else {
      return res.status(400).json({ error: 'Invalid assignment type.' });
    }
    return res.json({ message: 'Technician assigned successfully.' });
  } catch (err) {
    console.error('[EmployeePortalController] assignTechnician error:', err.message);
    return res.status(500).json({ error: 'Failed to assign technician.' });
  }
}

/**
 * Get detailed customer profile context for employee operations
 */
async function getCustomerDetails(req, res) {
  const { id } = req.params;
  try {
    // 1. Fetch customer details
    const customerQuery = `
      SELECT 
        c.*,
        p.id as package_id, p.name as package_name, p.monthly_price::float as monthly_price, p.speed_mbps,
        COALESCE((
          SELECT SUM(b.amount) 
          FROM bills b 
          WHERE b.customer_id = c.id AND b.status IN ('unpaid', 'overdue')
        ), 0)::float as outstanding_balance
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id AND (s.status = 'active' OR s.status = 'suspended')
      LEFT JOIN packages p ON s.package_id = p.id
      WHERE c.id = $1;
    `;
    const customerRes = await db.query(customerQuery, [id]);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    const customer = customerRes.rows[0];

    // 2. Fetch bills history
    const billsQuery = `
      SELECT id, billing_month, amount::float as amount, due_date, status, paid_at
      FROM bills
      WHERE customer_id = $1
      ORDER BY due_date DESC;
    `;
    const billsRes = await db.query(billsQuery, [id]);

    // 3. Fetch recent payments (latest 5)
    const paymentsQuery = `
      SELECT id, amount::float as amount, payment_method, transaction_reference, payment_date, status
      FROM payments
      WHERE customer_id = $1
      ORDER BY payment_date DESC
      LIMIT 5;
    `;
    const paymentsRes = await db.query(paymentsQuery, [id]);

    // 4. Fetch complaints
    const complaintsQuery = `
      SELECT id, subject, description, priority, status, created_at, resolved_at
      FROM complaints
      WHERE customer_id = $1
      ORDER BY created_at DESC;
    `;
    const complaintsRes = await db.query(complaintsQuery, [id]);

    // 5. Fetch technical tasks
    const tasksQuery = `
      SELECT id, task_type, description, priority, status, created_at, due_date, completed_at
      FROM technical_tasks
      WHERE customer_id = $1
      ORDER BY created_at DESC;
    `;
    const tasksRes = await db.query(tasksQuery, [id]);

    return res.json({
      customer,
      bills: billsRes.rows,
      payments: paymentsRes.rows,
      complaints: complaintsRes.rows,
      tasks: tasksRes.rows
    });
  } catch (err) {
    console.error('[EmployeePortalController] getCustomerDetails error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve customer details.' });
  }
}

/**
 * Edit Customer details via employee operations
 */
async function updateCustomer(req, res) {
  const { id } = req.params;
  const { full_name, phone, email, cnic, address } = req.body;
  if (!full_name || !phone || !email) {
    return res.status(400).json({ error: 'Full name, phone, and email are required.' });
  }
  try {
    const findCust = await db.query('SELECT user_id, email FROM customers WHERE id = $1', [id]);
    if (findCust.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    const { user_id, email: currentEmail } = findCust.rows[0];
    if (email !== currentEmail) {
      const checkEmail = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, user_id]);
      if (checkEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email address is already in use.' });
      }
    }
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET name = $1, email = $2 WHERE id = $3', [full_name, email, user_id]);
      await client.query('UPDATE customers SET full_name = $1, phone = $2, email = $3, cnic = $4, address = $5 WHERE id = $6', [full_name, phone, email, cnic || null, address || null, id]);
      await client.query('COMMIT');
      return res.json({ message: 'Customer updated successfully.' });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[EmployeePortalController] updateCustomer error:', err.message);
    return res.status(500).json({ error: 'Failed to update customer.' });
  }
}

/**
 * Toggle customer active/inactive/suspended status via employee operations
 */
async function toggleCustomerStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Valid status ("active", "inactive", "suspended") is required.' });
  }
  try {
    const findCust = await db.query('SELECT user_id FROM customers WHERE id = $1', [id]);
    if (findCust.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }
    const { user_id } = findCust.rows[0];
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET status = $1 WHERE id = $2', [status === 'inactive' ? 'inactive' : 'active', user_id]);
      await client.query('UPDATE customers SET status = $1 WHERE id = $2', [status, id]);
      await client.query('COMMIT');
      return res.json({ message: `Customer status updated to ${status.toUpperCase()} successfully.` });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[EmployeePortalController] toggleCustomerStatus error:', err.message);
    return res.status(500).json({ error: 'Failed to update customer status.' });
  }
}

module.exports = {
  getAssignedComplaints,
  updateComplaintStatus,
  getAssignedTasks,
  updateTaskStatus,
  submitWorkReport,
  getWorkHistory,
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationsAsRead,
  changePassword,
  updateProfile,
  getOperationsDashboardData,
  createCustomer,
  createTask,
  createComplaint,
  assignTechnician,
  getCustomerDetails,
  updateCustomer,
  toggleCustomerStatus
};
