const db = require('../config/db');

/**
 * Fetch summary metrics: Total Customers, Active Customers, Pending Bills, Open Complaints
 * GET /api/dashboard/stats
 */
async function getStats(req, res) {
  try {
    const totalQuery = db.query('SELECT COUNT(*) FROM customers');
    const activeQuery = db.query("SELECT COUNT(*) FROM customers WHERE status = 'active'");
    const pendingBillsQuery = db.query("SELECT COUNT(*) FROM bills WHERE status IN ('unpaid', 'overdue')");
    const openComplaintsQuery = db.query("SELECT COUNT(*) FROM complaints WHERE status IN ('open', 'in_progress')");

    const [totalRes, activeRes, pendingRes, complaintsRes] = await Promise.all([
      totalQuery,
      activeQuery,
      pendingBillsQuery,
      openComplaintsQuery
    ]);

    return res.json({
      totalCustomers: parseInt(totalRes.rows[0].count, 10) || 0,
      activeCustomers: parseInt(activeRes.rows[0].count, 10) || 0,
      pendingBills: parseInt(pendingRes.rows[0].count, 10) || 0,
      openComplaints: parseInt(complaintsRes.rows[0].count, 10) || 0
    });
  } catch (err) {
    console.error('[DashboardController] Error fetching stats:', err.message);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
}

/**
 * Fetch database trend datasets over the last 6 months: Customer Growth & Monthly Revenue
 * GET /api/dashboard/charts
 */
async function getCharts(req, res) {
  try {
    // 6-Month Time Series for Customer Signups
    const growthQuery = `
      SELECT TO_CHAR(m, 'Mon YYYY') as month_label, COUNT(c.id)::int as count
      FROM generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
        date_trunc('month', CURRENT_DATE),
        '1 month'::interval
      ) m
      LEFT JOIN customers c ON date_trunc('month', c.created_at) = m
      GROUP BY m
      ORDER BY m;
    `;

    // 6-Month Time Series for Monthly Completed Revenue payments
    const revenueQuery = `
      SELECT TO_CHAR(m, 'Mon YYYY') as month_label, COALESCE(SUM(p.amount), 0)::float as revenue
      FROM generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
        date_trunc('month', CURRENT_DATE),
        '1 month'::interval
      ) m
      LEFT JOIN payments p ON date_trunc('month', p.payment_date) = m AND p.status = 'completed'
      GROUP BY m
      ORDER BY m;
    `;

    const [growthRes, revenueRes] = await Promise.all([
      db.query(growthQuery),
      db.query(revenueQuery)
    ]);

    return res.json({
      customerGrowth: growthRes.rows,
      monthlyRevenue: revenueRes.rows
    });
  } catch (err) {
    console.error('[DashboardController] Error fetching charts:', err.message);
    return res.status(500).json({ error: 'Failed to fetch chart datasets.' });
  }
}

/**
 * Fetch latest 5 payments
 * GET /api/dashboard/recent-payments
 */
async function getRecentPayments(req, res) {
  try {
    const queryStr = `
      SELECT p.id, p.amount::float as amount, p.payment_method, p.payment_date, p.status, c.full_name as customer_name
      FROM payments p
      JOIN customers c ON p.customer_id = c.id
      ORDER BY p.payment_date DESC
      LIMIT 5;
    `;
    const result = await db.query(queryStr);
    return res.json(result.rows);
  } catch (err) {
    console.error('[DashboardController] Error fetching recent payments:', err.message);
    return res.status(500).json({ error: 'Failed to fetch recent payments.' });
  }
}

/**
 * Fetch latest 5 complaints
 * GET /api/dashboard/recent-complaints
 */
async function getRecentComplaints(req, res) {
  try {
    const queryStr = `
      SELECT comp.id, comp.subject, comp.priority, comp.status, comp.created_at, cust.full_name as customer_name
      FROM complaints comp
      JOIN customers cust ON comp.customer_id = cust.id
      ORDER BY comp.created_at DESC
      LIMIT 5;
    `;
    const result = await db.query(queryStr);
    return res.json(result.rows);
  } catch (err) {
    console.error('[DashboardController] Error fetching recent complaints:', err.message);
    return res.status(500).json({ error: 'Failed to fetch recent complaints.' });
  }
}

/**
 * Check network monitoring connection status
 * GET /api/dashboard/network
 */
async function getNetworkStatus(req, res) {
  try {
    // Current requirement is to return false since network load telemetry is disconnected.
    // Real data should only show when monitoring is connected.
    return res.json({
      connected: false,
      load: null
    });
  } catch (err) {
    console.error('[DashboardController] Error checking network status:', err.message);
    return res.status(500).json({ error: 'Failed to check network telemetry status.' });
  }
}

module.exports = {
  getStats,
  getCharts,
  getRecentPayments,
  getRecentComplaints,
  getNetworkStatus
};
