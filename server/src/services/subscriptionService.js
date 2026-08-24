const db = require('../config/db');

function addCyclePeriod(baseDateStr, billingCycle) {
  const baseDate = new Date(baseDateStr || new Date());
  let monthsToAdd = 1;
  const cycle = (billingCycle || 'monthly').toLowerCase();
  if (cycle === 'quarterly') monthsToAdd = 3;
  else if (cycle === 'semi-annual' || cycle === 'semi_annual') monthsToAdd = 6;
  else if (cycle === 'annual') monthsToAdd = 12;

  const newDate = new Date(baseDate);
  newDate.setMonth(newDate.getMonth() + monthsToAdd);
  return newDate;
}

/**
 * Automatically checks and updates customer service status based on outstanding unpaid bills and grace period.
 * Idempotent, safe to run repeatedly.
 */
async function runSubscriptionStatusCheck() {
  const results = { suspended: [], reactivated: [] };

  try {
    // 1. Fetch configured grace period
    const graceRes = await db.query("SELECT value FROM settings WHERE key = 'grace_period'");
    const defaultGrace = graceRes.rows.length > 0 ? parseInt(graceRes.rows[0].value, 10) : 3;

    // 2. ACTIVE checks: Ensure customers whose expiry date is in the future are ACTIVE
    await db.query(`
      UPDATE customers
      SET service_status = 'ACTIVE', status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE service_expiry_date IS NOT NULL
        AND CURRENT_DATE < service_expiry_date
        AND (service_status != 'ACTIVE' OR status != 'active');
    `);

    // 3. DUE checks: If CURRENT_DATE is past service_expiry_date but within grace period
    await db.query(`
      UPDATE customers
      SET service_status = 'DUE', status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE service_expiry_date IS NOT NULL
        AND CURRENT_DATE >= service_expiry_date
        AND CURRENT_DATE < (service_expiry_date + COALESCE(grace_period_days, $1)::integer)
        AND (service_status != 'DUE' OR status != 'active');
    `, [defaultGrace]);

    // 4. SUSPENDED checks: Find and suspend customers past their grace period
    const overdueQuery = `
      SELECT id, full_name FROM customers
      WHERE service_expiry_date IS NOT NULL
        AND CURRENT_DATE >= (service_expiry_date + COALESCE(grace_period_days, $1)::integer)
        AND (service_status != 'SUSPENDED' OR status != 'suspended');
    `;
    const overdueCustomers = await db.query(overdueQuery, [defaultGrace]);

    for (const customer of overdueCustomers.rows) {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        // Update customer service status to suspended
        await client.query(`
          UPDATE customers
          SET service_status = 'SUSPENDED', status = 'suspended', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1;
        `, [customer.id]);

        // Disable matching users table status
        await client.query(`
          UPDATE users
          SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
          WHERE id = (SELECT user_id FROM customers WHERE id = $1);
        `, [customer.id]);

        // Update active subscription status to suspended
        await client.query(`
          UPDATE subscriptions
          SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
          WHERE customer_id = $1 AND status = 'active';
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

    // 5. Self-healing / Reactivate: If a suspended customer has an updated service_expiry_date in the future
    const reactivationQuery = `
      SELECT id, full_name FROM customers
      WHERE status = 'suspended' AND service_status = 'SUSPENDED'
        AND service_expiry_date IS NOT NULL
        AND CURRENT_DATE < service_expiry_date;
    `;
    const clearCustomers = await db.query(reactivationQuery);

    for (const customer of clearCustomers.rows) {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Reactivate customer
        await client.query(`
          UPDATE customers
          SET service_status = 'ACTIVE', status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1;
        `, [customer.id]);

        // Reactivate users table account
        await client.query(`
          UPDATE users
          SET status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE id = (SELECT user_id FROM customers WHERE id = $1);
        `, [customer.id]);

        // Reactivate suspended subscription
        await client.query(`
          UPDATE subscriptions
          SET status = 'active', updated_at = CURRENT_TIMESTAMP
          WHERE customer_id = $1 AND status = 'suspended';
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

  // 2. Fetch customer parameters
  const customerQuery = await client.query(`
    SELECT status, billing_cycle, activation_date, service_expiry_date, grace_period_days, service_status 
    FROM customers 
    WHERE id = $1;
  `, [customerId]);
  
  if (customerQuery.rows.length === 0) {
    throw new Error('Customer profile not found.');
  }
  const customer = customerQuery.rows[0];
  const wasSuspended = customer.status === 'suspended' || customer.service_status === 'SUSPENDED';

  // 3. Recalculate total successful paid amount for this bill
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
    // Determine the base date to add the cycle period to
    const baseExpiry = customer.service_expiry_date || new Date();
    const newExpiry = addCyclePeriod(baseExpiry, customer.billing_cycle);

    // Reactivate customer status and matching user status to Active
    await client.query(`
      UPDATE customers
      SET service_status = 'ACTIVE', status = 'active',
          next_billing_date = $1, service_expiry_date = $2,
          last_payment_date = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4;
    `, [newExpiry, newExpiry, paidAtVal || new Date(), customerId]);

    await client.query(`
      UPDATE users
      SET status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT user_id FROM customers WHERE id = $1);
    `, [customerId]);

    // Find active or suspended subscription to update
    let targetSubId = subscriptionId;

    if (!targetSubId) {
      const subCheck = await client.query(`
        SELECT id FROM subscriptions
        WHERE customer_id = $1 AND (status = 'active' OR status = 'suspended')
        ORDER BY created_at DESC LIMIT 1;
      `, [customerId]);

      if (subCheck.rows.length > 0) {
        targetSubId = subCheck.rows[0].id;
        
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
        SET end_date = $1, status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2;
      `, [newExpiry, targetSubId]);
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
