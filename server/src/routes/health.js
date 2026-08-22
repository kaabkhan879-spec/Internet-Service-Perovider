const express = require('express');
const db = require('../config/db');

const router = express.Router();

// GET /api/health
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      server: 'healthy',
      database: 'unconfigured'
    }
  };

  if (!process.env.DATABASE_URL) {
    return res.json(health);
  }

  try {
    // Attempt database query to verify Express to Neon communication
    const dbCheck = await db.query('SELECT NOW()');
    if (dbCheck && dbCheck.rows.length > 0) {
      health.services.database = 'healthy';
    } else {
      health.services.database = 'degraded';
    }
    res.json(health);
  } catch (err) {
    health.services.database = 'unreachable';
    health.error = err.message;
    // Return 200 with error details to assist in initial project configuration
    res.status(200).json(health);
  }
});

module.exports = router;
