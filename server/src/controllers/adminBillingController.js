const db = require('../config/db');

/**
 * Sync overdue statuses in database for any unpaid bills whose due date has passed
 */
async function syncOverdueBills() {
  try {
    await db.query(`
      UPDATE bills 
      SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'unpaid' AND due_date < CURRENT_DATE;
    `);
  } catch (err) {
    console.error('[Billing] Error syncing overdue statuses:', err.message);
  }
}

/**
 * List all generated bills with customer info, package details, and remaining balance calculations
 * GET /api/admin/bills
 */
async function listBills(req, res) {
  const { search, status, billing_month } = req.query;

  // Run overdue checks before fetching list
  await syncOverdueBills();

  try {
    let queryStr = `
      SELECT 
        b.id, b.customer_id, b.subscription_id, b.billing_month, b.amount::float as amount, b.due_date, b.status, b.paid_at,
        c.full_name as customer_name, c.customer_code, c.phone as customer_phone,
        p.name as package_name,
        COALESCE((SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND status != 'Failed'), 0)::float as total_paid,
        (b.amount - COALESCE((SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND status != 'Failed'), 0))::float as remaining_balance
      FROM bills b
      JOIN customers c ON b.customer_id = c.id
      LEFT JOIN subscriptions s ON b.subscription_id = s.id
      LEFT JOIN packages p ON s.package_id = p.id
    `;

    const queryParams = [];
    const filters = [];

    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      filters.push(`(c.full_name ILIKE $${queryParams.length} OR c.customer_code ILIKE $${queryParams.length} OR c.phone ILIKE $${queryParams.length})`);
    }

    if (status) {
      queryParams.push(status);
      filters.push(`b.status = $${queryParams.length}`);
    }

    if (billing_month) {
      queryParams.push(billing_month);
      filters.push(`b.billing_month = $${queryParams.length}`);
    }

    if (filters.length > 0) {
      queryStr += ' WHERE ' + filters.join(' AND ');
    }

    queryStr += ' ORDER BY b.due_date DESC, b.id DESC;';

    const result = await db.query(queryStr, queryParams);
    return res.json(result.rows);
  } catch (err) {
    console.error('[AdminBillingController] Error listing bills:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve billing records.' });
  }
}

/**
 * Get bill profile details, package characteristics, and associated payments history
 * GET /api/admin/bills/:id
 */
async function getBillDetails(req, res) {
  const { id } = req.params;

  try {
    const billQuery = `
      SELECT 
        b.id, b.customer_id, b.subscription_id, b.billing_month, b.amount::float as amount, b.due_date, b.status, b.paid_at,
        c.full_name as customer_name, c.customer_code, c.phone as customer_phone,
        p.name as package_name, p.speed_mbps, p.monthly_price::float as package_price,
        COALESCE((SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND status = 'completed'), 0)::float as total_paid,
        (b.amount - COALESCE((SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND status = 'completed'), 0))::float as remaining_balance
      FROM bills b
      JOIN customers c ON b.customer_id = c.id
      LEFT JOIN subscriptions s ON b.subscription_id = s.id
      LEFT JOIN packages p ON s.package_id = p.id
      WHERE b.id = $1;
    `;
    const billResult = await db.query(billQuery, [id]);
    if (billResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const paymentsQuery = `
      SELECT id, amount::float as amount, payment_method, transaction_reference, payment_date, status
      FROM payments
      WHERE bill_id = $1 AND status = 'completed'
      ORDER BY payment_date DESC;
    `;
    const paymentsResult = await db.query(paymentsQuery, [id]);

    return res.json({
      bill: billResult.rows[0],
      payments: paymentsResult.rows
    });
  } catch (err) {
    console.error('[AdminBillingController] Error loading details:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve invoice files.' });
  }
}

/**
 * Generate a new customer bill based on their active subscription monthly price (Preventing duplicates)
 * POST /api/admin/bills
 */
async function createBill(req, res) {
  const { customer_id, billing_month, due_date } = req.body;

  // 1. Basic validation
  if (!customer_id || !billing_month || !due_date) {
    return res.status(400).json({ error: 'Customer, billing month, and due date are required.' });
  }

  // Expect billing month format e.g. "2026-08"
  if (!/^\d{4}-\d{2}$/.test(billing_month)) {
    return res.status(400).json({ error: 'Billing month must be in YYYY-MM format.' });
  }

  try {
    // 2. Retrieve customer's active subscription and packages monthly price
    const subQuery = `
      SELECT s.id as subscription_id, p.monthly_price
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      WHERE s.customer_id = $1 AND s.status = 'active';
    `;
    const subResult = await db.query(subQuery, [customer_id]);
    if (subResult.rows.length === 0) {
      return res.status(400).json({ error: 'Selected customer does not have an active internet package subscription.' });
    }

    const { subscription_id, monthly_price } = subResult.rows[0];

    // 3. Prevent duplicate bills for the same customer + month
    const dupQuery = `
      SELECT id FROM bills 
      WHERE customer_id = $1 AND billing_month = $2;
    `;
    const dupResult = await db.query(dupQuery, [customer_id, billing_month]);
    if (dupResult.rows.length > 0) {
      return res.status(400).json({ error: `An invoice has already been generated for this customer for ${billing_month}.` });
    }

    // 4. Create the bill record
    const insertQuery = `
      INSERT INTO bills (customer_id, subscription_id, billing_month, amount, due_date, status)
      VALUES ($1, $2, $3, $4, $5, 'unpaid')
      RETURNING id, billing_month, amount::float as amount, due_date, status;
    `;
    const result = await db.query(insertQuery, [
      customer_id,
      subscription_id,
      billing_month,
      monthly_price,
      due_date
    ]);

    return res.status(201).json({
      message: 'Invoice generated successfully.',
      bill: result.rows[0]
    });
  } catch (err) {
    console.error('[AdminBillingController] Error generating bill:', err.message);
    return res.status(500).json({ error: 'Failed to generate customer invoice.' });
  }
}

/**
 * Record a payment, update outstanding balance, and cascade bill statuses
 * POST /api/admin/bills/:id/payments
 */
async function recordPayment(req, res) {
  const { id } = req.params; // bill_id
  const { amount, payment_date, payment_method, transaction_reference } = req.body;

  // 1. Basic validation
  const paymentAmount = parseFloat(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be a valid number greater than 0.' });
  }

  if (!payment_method) {
    return res.status(400).json({ error: 'Payment method is required.' });
  }

  const paymentDateVal = payment_date || new Date().toISOString();

  try {
    // 2. Fetch the bill detail and calculate remaining balance
    const billQuery = `
      SELECT 
        b.id, b.customer_id, b.amount, b.due_date, b.status,
        COALESCE((SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND status != 'Failed'), 0)::float as total_paid
      FROM bills b
      WHERE b.id = $1;
    `;
    const billResult = await db.query(billQuery, [id]);
    if (billResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bill invoice record not found.' });
    }

    const { customer_id, amount: billTotal, total_paid, status: currentStatus, due_date } = billResult.rows[0];
    const remainingBalance = parseFloat((billTotal - total_paid).toFixed(2));

    if (currentStatus === 'paid') {
      return res.status(400).json({ error: 'This invoice has already been fully paid.' });
    }

    // Reject payment exceeds remaining balance
    if (paymentAmount > remainingBalance) {
      return res.status(400).json({ error: `Payment amount exceeds the remaining invoice balance of Rs. ${remainingBalance.toLocaleString()}.` });
    }

    const newRemaining = parseFloat((remainingBalance - paymentAmount).toFixed(2));

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 3. Record transaction in payments table
      await client.query(`
        INSERT INTO payments (bill_id, customer_id, amount, payment_method, transaction_reference, payment_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'completed')
      `, [id, customer_id, paymentAmount, payment_method, transaction_reference || null, paymentDateVal]);

      // 4. Update bill status
      let newStatus = 'unpaid';
      let paidAtVal = null;

      if (newRemaining <= 0) {
        newStatus = 'paid';
        paidAtVal = paymentDateVal;
      } else {
        // If unpaid and past due, mark as overdue, else unpaid
        const today = new Date().toISOString().split('T')[0];
        const dueDateStr = new Date(due_date).toISOString().split('T')[0];
        newStatus = dueDateStr < today ? 'overdue' : 'unpaid';
      }

      await client.query(`
        UPDATE bills
        SET status = $1, paid_at = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newStatus, paidAtVal, id]);

      await client.query('COMMIT');
      return res.status(201).json({
        message: 'Payment logged successfully.',
        remaining_balance: newRemaining,
        bill_status: newStatus
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[AdminBillingController] Error logging payment:', err.message);
    return res.status(500).json({ error: 'Failed to record account payment transaction.' });
  }
}

module.exports = {
  listBills,
  getBillDetails,
  createBill,
  recordPayment
};
