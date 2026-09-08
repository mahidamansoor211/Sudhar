const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');

async function connectDB() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not set. Create a backend/.env file (see README).');
  }
  const conn = await mongoose.connect(MONGO_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
}

module.exports = connectDB;