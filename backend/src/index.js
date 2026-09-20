const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

const connectDB = require('./config/db');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const staffRoutes = require('./routes/staffRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { initSocket } = require('./services/socketService');
const { notFound, errorHandler } = require('./middleware/error');

async function start() {
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());
  const isDev = env.NODE_ENV !== 'production';
  // In dev, accept Vite on any port (5173, 5174, ...) so a port shift never
  // blocks the frontend.
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        if (isDev && /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
        cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve locally-uploaded images (dev fallback when R2 is not configured).
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Sudhar API is running',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  initSocket(server);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('');
      console.error(`Port ${env.PORT} is already in use.`);
      console.error('Another Sudhar backend is probably already running.');
      console.error('Fix it by killing the stale process first:');
      console.error(`  npm run fixports   (in the backend folder)`);
      console.error('Then run  npm run dev  again.');
      process.exit(1);
    }
    console.error('Server error:', err.message);
    process.exit(1);
  });

  server.listen(env.PORT, () => {
    console.log(`Sudhar backend running on port ${env.PORT}`);
  });

  return server;
}

if (require.main === module) {
  start().catch((err) => {
    if (err.name && err.name.startsWith('Mongo')) {
      console.error('MongoDB connection failed:', err.message.split('\n')[0]);
      console.error('Check that backend/.env has a valid MONGO_URI and that you are online.');
    } else {
      console.error('Failed to start server:', err.message);
    }
    process.exit(1);
  });
}

module.exports = { start };