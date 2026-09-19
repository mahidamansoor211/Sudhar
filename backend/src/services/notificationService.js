const Notification = require('../models/Notification');

const getUserNotifications = async (userId, { limit = 50, unreadOnly = false } = {}) => {
  const query = { recipient: userId };
  if (unreadOnly) query.read = false;

  const list = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  return list.map((n) => ({
    id: n._id,
    type: n.type,
    issueId: n.issueId ? String(n.issueId) : null,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt,
  }));
};

const markAsRead = async (notificationId, userId) => {
  const n = await Notification.findById(notificationId);
  if (!n) {
    const ApiError = require('../utils/ApiError');
    throw new ApiError(404, 'Notification not found');
  }
  if (!n.recipient.equals(userId)) {
    const ApiError = require('../utils/ApiError');
    throw new ApiError(403, 'Not your notification');
  }
  n.read = true;
  await n.save();
  return { id: n._id, read: true };
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, read: false }, { read: true });
  return { success: true };
};

const unreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, read: false });
};

module.exports = { getUserNotifications, markAsRead, markAllAsRead, unreadCount };