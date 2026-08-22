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
      SELECT t.id, 'task' as type, t.task_type as work_type, t.description, t.priority, t.status, t.completed_at as completed_date, cust.full_name as customer_name
      FROM technical_tasks t
      JOIN customers cust ON cust.id = t.customer_id
      WHERE t.assigned_employee_id = $1 AND t.status = 'completed'
      UNION ALL
      SELECT c.id, 'complaint' as type, c.subject as work_type, c.description, c.priority, c.status, c.resolved_at as completed_date, cust.full_name as customer_name
      FROM complaints c
      JOIN customers cust ON cust.id = c.customer_id
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
    await db.query('UPDATE employee_notifications SET is_read = TRUE WHERE employee_id = $1', [employeeId]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
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
  updateProfile
};
