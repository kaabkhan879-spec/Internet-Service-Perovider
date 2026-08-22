const db = require('../config/db');

/**
 * Automatically checks and updates customer service status based on outstanding unpaid bills and grace period.
 * Idempotent, safe to run repeatedly.
 */
async function runSubscriptionStatusCheck() {
  const results = { suspended: [], reactivated: [] };

  try {
    // 1. Fetch configured grace period
    const graceRes = await db.query("SELECT value FROM settings WHERE key = 'grace_period'");
    const gracePeriod = graceRes.rows.length > 0 ? parseInt(graceRes.rows[0].value, 10) : 3;

    // 2. Find active customers with unpaid/overdue bills past grace period
    const suspensionQuery = `
      SELECT DISTINCT c.id, c.full_name
      FROM customers c
      JOIN bills b ON b.customer_id = c.id
      WHERE c.status = 'active'
        AND b.status IN ('unpaid', 'overdue')
        AND (b.amount - COALESCE(
          (SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND status NOT IN ('Failed', 'failed', 'pending')), 0
        )) > 0
        AND (b.due_date + $1::integer) < CURRENT_DATE;
    `;
    const overdueCustomers = await db.query(suspensionQuery, [gracePeriod]);

    // Apply suspension to those customers
    for (const customer of overdueCustomers.rows) {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        // Update customer service status to suspended
        await client.query(`
          UPDATE customers
          SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [customer.id]);

        // Update active subscription status to suspended
        await client.query(`
          UPDATE subscriptions
          SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
          WHERE customer_id = $1 AND status = 'active'
        `, [customer.id]);

        await client.query('COMMIT');
        results.suspended.push({ id: customer.id, name: customer.full_name });
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[SubscriptionCheck] Failed to suspend customer ${customer.full_name}:`, err.message);
      } finally {
        client.release();
      }
    }

    // 3. Self-healing: Reactivate any suspended customer who has NO outstanding unpaid bills
    const reactivationQuery = `
      SELECT DISTINCT c.id, c.full_name
      FROM customers c
      WHERE c.status = 'suspended'
        AND NOT EXISTS (
          SELECT 1 FROM bills b
          WHERE b.customer_id = c.id
            AND b.status IN ('unpaid', 'overdue')
            AND (b.amount - COALESCE(
              (SELECT SUM(amount) FROM payments WHERE bill_id = b.id AND status NOT IN ('Failed', 'failed', 'pending')), 0
            )) > 0
        );
    `;
    const clearCustomers = await db.query(reactivationQuery);

    for (const customer of clearCustomers.rows) {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Reactivate customer
        await client.query(`
          UPDATE customers
          SET status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [customer.id]);

        // Reactivate users table account just in case
        await client.query(`
          UPDATE users
          SET status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE id = (SELECT user_id FROM customers WHERE id = $1)
        `, [customer.id]);

        // Reactivate suspended subscription
        await client.query(`
          UPDATE subscriptions
          SET status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE customer_id = $1 AND status = 'suspended'
        `, [customer.id]);

        await client.query('COMMIT');
        results.reactivated.push({ id: customer.id, name: customer.full_name });
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[SubscriptionCheck] Failed to reactivate customer ${customer.full_name}:`, err.message);
      } finally {
        client.release();
      }
    }

  } catch (err) {
    console.error('[SubscriptionCheck] Error during status check execution:', err.message);
    throw err;
  }

  return results;
}

/**
 * Process a payment and reactivate customer + renew/extend subscription if fully paid.
 * Must run inside an existing PostgreSQL transaction client.
 */
async function calculateReactivationAndSubscription(client, billId, paymentDateVal) {
  // 1. Fetch bill details
  const billQuery = await client.query(`
    SELECT id, customer_id, subscription_id, billing_month, amount::float as bill_amount, status, due_date
    FROM bills
    WHERE id = $1;
  `, [billId]);

  if (billQuery.rows.length === 0) {
    throw new Error('Invoice not found.');
  }

  const bill = billQuery.rows[0];
  const { customer_id: customerId, subscription_id: subscriptionId, billing_month: billingMonth, bill_amount: billAmount } = bill;

  // 2. Check if customer status is currently suspended
  const customerQuery = await client.query(`
    SELECT status FROM customers WHERE id = $1;
  `, [customerId]);
  
  if (customerQuery.rows.length === 0) {
    throw new Error('Customer profile not found.');
  }
  const wasSuspended = customerQuery.rows[0].status === 'suspended';

  // 3. Recalculate total successful paid amount for this bill (excluding failed/pending transactions)
  const paymentsQuery = await client.query(`
    SELECT COALESCE(SUM(amount), 0)::float as total_paid
    FROM payments
    WHERE bill_id = $1 AND status NOT IN ('Failed', 'failed', 'pending');
  `, [billId]);
  const totalPaid = paymentsQuery.rows[0].total_paid;

  const remainingBalance = parseFloat((billAmount - totalPaid).toFixed(2));

  // 4. Update bill status
  let newBillStatus = 'unpaid';
  let paidAtVal = null;

  if (remainingBalance <= 0) {
    newBillStatus = 'paid';
    paidAtVal = paymentDateVal || new Date().toISOString();
  } else {
    // If unpaid and past due, status becomes overdue
    const today = new Date().toISOString().split('T')[0];
    const dueDateStr = new Date(bill.due_date).toISOString().split('T')[0];
    newBillStatus = dueDateStr < today ? 'overdue' : 'unpaid';
  }

  await client.query(`
    UPDATE bills
    SET status = $1, paid_at = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3;
  `, [newBillStatus, paidAtVal, billId]);

  // 5. Reactivate and Renew if fully paid
  if (remainingBalance <= 0) {
    // Reactivate customer status and matching user status to Active
    if (wasSuspended) {
      await client.query(`
        UPDATE customers
        SET status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `, [customerId]);

      await client.query(`
        UPDATE users
        SET status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT user_id FROM customers WHERE id = $1);
      `, [customerId]);
    }

    // Determine the new subscription dates using calendar-month logic
    const [yearStr, monthStr] = billingMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-indexed (1-12)

    let startDate, endDate;
    if (wasSuspended) {
      // Extended period starts on the 1st of the next month and goes to month-end
      startDate = new Date(Date.UTC(year, month, 1));
      endDate = new Date(Date.UTC(year, month + 1, 0));
    } else {
      // Period matches the billing month itself
      startDate = new Date(Date.UTC(year, month - 1, 1));
      endDate = new Date(Date.UTC(year, month, 0));
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Find subscription to update (prefer bill subscription, fallback to active/suspended customer subscriptions)
    let targetSubId = subscriptionId;

    if (!targetSubId) {
      const subCheck = await client.query(`
        SELECT id FROM subscriptions
        WHERE customer_id = $1 AND (status = 'active' OR status = 'suspended')
        ORDER BY created_at DESC LIMIT 1;
      `, [customerId]);

      if (subCheck.rows.length > 0) {
        targetSubId = subCheck.rows[0].id;
        
        // Link bill to subscription
        await client.query(`
          UPDATE bills
          SET subscription_id = $1
          WHERE id = $2;
        `, [targetSubId, billId]);
      }
    }

    if (targetSubId) {
      // Update subscription to active with computed dates
      await client.query(`
        UPDATE subscriptions
        SET start_date = $1, end_date = $2, status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE id = $3;
      `, [startDateStr, endDateStr, targetSubId]);
    }
  }

  return {
    remainingBalance,
    billStatus: newBillStatus
  };
}

module.exports = {
  runSubscriptionStatusCheck,
  calculateReactivationAndSubscription
};
