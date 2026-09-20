const Notification = require('../models/Notification');
const User = require('../models/User');
const { notifyUser } = require('./socketService');

// Notifies every active staff member of a department about a payload.
const notifyDepartment = async ({ department, excludeUserId, payload }) => {
  if (!department) return;
  const staff = await User.find({ role: 'staff', isActive: true, department }).select('_id');
  for (const member of staff) {
    if (excludeUserId && member._id.equals(excludeUserId)) continue;
    await notifyUser(member._id, payload);
  }
};

// Notifies every active admin about a payload.
const notifyAdmins = async ({ excludeUserId, payload }) => {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  for (const admin of admins) {
    if (excludeUserId && admin._id.equals(excludeUserId)) continue;
    await notifyUser(admin._id, payload);
  }
};

// Routes a payload to whatever group should see an issue: its department's
// staff plus all admins (admins triage "other" and oversee everything).
const notifyIssueStakeholders = async ({ department, excludeUserId, payload }) => {
  await notifyDepartment({ department, excludeUserId, payload });
  await notifyAdmins({ excludeUserId, payload });
};

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

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  unreadCount,
  notifyDepartment,
  notifyAdmins,
  notifyIssueStakeholders,
};