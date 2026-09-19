const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

let io = null;
const userSockets = new Map(); // userId -> Set<socketId>

// Authenticates the socket using the JWT passed via handshake query.
async function authenticateSocket(socket, next) {
  try {
    const token = (socket.handshake.auth && socket.handshake.auth.token) || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return next(new Error('Invalid or deactivated account'));
    }
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim()),
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    socket.on('disconnect', () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) userSockets.delete(userId);
      }
    });
  });

  return io;
}

// Pushes a notification to a user's room AND persists it in MongoDB.
const notifyUser = async (recipientId, { type, issueId = null, title, message = '' }) => {
  if (!io) return null;

  const Notification = require('../models/Notification');

  let doc = null;
  try {
    doc = await Notification.create({ recipient: recipientId, type, issueId, title, message });
  } catch (err) {
    console.error('Failed to persist notification:', err.message);
  }

  io.to(`user:${recipientId}`).emit('notification', {
    id: doc ? doc._id : null,
    type,
    issueId: issueId ? String(issueId) : null,
    title,
    message,
    read: false,
    createdAt: doc ? doc.createdAt : new Date().toISOString(),
  });

  return doc;
};

module.exports = { initSocket, notifyUser, getIO: () => io };