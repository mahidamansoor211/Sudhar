const Issue = require('../models/Issue');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { DEPARTMENTS, ROLES } = require('../config/constants');

const OPEN_STATUSES = ['reported', 'acknowledged', 'assigned', 'in_progress'];

// === System-wide analytics for the admin console ===

const getAnalytics = async () => {
  const now = new Date();

  // Overall status counts.
  const byStatusRaw = await Issue.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(byStatusRaw.map((s) => [s._id, s.count]));

  // Per-department workload (open / overdue / resolved / total).
  const byDepartment = await Issue.aggregate([
    {
      $group: {
        _id: { $ifNull: ['$department', '__triage__'] },
        open: { $sum: { $cond: [{ $in: ['$status', OPEN_STATUSES] }, 1, 0] } },
        overdue: {
          $sum: {
            $cond: [
              { $and: [{ $in: ['$status', OPEN_STATUSES] }, { $lt: ['$slaDeadline', now] }] },
              1,
              0,
            ],
          },
        },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const departmentStats = byDepartment.map((d) => ({
    department: d._id === '__triage__' ? null : d._id,
    open: d.open,
    overdue: d.overdue,
    resolved: d.resolved,
    total: d.total,
  }));

  // Complaint categories.
  const byCategoryRaw = await Issue.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const byCategory = byCategoryRaw.map((c) => ({ category: c._id, count: c.count }));

  // SLA compliance: of issues that reached "resolved", how many were resolved
  // before (or on) their SLA deadline.
  const slaAgg = await Issue.aggregate([
    {
      $project: {
        slaDeadline: 1,
        resolvedStep: {
          $let: {
            vars: {
              steps: {
                $filter: {
                  input: '$statusHistory',
                  as: 'h',
                  cond: { $eq: ['$$h.status', 'resolved'] },
                },
              },
            },
            in: { $arrayElemAt: ['$$steps', -1] },
          },
        },
      },
    },
    { $match: { resolvedStep: { $ne: null }, slaDeadline: { $ne: null } } },
    {
      $group: {
        _id: null,
        met: {
          $sum: {
            $cond: [{ $lte: ['$resolvedStep.timestamp', '$slaDeadline'] }, 1, 0],
          },
        },
        missed: {
          $sum: {
            $cond: [{ $gt: ['$resolvedStep.timestamp', '$slaDeadline'] }, 1, 0],
          },
        },
      },
    },
  ]);
  const sla =
    slaAgg[0]?.met + slaAgg[0]?.missed > 0
      ? {
          met: slaAgg[0].met,
          missed: slaAgg[0].missed,
          rate: Math.round((slaAgg[0].met / (slaAgg[0].met + slaAgg[0].missed)) * 100),
        }
      : { met: 0, missed: 0, rate: 0 };

  // Reports over the last 14 days.
  const since = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);
  const trendRaw = await Issue.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ]);
  const trendMap = Object.fromEntries(trendRaw.map((t) => [t._id, t.count]));
  const trend = [];
  for (let i = 0; i < 14; i += 1) {
    const day = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    trend.push({ date: key, count: trendMap[key] || 0 });
  }

  return {
    totals: {
      total: (byStatus.reported || 0) + (byStatus.acknowledged || 0) + (byStatus.assigned || 0) + (byStatus.in_progress || 0) +
        (byStatus.resolved || 0) + (byStatus.rejected || 0),
      open: (byStatus.reported || 0) + (byStatus.acknowledged || 0) + (byStatus.assigned || 0) + (byStatus.in_progress || 0),
      resolved: byStatus.resolved || 0,
      rejected: byStatus.rejected || 0,
    },
    byStatus,
    byDepartment: departmentStats,
    byCategory,
    sla,
    overdue: departmentStats.reduce((sum, d) => sum + d.overdue, 0),
    flagged: await Issue.countDocuments({ flaggedAsSpam: true }),
    trend,
  };
};

// === Admin queue: all departments, with a department filter for the console ===

const getAdminQueue = async ({ department, status, category, flagged, search } = {}) => {
  const query = {};
  if (department === 'UNDEPARTED') query.department = null;
  else if (department) query.department = department;
  if (status) query.status = status;
  if (category) query.category = category;
  if (flagged === 'true') query.flaggedAsSpam = true;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const issues = await Issue.find(query)
    .populate('assignedTo', 'name department')
    .sort({ createdAt: -1 })
    .limit(300);

  return issues.map((issue) => ({
    id: issue._id,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    department: issue.department,
    address: issue.address,
    images: issue.images,
    status: issue.status,
    priority: issue.priority,
    slaDeadline: issue.slaDeadline,
    upvoteCount: issue.upvotes.length,
    flaggedAsSpam: issue.flaggedAsSpam,
    flagCount: issue.flaggedBy.length,
    resolutionConfirmedByReporter: issue.resolutionConfirmedByReporter,
    reportedAt: issue.createdAt,
    assignedTo: issue.assignedTo
      ? { id: issue.assignedTo._id, name: issue.assignedTo.name, department: issue.assignedTo.department }
      : null,
  }));
};

// === User management ===

const getUsers = async ({ search, role, active, limit = 200 } = {}) => {
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;
  if (active === 'true') query.isActive = true;
  if (active === 'false') query.isActive = false;

  const users = await User.find(query)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  // Count reports per user in one aggregation.
  const counts = await Issue.aggregate([
    { $group: { _id: '$reportedBy', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  return users.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    isActive: u.isActive,
    createdAt: u.createdAt,
    reportCount: countMap[String(u._id)] || 0,
  }));
};

const setUserActive = async (userId, requesterId, isActive) => {
  if (String(userId) === String(requesterId)) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  user.isActive = isActive;
  await user.save();
  return { id: user._id, name: user.name, email: user.email, isActive: user.isActive };
};

// Clears community spam flags so a resolved issue is not stuck in the spam pile.
const clearSpam = async (issueId) => {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  issue.flaggedAsSpam = false;
  issue.flaggedBy = [];
  await issue.save();
  return { id: issue._id, flaggedAsSpam: false };
};

module.exports = { getAnalytics, getAdminQueue, getUsers, setUserActive, clearSpam };