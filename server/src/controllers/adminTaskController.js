const db = require('../config/db');

/**
 * Create a new technical task
 */
async function createTask(req, res) {
  const { task_type, customer_id, assigned_employee_id, description, priority, admin_notes, due_date } = req.body;

  if (!task_type || !customer_id || !assigned_employee_id) {
    return res.status(400).json({ error: 'Task type, customer ID, and assigned employee ID are required.' });
  }

  try {
    const queryStr = `
      INSERT INTO technical_tasks (task_type, customer_id, assigned_employee_id, description, priority, admin_notes, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const result = await db.query(queryStr, [
      task_type,
      customer_id,
      assigned_employee_id,
      description || '',
      priority || 'medium',
      admin_notes || '',
      due_date || null
    ]);

    // Push notification to the employee
    const task = result.rows[0];
    await db.query(
      `INSERT INTO employee_notifications (employee_id, title, message)
       VALUES ($1, $2, $3)`,
      [
        assigned_employee_id,
        'New Technical Task Assigned',
        `You have been assigned a new task: ${task_type}. Due by ${due_date || 'N/A'}.`
      ]
    );

    return res.json({ message: 'Technical task created and assigned successfully.', task });
  } catch (err) {
    console.error('[AdminTaskController] createTask error:', err.message);
    return res.status(500).json({ error: 'Failed to create technical task.' });
  }
}

/**
 * List all technical tasks
 */
async function listTasks(req, res) {
  try {
    const queryStr = `
      SELECT t.*, cust.full_name as customer_name, cust.phone as customer_phone, cust.address as customer_address,
             emp.full_name as employee_name
      FROM technical_tasks t
      JOIN customers cust ON cust.id = t.customer_id
      LEFT JOIN employees emp ON emp.id = t.assigned_employee_id
      ORDER BY t.created_at DESC;
    `;
    const result = await db.query(queryStr);
    return res.json(result.rows);
  } catch (err) {
    console.error('[AdminTaskController] listTasks error:', err.message);
    return res.status(500).json({ error: 'Failed to list technical tasks.' });
  }
}

/**
 * List all work reports submitted by technicians
 */
async function listWorkReports(req, res) {
  try {
    const queryStr = `
      SELECT w.*, 
             c.subject as complaint_subject,
             t.task_type as task_type,
             emp.full_name as employee_name, emp.employee_code
      FROM work_reports w
      LEFT JOIN complaints c ON c.id = w.complaint_id
      LEFT JOIN technical_tasks t ON t.id = w.task_id
      LEFT JOIN employees emp ON emp.id = w.employee_id
      ORDER BY w.created_at DESC;
    `;
    const result = await db.query(queryStr);
    return res.json(result.rows);
  } catch (err) {
    console.error('[AdminTaskController] listWorkReports error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve work reports.' });
  }
}

module.exports = {
  createTask,
  listTasks,
  listWorkReports
};
