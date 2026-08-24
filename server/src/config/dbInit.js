const db = require('./db');

const schemaSql = `
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'employee', 'customer', 'technician')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  address TEXT,
  cnic VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  installation_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 3. Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  cnic VARCHAR(20),
  address TEXT,
  designation VARCHAR(100),
  role VARCHAR(50) DEFAULT 'employee',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Packages Table
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  speed_mbps INTEGER NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  data_limit_gb INTEGER,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  package_id INTEGER REFERENCES packages(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  billing_month VARCHAR(7) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- 7. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_reference VARCHAR(100),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'Paid' CHECK (status IN ('Paid', 'Partial', 'Failed', 'completed', 'failed', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  assigned_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);

-- 9. Complaint Updates Table
CREATE TABLE IF NOT EXISTS complaint_updates (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'open', 'in_progress', 'resolved', 'closed')),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Customer Usage Table
CREATE TABLE IF NOT EXISTS customer_usage (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  download_bytes BIGINT NOT NULL DEFAULT 0,
  upload_bytes BIGINT NOT NULL DEFAULT 0,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, subscription_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_customer_usage_date ON customer_usage(usage_date);
`;

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('[Database] DATABASE_URL is not set. Skipping schema initialization.');
    return false;
  }

  console.log('[Database] Starting database schema initialization...');
  try {
    await db.query(schemaSql);
    console.log('[Database] Database tables, relationships, and indexes checked/created successfully.');

    // Sync employees table schema changes (if table already exists)
    await db.query(`
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS cnic VARCHAR(20);
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee';
    `);

    // Create Employee Portal specific tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS technical_tasks (
        id SERIAL PRIMARY KEY,
        task_type VARCHAR(100) NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        assigned_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'on_the_way', 'in_progress', 'completed')),
        admin_notes TEXT,
        due_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS work_reports (
        id SERIAL PRIMARY KEY,
        complaint_id INTEGER REFERENCES complaints(id) ON DELETE SET NULL,
        task_id INTEGER REFERENCES technical_tasks(id) ON DELETE SET NULL,
        employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        problem_found TEXT,
        work_performed TEXT,
        solution TEXT,
        equipment_used TEXT,
        additional_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employee_notifications (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employee_activities (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        action VARCHAR(200) NOT NULL,
        status VARCHAR(50) DEFAULT 'success',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sync users role check constraint (if table already exists)
    await db.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'employee', 'customer', 'technician'));
    `);

    // Sync complaints check constraints (if tables already exist)
    await db.query(`
      ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_priority_check;
      ALTER TABLE complaints ADD CONSTRAINT complaints_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

      ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
      ALTER TABLE complaints ADD CONSTRAINT complaints_status_check CHECK (status IN ('pending', 'open', 'in_progress', 'resolved', 'closed'));

      ALTER TABLE complaint_updates DROP CONSTRAINT IF EXISTS complaint_updates_status_check;
      ALTER TABLE complaint_updates ADD CONSTRAINT complaint_updates_status_check CHECK (status IN ('pending', 'open', 'in_progress', 'resolved', 'closed'));
    `);

    // Sync payments table alterations (if table already exists)
    await db.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
      ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('Paid', 'Partial', 'Failed', 'completed', 'failed', 'pending'));
    `);

    // Sync customers status check constraint to support 'suspended'
    await db.query(`
      ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_status_check;
      ALTER TABLE customers ADD CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive', 'suspended'));
      
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS activation_date TIMESTAMP WITH TIME ZONE;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50) DEFAULT 'monthly';
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS service_expiry_date TIMESTAMP WITH TIME ZONE;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 3;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS service_status VARCHAR(50) DEFAULT 'ACTIVE';
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

      ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_service_status_check;
      ALTER TABLE customers ADD CONSTRAINT customers_service_status_check CHECK (service_status IN ('ACTIVE', 'DUE', 'SUSPENDED', 'EXPIRED'));
    `);

    // Sync technical_tasks status check constraint to support 'accepted' and 'pending'
    await db.query(`
      ALTER TABLE technical_tasks DROP CONSTRAINT IF EXISTS technical_tasks_status_check;
      ALTER TABLE technical_tasks ADD CONSTRAINT technical_tasks_status_check CHECK (status IN ('assigned', 'accepted', 'on_the_way', 'in_progress', 'completed', 'pending', 'rejected'));
    `);

    // Create settings table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default grace period if not exists
    const checkGracePeriod = await db.query("SELECT COUNT(*) FROM settings WHERE key = 'grace_period'");
    if (parseInt(checkGracePeriod.rows[0].count, 10) === 0) {
      await db.query("INSERT INTO settings (key, value) VALUES ('grace_period', '3')");
    }

    // Seed packages if table is empty
    const checkPackages = await db.query('SELECT COUNT(*) FROM packages');
    if (parseInt(checkPackages.rows[0].count, 10) === 0) {
      console.log('[Database] Seeding default package tiers in PKR...');
      await db.query(`
        INSERT INTO packages (name, speed_mbps, monthly_price, data_limit_gb, description, status) VALUES
        ('Starter Fiber (10 Mbps)', 10, 1500.00, NULL, 'Ideal for light browsing and streaming', 'active'),
        ('Standard Fiber (25 Mbps)', 25, 2500.00, NULL, 'Best for families and smart devices', 'active'),
        ('Premium Fiber (50 Mbps)', 50, 4000.00, NULL, 'High speed for gaming and 4K streaming', 'active')
      `);
      console.log('[Database] Default package tiers seeded successfully.');
    } else {
      // Check and update legacy prices from early seeds
      const checkUsdPrices = await db.query("SELECT COUNT(*) FROM packages WHERE monthly_price IN (15.00, 25.00, 40.00)");
      if (parseInt(checkUsdPrices.rows[0].count, 10) > 0) {
        console.log('[Database] Migrating legacy packages prices to PKR Rs. units...');
        await db.query(`
          UPDATE packages SET monthly_price = 1500.00 WHERE name = 'Starter Fiber (10 Mbps)' AND monthly_price = 15.00;
          UPDATE packages SET monthly_price = 2500.00 WHERE name = 'Standard Fiber (25 Mbps)' AND monthly_price = 25.00;
          UPDATE packages SET monthly_price = 4000.00 WHERE name = 'Premium Fiber (50 Mbps)' AND monthly_price = 40.00;
        `);
        console.log('[Database] Package prices updated to PKR successfully.');
      }
    }

    return true;
  } catch (err) {
    console.error('[Database] Error initializing database schema:', err.message);
    return false;
  }
}

// Allow direct execution (e.g. node src/config/dbInit.js)
if (require.main === module) {
  initializeDatabase().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = {
  initializeDatabase
};
