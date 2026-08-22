const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { initializeDatabase } = require('./config/dbInit');
const { startScheduler } = require('./utils/scheduler');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with Credentials support (required for HTTP-only cookie transmissions in dev)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Bind API endpoint routes
app.use('/api', apiRouter);

// Root path details
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the ISP Management System API',
    endpoints: {
      health: '/api/health'
    }
  });
});

// Boot the server and auto-initialize SQL tables if database is configured
app.listen(PORT, async () => {
  console.log(`[Server] ISP Management System API is active on port ${PORT}`);
  
  // Run DB schema build checks
  await initializeDatabase();
  
  // Start scheduled background tasks
  startScheduler();
});
