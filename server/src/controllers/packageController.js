const db = require('../config/db');

/**
 * List all active packages for selection dropdowns
 * GET /api/packages
 */
async function listPackages(req, res) {
  try {
    const result = await db.query(
      "SELECT id, name, speed_mbps, monthly_price::float as monthly_price, data_limit_gb, description FROM packages WHERE status = 'active' ORDER BY monthly_price ASC"
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[PackageController] Error listing packages:', err.message);
    return res.status(500).json({ error: 'Failed to fetch package options.' });
  }
}

module.exports = {
  listPackages
};
