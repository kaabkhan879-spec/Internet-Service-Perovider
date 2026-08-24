const db = require('../config/db');
const { hashPassword } = require('../utils/password');

function calculateExpiryDates(activationDateVal, billingCycle) {
  const activationDate = new Date(activationDateVal || new Date());
  let monthsToAdd = 1;
  const cycle = (billingCycle || 'monthly').toLowerCase();
  if (cycle === 'quarterly') monthsToAdd = 3;
  else if (cycle === 'semi-annual' || cycle === 'semi_annual') monthsToAdd = 6;
  else if (cycle === 'annual') monthsToAdd = 12;

  const expiryDate = new Date(activationDate);
  expiryDate.setMonth(expiryDate.getMonth() + monthsToAdd);

  return {
    nextBillingDate: expiryDate,
    serviceExpiryDate: expiryDate
  };
}

/**
 * List all customers with optional search string matching name, phone, or customer code
 * GET /api/customers
 */
async function listCustomers(req, res) {
  const { search } = req.query;

  try {
    let queryStr = `
      SELECT 
        c.id, c.customer_code, c.full_name, c.phone, c.email, c.status,
        p.name as package_name, p.monthly_price::float as monthly_price,
        COALESCE((
          SELECT SUM(b.amount) 
          FROM bills b 
          WHERE b.customer_id = c.id AND b.status IN ('unpaid', 'overdue')
        ), 0)::float as outstanding_balance
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id AND (s.status = 'active' OR s.status = 'suspended')
      LEFT JOIN packages p ON s.package_id = p.id
    `;

    const queryParams = [];

    if (search && search.trim() !== '') {
      queryStr += `
        WHERE c.full_name ILIKE $1 
           OR c.phone ILIKE $1 
           OR c.customer_code ILIKE $1
      `;
      queryParams.push(`%${search.trim()}%`);
    }

    queryStr += ' ORDER BY c.created_at DESC;';

    const result = await db.query(queryStr, queryParams);
    return res.json(result.rows);
  } catch (err) {
    console.error('[CustomerController] Error listing customers:', err.message);
    return res.status(500).json({ error: 'Failed to fetch customer list.' });
  }
}

/**
 * Get detailed customer profile context including bills, payments, and complaints
 * GET /api/customers/:id
 */
async function getCustomerDetails(req, res) {
  const { id } = req.params;

  try {
    // 1. Fetch Customer basic data
    const customerQuery = `
      SELECT 
        c.*,
        p.id as package_id, p.name as package_name, p.monthly_price::float as monthly_price,
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
    if (customer.status === 'suspended') {
      customer.suspension_message = "Your internet service has been suspended due to an unpaid bill. Please make the outstanding payment to restore your service.";
    }

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

    return res.json({
      customer,
      bills: billsRes.rows,
      payments: paymentsRes.rows,
      complaints: complaintsRes.rows
    });
  } catch (err) {
    console.error('[CustomerController] Error fetching details:', err.message);
    return res.status(500).json({ error: 'Failed to fetch customer profile details.' });
  }
}

/**
 * Add a new Customer profile (creates a matching users record)
 * POST /api/customers
 */
async function createCustomer(req, res) {
  const { 
    full_name, phone, email, cnic, address, installation_date, status, package_id, password,
    activation_date, billing_cycle, grace_period_days
  } = req.body;

  if (!full_name || !phone || !email) {
    return res.status(400).json({ error: 'Full name, phone, and email are required fields.' });
  }

  try {
    // Check if email already exists in users table
    const checkEmail = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }

    // Auto-generate customer code
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const customerCode = `CUST-${randomDigits}`;

    // Hash customer password (using the provided password or default 'customer123')
    const finalPassword = password || 'customer123';
    const passwordHash = await hashPassword(finalPassword);

    const finalActivationDate = activation_date || new Date().toISOString().split('T')[0];
    const finalBillingCycle = billing_cycle || 'monthly';
    const finalGracePeriod = parseInt(grace_period_days, 10) || 3;

    const { nextBillingDate, serviceExpiryDate } = calculateExpiryDates(finalActivationDate, finalBillingCycle);

    // SQL Transaction wrapper using single connection client
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert into users
      const userInsert = `
        INSERT INTO users (name, email, password_hash, role, status)
        VALUES ($1, $2, $3, 'customer', $4)
        RETURNING id;
      `;
      const userRes = await client.query(userInsert, [full_name, email, passwordHash, status || 'active']);
      const userId = userRes.rows[0].id;

      // 2. Insert into customers
      const customerInsert = `
        INSERT INTO customers (
          user_id, customer_code, full_name, phone, email, address, cnic, status, installation_date,
          activation_date, billing_cycle, next_billing_date, service_expiry_date, grace_period_days, service_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'ACTIVE')
        RETURNING id;
      `;
      const customerRes = await client.query(customerInsert, [
        userId,
        customerCode,
        full_name,
        phone,
        email,
        address || null,
        cnic || null,
        status || 'active',
        installation_date || new Date(),
        finalActivationDate,
        finalBillingCycle,
        nextBillingDate,
        serviceExpiryDate,
        finalGracePeriod
      ]);

      const customerId = customerRes.rows[0].id;

      // 3. Assign package subscription if package_id is provided
      if (package_id) {
        const subInsert = `
          INSERT INTO subscriptions (customer_id, package_id, start_date, end_date, status)
          VALUES ($1, $2, $3, $4, 'active');
        `;
        await client.query(subInsert, [customerId, package_id, finalActivationDate, serviceExpiryDate]);
      }

      await client.query('COMMIT');
      return res.status(201).json({
        message: 'Customer account created successfully.',
        customer: { id: customerId, customer_code: customerCode, full_name, email }
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[CustomerController] Error creating customer:', err.message);
    return res.status(500).json({ error: 'Failed to create customer profile.' });
  }
}

/**
 * Edit Customer details
 * PUT /api/customers/:id
 */
async function updateCustomer(req, res) {
  const { id } = req.params;
  const { 
    full_name, phone, email, cnic, address, installation_date,
    activation_date, billing_cycle, grace_period_days, service_status 
  } = req.body;

  if (!full_name || !phone || !email) {
    return res.status(400).json({ error: 'Full name, phone, and email are required fields.' });
  }

  try {
    // Find customer first to grab their user_id
    const findCust = await db.query('SELECT user_id, email, activation_date, billing_cycle, grace_period_days, service_status FROM customers WHERE id = $1', [id]);
    if (findCust.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const currentCust = findCust.rows[0];
    const { user_id, email: currentEmail } = currentCust;

    // Check email uniqueness if email changed
    if (email !== currentEmail) {
      const checkEmail = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, user_id]);
      if (checkEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email address is already in use by another user.' });
      }
    }

    const finalActivationDate = activation_date || currentCust.activation_date || new Date().toISOString();
    const finalBillingCycle = billing_cycle || currentCust.billing_cycle || 'monthly';
    const finalGracePeriod = grace_period_days !== undefined ? parseInt(grace_period_days, 10) : (currentCust.grace_period_days || 3);
    const finalServiceStatus = service_status || currentCust.service_status || 'ACTIVE';

    const { nextBillingDate, serviceExpiryDate } = calculateExpiryDates(finalActivationDate, finalBillingCycle);

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update users details
      await client.query(
        'UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [full_name, email, user_id]
      );

      // Update customers details
      const updateCust = `
        UPDATE customers 
        SET full_name = $1, phone = $2, email = $3, cnic = $4, address = $5, installation_date = $6,
            activation_date = $7, billing_cycle = $8, next_billing_date = $9, service_expiry_date = $10,
            grace_period_days = $11, service_status = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $13;
      `;
      await client.query(updateCust, [
        full_name, phone, email, cnic || null, address || null, installation_date || null,
        finalActivationDate, finalBillingCycle, nextBillingDate, serviceExpiryDate,
        finalGracePeriod, finalServiceStatus, id
      ]);

      // Update active subscription dates
      await client.query(`
        UPDATE subscriptions
        SET start_date = $1, end_date = $2, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $3 AND (status = 'active' OR status = 'suspended');
      `, [finalActivationDate, serviceExpiryDate, id]);

      await client.query('COMMIT');
      return res.json({ message: 'Customer details updated successfully.' });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[CustomerController] Error updating customer:', err.message);
    return res.status(500).json({ error: 'Failed to update customer details.' });
  }
}

/**
 * Toggle customer active/inactive status (Cascades to users table)
 * PATCH /api/customers/:id/status
 */
async function toggleCustomerStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Valid status parameter ("active" or "inactive") is required.' });
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

      // Update users status
      await client.query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, user_id]);

      // Update customers status
      await client.query('UPDATE customers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);

      await client.query('COMMIT');
      return res.json({ message: `Customer status updated to ${status}.` });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[CustomerController] Error toggling status:', err.message);
    return res.status(500).json({ error: 'Failed to toggle customer active status.' });
  }
}

/**
 * Assign/change subscription packages for customer
 * POST /api/customers/:id/assign-package
 */
async function assignPackage(req, res) {
  const { id } = req.params;
  const { package_id } = req.body;

  if (!package_id) {
    return res.status(400).json({ error: 'Package ID is required.' });
  }

  try {
    // Verify customer exists
    const checkCust = await db.query('SELECT id, billing_cycle FROM customers WHERE id = $1', [id]);
    if (checkCust.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Verify package exists and is active
    const checkPack = await db.query("SELECT id FROM packages WHERE id = $1 AND status = 'active'", [package_id]);
    if (checkPack.rows.length === 0) {
      return res.status(404).json({ error: 'Package is not found or inactive.' });
    }

    const billingCycle = checkCust.rows[0].billing_cycle || 'monthly';
    const todayStr = new Date().toISOString().split('T')[0];
    const { nextBillingDate, serviceExpiryDate } = calculateExpiryDates(todayStr, billingCycle);

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Expire existing active/suspended subscription(s)
      await client.query(
        "UPDATE subscriptions SET status = 'expired', end_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE customer_id = $1 AND (status = 'active' OR status = 'suspended')",
        [id]
      );

      // 2. Insert new active subscription
      await client.query(
        "INSERT INTO subscriptions (customer_id, package_id, start_date, end_date, status) VALUES ($1, $2, $3, $4, 'active')",
        [id, package_id, todayStr, serviceExpiryDate]
      );

      // 3. Update customer details status and expiry dates
      await client.query(`
        UPDATE customers
        SET activation_date = $1, next_billing_date = $2, service_expiry_date = $3, service_status = 'ACTIVE', status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE id = $4;
      `, [todayStr, nextBillingDate, serviceExpiryDate, id]);

      await client.query('COMMIT');
      return res.json({ message: 'Internet package assigned successfully.' });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[CustomerController] Error assigning package:', err.message);
    return res.status(500).json({ error: 'Failed to assign package to customer.' });
  }
}

module.exports = {
  listCustomers,
  getCustomerDetails,
  createCustomer,
  updateCustomer,
  toggleCustomerStatus,
  assignPackage
};
