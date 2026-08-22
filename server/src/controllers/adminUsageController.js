const db = require('../config/db');

// Configurable thresholds in a single location
const THRESHOLDS = {
  warning: 80.0,
  high: 90.0,
  limit: 100.0
};

/**
 * Helper to process rows and attach calculated thresholds, percentages, and status labels
 */
function processUsageRows(rows) {
  return rows.map(row => {
    const isUnavailable = row.is_data_unavailable;
    
    const download = isUnavailable ? null : parseFloat(row.download_bytes);
    const upload = isUnavailable ? null : parseFloat(row.upload_bytes);
    const total = isUnavailable ? null : parseFloat(row.total_bytes);
    
    const limitGb = row.package_limit_gb;
    const limitBytes = limitGb ? limitGb * 1024 * 1024 * 1024 : null;
    
    let percentage = null;
    let status = 'Data Unavailable';
    
    if (!isUnavailable) {
      if (limitBytes) {
        percentage = parseFloat(((total / limitBytes) * 100).toFixed(2));
        if (percentage >= THRESHOLDS.limit) {
          status = 'Limit Reached';
        } else if (percentage >= THRESHOLDS.high) {
          status = 'High Usage';
        } else if (percentage >= THRESHOLDS.warning) {
          status = 'Warning';
        } else {
          status = 'Normal';
        }
      } else {
        status = 'Normal'; // Unlimited plans
      }
    }
    
    return {
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      customer_code: row.customer_code,
      package_name: row.package_name || 'No Active Package',
      package_limit_gb: limitGb,
      download_bytes: download,
      upload_bytes: upload,
      total_bytes: total,
      usage_percentage: percentage,
      status: status,
      last_updated: row.last_updated
    };
  });
}

/**
 * List all customer usage logs
 * GET /api/admin/usage
 */
async function listUsage(req, res) {
  const { search, status, view } = req.query;
  const isMonthly = view === 'monthly';

  try {
    let queryStr = '';
    const queryParams = [];
    let filterIndex = 1;
    const filters = [];

    // Search query parameters
    if (search && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      filters.push(`(c.full_name ILIKE $${filterIndex} OR c.customer_code ILIKE $${filterIndex} OR c.phone ILIKE $${filterIndex})`);
      filterIndex++;
    }

    if (isMonthly) {
      queryStr = `
        SELECT 
          c.id as customer_id, c.full_name as customer_name, c.customer_code,
          p.name as package_name, p.data_limit_gb::float as package_limit_gb,
          s.id as subscription_id,
          monthly_usage.download_bytes,
          monthly_usage.upload_bytes,
          monthly_usage.total_bytes,
          monthly_usage.last_updated,
          CASE WHEN monthly_usage.total_bytes IS NULL THEN TRUE ELSE FALSE END as is_data_unavailable
        FROM customers c
        LEFT JOIN subscriptions s ON s.customer_id = c.id AND s.status = 'active'
        LEFT JOIN packages p ON s.package_id = p.id
        LEFT JOIN LATERAL (
          SELECT 
            SUM(download_bytes)::bigint as download_bytes, 
            SUM(upload_bytes)::bigint as upload_bytes, 
            SUM(total_bytes)::bigint as total_bytes,
            MAX(recorded_at) as last_updated
          FROM customer_usage
          WHERE customer_id = c.id AND subscription_id = s.id
            AND usage_date >= DATE_TRUNC('month', CURRENT_DATE)
        ) monthly_usage ON TRUE
      `;
    } else {
      queryStr = `
        SELECT 
          c.id as customer_id, c.full_name as customer_name, c.customer_code,
          p.name as package_name, p.data_limit_gb::float as package_limit_gb,
          s.id as subscription_id,
          latest_usage.download_bytes,
          latest_usage.upload_bytes,
          latest_usage.total_bytes,
          latest_usage.recorded_at as last_updated,
          CASE WHEN latest_usage.total_bytes IS NULL THEN TRUE ELSE FALSE END as is_data_unavailable
        FROM customers c
        LEFT JOIN subscriptions s ON s.customer_id = c.id AND s.status = 'active'
        LEFT JOIN packages p ON s.package_id = p.id
        LEFT JOIN LATERAL (
          SELECT download_bytes, upload_bytes, total_bytes, recorded_at
          FROM customer_usage
          WHERE customer_id = c.id AND subscription_id = s.id
          ORDER BY usage_date DESC
          LIMIT 1
        ) latest_usage ON TRUE
      `;
    }

    if (filters.length > 0) {
      queryStr += ' WHERE ' + filters.join(' AND ');
    }

    queryStr += ' ORDER BY c.full_name ASC;';

    const result = await db.query(queryStr, queryParams);
    let processed = processUsageRows(result.rows);

    // Apply status filter post-processing in JS to keep backend simple
    if (status) {
      processed = processed.filter(item => item.status.toLowerCase() === status.toLowerCase());
    }

    return res.json(processed);
  } catch (err) {
    console.error('[AdminUsageController] Error listing usage:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve bandwidth usage records.' });
  }
}

/**
 * Get detailed usage reports for a single customer (daily + monthly)
 * GET /api/admin/usage/customer/:customerId
 */
async function getCustomerUsageDetails(req, res) {
  const { customerId } = req.params;

  try {
    // 1. Fetch profile context
    const profileQuery = `
      SELECT c.id, c.full_name, c.customer_code, p.name as package_name, p.data_limit_gb::float as package_limit_gb
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id AND s.status = 'active'
      LEFT JOIN packages p ON s.package_id = p.id
      WHERE c.id = $1;
    `;
    const profileResult = await db.query(profileQuery, [customerId]);
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer record not found.' });
    }

    const profile = profileResult.rows[0];

    // 2. Fetch daily usage today
    const dailyQuery = `
      SELECT download_bytes::float, upload_bytes::float, total_bytes::float, recorded_at
      FROM customer_usage
      WHERE customer_id = $1 AND usage_date = CURRENT_DATE;
    `;
    const dailyResult = await db.query(dailyQuery, [customerId]);

    // 3. Fetch monthly usage summation
    const monthlyQuery = `
      SELECT 
        SUM(download_bytes)::float as download_bytes, 
        SUM(upload_bytes)::float as upload_bytes, 
        SUM(total_bytes)::float as total_bytes,
        MAX(recorded_at) as last_updated
      FROM customer_usage
      WHERE customer_id = $1 AND usage_date >= DATE_TRUNC('month', CURRENT_DATE);
    `;
    const monthlyResult = await db.query(monthlyQuery, [customerId]);

    const hasDaily = dailyResult.rows.length > 0;
    const hasMonthly = monthlyResult.rows.length > 0 && monthlyResult.rows[0].total_bytes !== null;

    const limitGb = profile.package_limit_gb;
    const limitBytes = limitGb ? limitGb * 1024 * 1024 * 1024 : null;
    let monthlyPercentage = null;
    let monthlyStatus = 'Data Unavailable';

    if (hasMonthly) {
      const monthlyTotal = monthlyResult.rows[0].total_bytes;
      if (limitBytes) {
        monthlyPercentage = parseFloat(((monthlyTotal / limitBytes) * 100).toFixed(2));
        if (monthlyPercentage >= THRESHOLDS.limit) {
          monthlyStatus = 'Limit Reached';
        } else if (monthlyPercentage >= THRESHOLDS.high) {
          monthlyStatus = 'High Usage';
        } else if (monthlyPercentage >= THRESHOLDS.warning) {
          monthlyStatus = 'Warning';
        } else {
          monthlyStatus = 'Normal';
        }
      } else {
        monthlyStatus = 'Normal';
      }
    }

    return res.json({
      customer: {
        id: profile.id,
        name: profile.full_name,
        code: profile.customer_code,
        package_name: profile.package_name || 'No Active Package',
        package_limit_gb: limitGb
      },
      today: hasDaily ? {
        download_bytes: dailyResult.rows[0].download_bytes,
        upload_bytes: dailyResult.rows[0].upload_bytes,
        total_bytes: dailyResult.rows[0].total_bytes,
        last_updated: dailyResult.rows[0].recorded_at
      } : null,
      monthly: hasMonthly ? {
        download_bytes: monthlyResult.rows[0].download_bytes,
        upload_bytes: monthlyResult.rows[0].upload_bytes,
        total_bytes: monthlyResult.rows[0].total_bytes,
        last_updated: monthlyResult.rows[0].last_updated,
        percentage: monthlyPercentage,
        status: monthlyStatus
      } : null
    });
  } catch (err) {
    console.error('[AdminUsageController] Error loading customer details:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve detailed customer logs.' });
  }
}

/**
 * Generate monthly usage report for customer listings
 * GET /api/admin/usage/report
 */
async function getUsageReport(req, res) {
  try {
    const reportQuery = `
      SELECT 
        c.id as customer_id, c.full_name as customer_name, c.customer_code,
        p.name as package_name, p.data_limit_gb::float as package_limit_gb,
        s.id as subscription_id,
        monthly_usage.download_bytes,
        monthly_usage.upload_bytes,
        monthly_usage.total_bytes,
        monthly_usage.last_updated,
        CASE WHEN monthly_usage.total_bytes IS NULL THEN TRUE ELSE FALSE END as is_data_unavailable
      FROM customers c
      LEFT JOIN subscriptions s ON s.customer_id = c.id AND s.status = 'active'
      LEFT JOIN packages p ON s.package_id = p.id
      LEFT JOIN LATERAL (
        SELECT 
          SUM(download_bytes)::bigint as download_bytes, 
          SUM(upload_bytes)::bigint as upload_bytes, 
          SUM(total_bytes)::bigint as total_bytes,
          MAX(recorded_at) as last_updated
        FROM customer_usage
        WHERE customer_id = c.id AND subscription_id = s.id
          AND usage_date >= DATE_TRUNC('month', CURRENT_DATE)
      ) monthly_usage ON TRUE
      ORDER BY c.full_name ASC;
    `;
    const result = await db.query(reportQuery);
    const processed = processUsageRows(result.rows);
    return res.json(processed);
  } catch (err) {
    console.error('[AdminUsageController] Error generating report:', err.message);
    return res.status(500).json({ error: 'Failed to generate usage report.' });
  }
}

module.exports = {
  listUsage,
  getCustomerUsageDetails,
  getUsageReport
};
