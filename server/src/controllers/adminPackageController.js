const db = require('../config/db');

/**
 * List all packages with optional search text and status filters, including real customer counts
 * GET /api/admin/packages
 */
async function listPackages(req, res) {
  const { search, status } = req.query;

  try {
    let queryStr = `
      SELECT 
        p.id, p.name, p.speed_mbps, p.monthly_price::float as monthly_price, 
        p.data_limit_gb, p.description, p.status,
        COUNT(s.id)::int as customer_count
      FROM packages p
      LEFT JOIN subscriptions s ON s.package_id = p.id AND s.status = 'active'
    `;

    const queryParams = [];
    const filters = [];

    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      filters.push(`(p.name ILIKE $${queryParams.length} OR p.description ILIKE $${queryParams.length})`);
    }

    if (status && ['active', 'inactive'].includes(status)) {
      queryParams.push(status);
      filters.push(`p.status = $${queryParams.length}`);
    }

    if (filters.length > 0) {
      queryStr += ' WHERE ' + filters.join(' AND ');
    }

    queryStr += ' GROUP BY p.id ORDER BY p.monthly_price ASC;';

    const result = await db.query(queryStr, queryParams);
    return res.json(result.rows);
  } catch (err) {
    console.error('[AdminPackageController] Error listing packages:', err.message);
    return res.status(500).json({ error: 'Failed to fetch packages catalog.' });
  }
}

/**
 * Create a new Internet package
 * POST /api/admin/packages
 */
async function createPackage(req, res) {
  const { name, speed_mbps, monthly_price, data_limit_gb, description, status } = req.body;

  // 1. Basic Validations
  if (!name) {
    return res.status(400).json({ error: 'Package name is required.' });
  }

  const speed = parseInt(speed_mbps, 10);
  if (isNaN(speed) || speed <= 0) {
    return res.status(400).json({ error: 'Speed must be a valid number greater than 0.' });
  }

  const price = parseFloat(monthly_price);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Monthly price must be a valid number greater than or equal to 0.' });
  }

  try {
    const queryStr = `
      INSERT INTO packages (name, speed_mbps, monthly_price, data_limit_gb, description, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, speed_mbps, monthly_price::float as monthly_price, status;
    `;
    const result = await db.query(queryStr, [
      name,
      speed,
      price,
      data_limit_gb ? parseInt(data_limit_gb, 10) : null,
      description || null,
      status || 'active'
    ]);

    return res.status(201).json({
      message: 'Package created successfully.',
      package: result.rows[0]
    });
  } catch (err) {
    console.error('[AdminPackageController] Error creating package:', err.message);
    return res.status(500).json({ error: 'Failed to create package.' });
  }
}

/**
 * Update an existing package details
 * PUT /api/admin/packages/:id
 */
async function updatePackage(req, res) {
  const { id } = req.params;
  const { name, speed_mbps, monthly_price, data_limit_gb, description, status } = req.body;

  // 1. Basic Validations
  if (!name) {
    return res.status(400).json({ error: 'Package name is required.' });
  }

  const speed = parseInt(speed_mbps, 10);
  if (isNaN(speed) || speed <= 0) {
    return res.status(400).json({ error: 'Speed must be a valid number greater than 0.' });
  }

  const price = parseFloat(monthly_price);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({ error: 'Monthly price must be a valid number greater than or equal to 0.' });
  }

  try {
    // Check if package exists
    const checkPack = await db.query('SELECT id FROM packages WHERE id = $1', [id]);
    if (checkPack.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    const queryStr = `
      UPDATE packages
      SET name = $1, speed_mbps = $2, monthly_price = $3, data_limit_gb = $4, description = $5, status = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7;
    `;
    await db.query(queryStr, [
      name,
      speed,
      price,
      data_limit_gb ? parseInt(data_limit_gb, 10) : null,
      description || null,
      status || 'active',
      id
    ]);

    return res.json({ message: 'Package updated successfully.' });
  } catch (err) {
    console.error('[AdminPackageController] Error updating package:', err.message);
    return res.status(500).json({ error: 'Failed to update package details.' });
  }
}

/**
 * Toggle package active status
 * PATCH /api/admin/packages/:id/status
 */
async function togglePackageStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Valid status parameter ("active" or "inactive") is required.' });
  }

  try {
    const checkPack = await db.query('SELECT id FROM packages WHERE id = $1', [id]);
    if (checkPack.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    await db.query(
      'UPDATE packages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );

    return res.json({ message: `Package status updated to ${status}.` });
  } catch (err) {
    console.error('[AdminPackageController] Error toggling status:', err.message);
    return res.status(500).json({ error: 'Failed to toggle package status.' });
  }
}

/**
 * Assign an active package to a customer (expiring any previous active subscriptions)
 * POST /api/admin/customers/:customerId/subscription
 */
async function assignSubscription(req, res) {
  const { customerId } = req.params;
  const { package_id, start_date } = req.body;

  if (!package_id) {
    return res.status(400).json({ error: 'Package ID is required.' });
  }

  const startDateVal = start_date || new Date().toISOString().split('T')[0];

  try {
    // 1. Verify customer exists
    const checkCust = await db.query('SELECT id FROM customers WHERE id = $1', [customerId]);
    if (checkCust.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // 2. Verify package exists and is active
    const checkPack = await db.query("SELECT id FROM packages WHERE id = $1 AND status = 'active'", [package_id]);
    if (checkPack.rows.length === 0) {
      return res.status(400).json({ error: 'Package not found or is currently inactive.' });
    }

    // Execute safe database transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 3. Expire previous active subscription(s)
      await client.query(
        `UPDATE subscriptions 
         SET status = 'expired', end_date = $1, updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = $2 AND status = 'active'`,
        [startDateVal, customerId]
      );

      // 4. Create new active subscription
      await client.query(
        `INSERT INTO subscriptions (customer_id, package_id, start_date, status)
         VALUES ($1, $2, $3, 'active')`,
        [customerId, package_id, startDateVal]
      );

      await client.query('COMMIT');
      return res.json({ message: 'Package assigned to customer successfully.' });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[AdminPackageController] Error assigning subscription:', err.message);
    return res.status(500).json({ error: 'Failed to assign package to customer.' });
  }
}

module.exports = {
  listPackages,
  createPackage,
  updatePackage,
  togglePackageStatus,
  assignSubscription
};
