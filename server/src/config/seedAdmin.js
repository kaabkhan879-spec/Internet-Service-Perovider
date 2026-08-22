const db = require('./db');
const { hashPassword } = require('../utils/password');
require('dotenv').config();

async function seedAdmin() {
  const adminName = process.env.ADMIN_NAME;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminName || !adminEmail || !adminPassword) {
    console.error('ERROR: Missing admin seed environment parameters (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD) in .env file.');
    return false;
  }

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not configured. Cannot connect to database.');
    return false;
  }

  console.log(`[Seed] Checking database for administrator: ${adminEmail}...`);
  try {
    // Check if user already exists
    const checkUser = await db.query('SELECT id, name, role FROM users WHERE email = $1', [adminEmail]);
    
    if (checkUser.rows.length > 0) {
      const existingUser = checkUser.rows[0];
      if (existingUser.role === 'admin') {
        console.log(`[Seed] Administrator account (${adminEmail}) already exists. Seed skipped.`);
        return true;
      } else {
        console.warn(`[Seed] WARNING: User with email ${adminEmail} exists but has role "${existingUser.role}".`);
        return false;
      }
    }

    // Hash the password and insert the new admin
    console.log('[Seed] Generating password hash...');
    const passwordHash = await hashPassword(adminPassword);

    console.log('[Seed] Inserting administrator record into users table...');
    const insertResult = await db.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'active')
       RETURNING id, name, email, role, status`,
      [adminName, adminEmail, passwordHash]
    );

    const seededUser = insertResult.rows[0];
    console.log(`[Seed] Success: Administrator account "${seededUser.name}" created (ID: ${seededUser.id}).`);
    return true;
  } catch (err) {
    console.error('[Seed] Database insertion failed:', err.message);
    return false;
  }
}

// Allow direct script runs (e.g. node src/config/seedAdmin.js)
if (require.main === module) {
  seedAdmin().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  seedAdmin
};
