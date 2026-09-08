const express = require('express');
const cors = require('cors');
const http = require('http');

const connectDB = require('./config/db');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/error');

async function start() {
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Sudhar API is running',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);

  app.use(notFound);
  app.use(errorHandler);

  server.listen(env.PORT, () => {
    console.log(`Sudhar backend running on port ${env.PORT}`);
  });

  return server;
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = { start };