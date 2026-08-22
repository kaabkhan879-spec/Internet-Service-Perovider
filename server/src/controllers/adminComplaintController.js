const db = require('../config/db');

/**
 * List all complaints with customer name/code/phone search and status/priority filters
 * GET /api/admin/complaints
 */
async function listComplaints(req, res) {
  const { search, status, priority } = req.query;

  try {
    let queryStr = `
      SELECT 
        comp.id, comp.customer_id, comp.assigned_employee_id, comp.subject, comp.description, comp.priority, comp.status, comp.created_at, comp.updated_at, comp.resolved_at,
        c.full_name as customer_name, c.customer_code,
        e.full_name as employee_name
      FROM complaints comp
      JOIN customers c ON comp.customer_id = c.id
      LEFT JOIN employees e ON comp.assigned_employee_id = e.id
    `;

    const queryParams = [];
    const filters = [];

    if (search && search.trim() !== '') {
      const paramVal = `%${search.trim()}%`;
      queryParams.push(paramVal);
      
      // If search is numeric, check exact ID match as well
      const searchNum = parseInt(search.trim(), 10);
      if (!isNaN(searchNum)) {
        queryParams.push(searchNum);
        filters.push(`(c.full_name ILIKE $1 OR c.customer_code ILIKE $1 OR comp.subject ILIKE $1 OR comp.id = $2)`);
      } else {
        filters.push(`(c.full_name ILIKE $1 OR c.customer_code ILIKE $1 OR comp.subject ILIKE $1)`);
      }
    }

    if (status) {
      if (status === 'pending') {
        filters.push(`(comp.status = 'pending' OR comp.status = 'open')`);
      } else {
        queryParams.push(status);
        filters.push(`comp.status = $${queryParams.length}`);
      }
    }

    if (priority) {
      queryParams.push(priority);
      filters.push(`comp.priority = $${queryParams.length}`);
    }

    if (filters.length > 0) {
      queryStr += ' WHERE ' + filters.join(' AND ');
    }

    queryStr += ' ORDER BY comp.created_at DESC, comp.id DESC;';

    const result = await db.query(queryStr, queryParams);
    return res.json(result.rows);
  } catch (err) {
    console.error('[AdminComplaintController] Error listing complaints:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve complaint tickets.' });
  }
}

/**
 * Get details for a specific complaint, including updates/comments history log
 * GET /api/admin/complaints/:id
 */
async function getComplaintDetails(req, res) {
  const { id } = req.params;

  try {
    const compQuery = `
      SELECT 
        comp.id, comp.customer_id, comp.assigned_employee_id, comp.subject, comp.description, comp.priority, comp.status, comp.created_at, comp.updated_at, comp.resolved_at,
        c.full_name as customer_name, c.customer_code, c.phone as customer_phone, c.email as customer_email,
        e.full_name as employee_name, e.employee_code
      FROM complaints comp
      JOIN customers c ON comp.customer_id = c.id
      LEFT JOIN employees e ON comp.assigned_employee_id = e.id
      WHERE comp.id = $1;
    `;
    const compResult = await db.query(compQuery, [id]);
    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint ticket not found.' });
    }

    const updatesQuery = `
      SELECT 
        cu.id, cu.complaint_id, cu.employee_id, cu.status, cu.comment, cu.created_at,
        e.full_name as employee_name
      FROM complaint_updates cu
      LEFT JOIN employees e ON cu.employee_id = e.id
      WHERE cu.complaint_id = $1
      ORDER BY cu.created_at ASC, cu.id ASC;
    `;
    const updatesResult = await db.query(updatesQuery, [id]);

    const reportQuery = `
      SELECT w.*, e.full_name as employee_name 
      FROM work_reports w
      LEFT JOIN employees e ON w.employee_id = e.id
      WHERE w.complaint_id = $1;
    `;
    const reportResult = await db.query(reportQuery, [id]);

    return res.json({
      complaint: compResult.rows[0],
      updates: updatesResult.rows,
      work_report: reportResult.rows[0] || null
    });
  } catch (err) {
    console.error('[AdminComplaintController] Error getting details:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve ticket history details.' });
  }
}

/**
 * Assign a complaint to an active technician/employee (Preventing inactive assignments)
 * PATCH /api/admin/complaints/:id/assign
 */
async function assignComplaint(req, res) {
  const { id } = req.params;
  const { assigned_employee_id } = req.body;

  try {
    // 1. Check if complaint ticket exists
    const compCheck = await db.query('SELECT status FROM complaints WHERE id = $1', [id]);
    if (compCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint ticket not found.' });
    }

    const currentStatus = compCheck.rows[0].status;
    let employeeName = 'Unassigned';

    // 2. Validate selected employee status
    if (assigned_employee_id) {
      const empQuery = 'SELECT full_name, status FROM employees WHERE id = $1';
      const empResult = await db.query(empQuery, [assigned_employee_id]);
      if (empResult.rows.length === 0) {
        return res.status(400).json({ error: 'Selected employee does not exist.' });
      }

      if (empResult.rows[0].status !== 'active') {
        return res.status(400).json({ error: 'Cannot assign complaints to inactive employee accounts.' });
      }

      employeeName = empResult.rows[0].full_name;
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 3. Update assigned employee
      const targetEmp = assigned_employee_id || null;
      await client.query(`
        UPDATE complaints
        SET assigned_employee_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2;
      `, [targetEmp, id]);

      // 4. Log the update to complaint history
      const logComment = targetEmp 
        ? `Complaint assigned to employee ${employeeName}.` 
        : 'Complaint unassigned.';
      
      await client.query(`
        INSERT INTO complaint_updates (complaint_id, employee_id, status, comment)
        VALUES ($1, NULL, $2, $3);
      `, [id, currentStatus, logComment]);

      await client.query('COMMIT');
      return res.json({ message: 'Complaint assignment updated successfully.', employeeName });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[AdminComplaintController] Error assigning complaint:', err.message);
    return res.status(500).json({ error: 'Failed to update ticket assignment.' });
  }
}

/**
 * Transition complaint status and preserve history
 * PATCH /api/admin/complaints/:id/status
 */
async function changeStatus(req, res) {
  const { id } = req.params;
  const { status, comment } = req.body;

  const validStatuses = ['pending', 'open', 'in_progress', 'resolved', 'closed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status transition parameters are required.' });
  }

  try {
    const compCheck = await db.query('SELECT status FROM complaints WHERE id = $1', [id]);
    if (compCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint ticket not found.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Calculate resolved timestamp
      let resolvedAtVal = null;
      if (status === 'resolved') {
        resolvedAtVal = new Date().toISOString();
      }

      // 2. Update complaint status
      await client.query(`
        UPDATE complaints
        SET status = $1, resolved_at = COALESCE($2, resolved_at), updated_at = CURRENT_TIMESTAMP
        WHERE id = $3;
      `, [status, resolvedAtVal, id]);

      // 3. Log history entry
      const logComment = comment || `Status transition updated to ${status.toUpperCase().replace('_', ' ')}.`;
      await client.query(`
        INSERT INTO complaint_updates (complaint_id, employee_id, status, comment)
        VALUES ($1, NULL, $2, $3);
      `, [id, status, logComment]);

      await client.query('COMMIT');
      return res.json({ message: `Status updated successfully to ${status}.` });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[AdminComplaintController] Status transition error:', err.message);
    return res.status(500).json({ error: 'Failed to transition complaint status.' });
  }
}

/**
 * Add comment update to complaint history log
 * POST /api/admin/complaints/:id/updates
 */
async function addComment(req, res) {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment || comment.trim() === '') {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  try {
    const compCheck = await db.query('SELECT status FROM complaints WHERE id = $1', [id]);
    if (compCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint ticket not found.' });
    }

    const currentStatus = compCheck.rows[0].status;

    await db.query(`
      INSERT INTO complaint_updates (complaint_id, employee_id, status, comment)
      VALUES ($1, NULL, $2, $3);
    `, [id, currentStatus, comment.trim()]);

    return res.status(201).json({ message: 'Comment logged successfully.' });
  } catch (err) {
    console.error('[AdminComplaintController] Error adding comment:', err.message);
    return res.status(500).json({ error: 'Failed to log comment update.' });
  }
}

module.exports = {
  listComplaints,
  getComplaintDetails,
  assignComplaint,
  changeStatus,
  addComment
};
