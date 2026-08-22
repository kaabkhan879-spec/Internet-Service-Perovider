const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('WARNING: DATABASE_URL is not set in environment variables. Database client is unconfigured.');
}

// Neon PostgreSQL requires SSL connections, which can be configured conditionally
const isNeon = connectionString && connectionString.includes('neon.tech');

const pool = new Pool({
  connectionString: connectionString,
  ssl: isNeon ? { rejectUnauthorized: false } : false
});

// Avoid crashes due to idle connection losses
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
