const express = require('express');
const cors = require('cors');
const { connectDB, closeDB } = require('./src/config/db');
const { seedDatabase } = require('./src/utils/seed');
const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const memberRoutes = require('./src/routes/members');
const planRoutes = require('./src/routes/plans');
const revenueRoutes = require('./src/routes/revenue');
const reportRoutes = require('./src/routes/reports');
const notificationRoutes = require('./src/routes/notifications');
const adminRoutes = require('./src/routes/admins');
const { env } = require('./src/config/env');

const app = express();

const allowedOrigins = new Set([
  ...env.FRONTEND_ORIGINS,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({
    message: 'GymPro Admin Panel API',
    version: '1.0.0',
    stack: 'Node.js, Express, MongoDB',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admins', adminRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const detail = err.detail || err.message || 'Internal server error';
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ detail });
});

async function start() {
  try {
    await connectDB();
    await seedDatabase();
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`GymPro API running on http://0.0.0.0:${env.PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

start();
