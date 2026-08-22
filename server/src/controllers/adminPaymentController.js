const db = require('../config/db');

/**
 * List all payments with search and status/payment-method filters
 * GET /api/admin/payments
 */
async function listPayments(req, res) {
  const { search, status, payment_method } = req.query;

  try {
    let queryStr = `
      SELECT 
        p.id, p.bill_id, p.customer_id, p.amount::float as amount, p.payment_method, p.transaction_reference, p.payment_date, p.status, p.notes, p.created_at,
        c.full_name as customer_name, c.customer_code,
        b.billing_month
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN bills b ON p.bill_id = b.id
    `;

    const queryParams = [];
    const filters = [];

    if (search && search.trim() !== '') {
      const paramVal = `%${search.trim()}%`;
      queryParams.push(paramVal);

      // If search is numeric, check exact IDs as well
      const searchNum = parseInt(search.trim(), 10);
      if (!isNaN(searchNum)) {
        queryParams.push(searchNum);
        filters.push(`(c.full_name ILIKE $1 OR c.customer_code ILIKE $1 OR p.transaction_reference ILIKE $1 OR p.id = $2 OR p.bill_id = $2)`);
      } else {
        filters.push(`(c.full_name ILIKE $1 OR c.customer_code ILIKE $1 OR p.transaction_reference ILIKE $1)`);
      }
    }

    if (status) {
      queryParams.push(status);
      filters.push(`p.status = $${queryParams.length}`);
    }

    if (payment_method) {
      queryParams.push(payment_method);
      filters.push(`p.payment_method = $${queryParams.length}`);
    }

    if (filters.length > 0) {
      queryStr += ' WHERE ' + filters.join(' AND ');
    }

    queryStr += ' ORDER BY p.payment_date DESC, p.id DESC;';

    const result = await db.query(queryStr, queryParams);
    return res.json(result.rows);
  } catch (err) {
    console.error('[AdminPaymentController] Error listing payments:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve payment records.' });
  }
}

/**
 * Get details for a specific payment
 * GET /api/admin/payments/:id
 */
async function getPaymentDetails(req, res) {
  const { id } = req.params;

  try {
    const queryStr = `
      SELECT 
        p.id, p.bill_id, p.customer_id, p.amount::float as amount, p.payment_method, p.transaction_reference, p.payment_date, p.status, p.notes, p.created_at,
        c.full_name as customer_name, c.customer_code, c.phone as customer_phone, c.email as customer_email,
        b.billing_month, b.amount::float as bill_amount
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN bills b ON p.bill_id = b.id
      WHERE p.id = $1;
    `;
    const result = await db.query(queryStr, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[AdminPaymentController] Error getting details:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve payment details.' });
  }
}

/**
 * Get all payments for a specific bill
 * GET /api/admin/bills/:billId/payments
 */
async function getBillPayments(req, res) {
  const { billId } = req.params;

  try {
    const queryStr = `
      SELECT 
        p.id, p.amount::float as amount, p.payment_method, p.transaction_reference, p.payment_date, p.status, p.notes, p.created_at
      FROM payments p
      WHERE p.bill_id = $1
      ORDER BY p.payment_date ASC, p.id ASC;
    `;
    const result = await db.query(queryStr, [billId]);
    return res.json(result.rows);
  } catch (err) {
    console.error('[AdminPaymentController] Error loading bill payments:', err.message);
    return res.status(500).json({ error: 'Failed to load payments history for this bill.' });
  }
}

/**
 * Record a payment inside a database transaction
 * POST /api/admin/payments
 */
async function recordPayment(req, res) {
  const { bill_id, amount, payment_method, transaction_reference, notes, payment_date, status = 'Paid' } = req.body;

  // 1. Basic validation
  if (!bill_id) {
    return res.status(400).json({ error: 'Bill selection is required.' });
  }

  const paymentAmount = parseFloat(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
  }

  const validMethods = ['Cash', 'Bank Transfer', 'Easypaisa', 'JazzCash', 'Other'];
  if (!payment_method || !validMethods.includes(payment_method)) {
    return res.status(400).json({ error: 'A valid payment method is required.' });
  }

  // Ref reference is mandatory for non-cash options
  if (payment_method !== 'Cash' && (!transaction_reference || transaction_reference.trim() === '')) {
    return res.status(400).json({ error: `Transaction/Reference number is required for ${payment_method}.` });
  }

  try {
    // 2. Fetch the real bill details from the database
    const billQuery = `
      SELECT b.id, b.customer_id, b.amount::float as bill_amount, b.status as bill_status
      FROM bills b
      WHERE b.id = $1;
    `;
    const billResult = await db.query(billQuery, [bill_id]);
    if (billResult.rows.length === 0) {
      return res.status(404).json({ error: 'Bill record not found.' });
    }

    const bill = billResult.rows[0];
    const customerId = bill.customer_id;
    const billAmount = bill.bill_amount;

    // 3. Retrieve sum of previous successful payments for this bill
    const prevPaymentsQuery = `
      SELECT COALESCE(SUM(amount), 0)::float as total_paid
      FROM payments
      WHERE bill_id = $1 AND status != 'Failed';
    `;
    const prevPaymentsResult = await db.query(prevPaymentsQuery, [bill_id]);
    const previousPaid = prevPaymentsResult.rows[0].total_paid;
    const remainingBalance = parseFloat((billAmount - previousPaid).toFixed(2));

    // 4. Overpayment check validation
    if (paymentAmount > remainingBalance) {
      return res.status(400).json({
        error: `Overpayment blocked. Entered Rs. ${paymentAmount.toLocaleString()} exceeds the remaining balance of Rs. ${remainingBalance.toLocaleString()}.`
      });
    }

    // 5. Open database transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Determine payment status
      const totalPaidAfter = parseFloat((previousPaid + paymentAmount).toFixed(2));
      const remainingAfter = parseFloat((billAmount - totalPaidAfter).toFixed(2));
      const calculatedPaymentStatus = remainingAfter === 0 ? 'Paid' : 'Partial';

      const finalStatus = status === 'Failed' ? 'Failed' : calculatedPaymentStatus;

      // Log payment record
      const pDate = payment_date || new Date().toISOString();
      const insertPaymentQuery = `
        INSERT INTO payments (bill_id, customer_id, amount, payment_method, transaction_reference, notes, status, payment_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;
      const insertResult = await client.query(insertPaymentQuery, [
        bill_id,
        customerId,
        paymentAmount,
        payment_method,
        transaction_reference ? transaction_reference.trim() : null,
        notes ? notes.trim() : null,
        finalStatus,
        pDate
      ]);

      const newPaymentId = insertResult.rows[0].id;

      // If payment did not fail, update the bill's state
      if (finalStatus !== 'Failed') {
        const nextBillStatus = remainingAfter === 0 ? 'paid' : 'unpaid';
        const paidAtVal = nextBillStatus === 'paid' ? pDate : null;

        await client.query(`
          UPDATE bills
          SET status = $1, paid_at = COALESCE($2, paid_at), updated_at = CURRENT_TIMESTAMP
          WHERE id = $3;
        `, [nextBillStatus, paidAtVal, bill_id]);
      }

      await client.query('COMMIT');
      return res.status(201).json({
        message: 'Payment recorded successfully.',
        paymentId: newPaymentId,
        remainingBalance: remainingAfter,
        paymentStatus: finalStatus
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[AdminPaymentController] Error recording payment:', err.message);
    return res.status(500).json({ error: 'Failed to record payment transaction.' });
  }
}

module.exports = {
  listPayments,
  getPaymentDetails,
  getBillPayments,
  recordPayment
};
