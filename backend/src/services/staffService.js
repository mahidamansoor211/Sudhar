const Issue = require('../models/Issue');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { notifyUser } = require('./socketService');
const {
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  PRIORITIES,
  DEPARTMENTS,
} = require('../config/constants');

const OPEN_STATUSES = ['reported', 'acknowledged', 'assigned', 'in_progress'];

// Staff only see their own department's issues. Admins see everything.
const baseQuery = (user) =>
  user.role === 'admin' ? {} : { department: user.department };

const assertCanTouch = (issue, user) => {
  if (user.role === 'admin') return;
  if (issue.department !== user.department) {
    throw new ApiError(403, 'This issue belongs to another department');
  }
};

const getQueue = async (user, { status, category, priority, flagged, search } = {}) => {
  const query = baseQuery(user);
  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
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
    .limit(200);

  return issues.map((issue) => staffView(issue));
};

const getStats = async (user) => {
  const match = baseQuery(user);

  const byStatus = await Issue.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));

  const [openCount, overdueCount, resolvedCount, confirmedCount, flaggedCount] =
    await Promise.all([
      Issue.countDocuments({ ...match, status: { $in: OPEN_STATUSES } }),
      Issue.countDocuments({
        ...match,
        status: { $in: OPEN_STATUSES },
        slaDeadline: { $lt: new Date() },
      }),
      Issue.countDocuments({ ...match, status: 'resolved' }),
      Issue.countDocuments({ ...match, resolutionConfirmedByReporter: true }),
      Issue.countDocuments({ ...match, flaggedAsSpam: true }),
    ]);

  return {
    total: openCount + resolvedCount,
    openCount,
    overdueCount,
    resolvedCount,
    confirmedCount,
    flaggedCount,
    byStatus: statusMap,
  };
};

// Moves an issue through the enforced status state machine and notifies the
// reporter + any assigned staff in real time.
const updateStatus = async (issueId, user, { status, note = '' }) => {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  assertCanTouch(issue, user);

  if (!STATUS_TRANSITIONS[issue.status]?.includes(status)) {
    throw new ApiError(
      400,
      `Cannot move from "${issue.status}" to "${status}". Allowed: ${STATUS_TRANSITIONS[issue.status] || 'none'}.`
    );
  }

  issue.status = status;
  if (status !== 'resolved') {
    issue.resolutionConfirmedByReporter = false;
  }
  issue.statusHistory.push({
    status,
    changedBy: user._id,
    note: note || (user.role === 'admin' ? 'Updated by admin' : `Updated by ${user.department}`),
  });
  await issue.save();

  // Notify the reporter.
  await notifyUser(issue.reportedBy, {
    type: 'status_change',
    issueId: issue._id,
    title: `Your report is now ${STATUS_LABELS[status]}`,
    message: `"${issue.title}" — ${note || `Status updated to ${STATUS_LABELS[status]}.`}`,
  });

  // Notify the assigned staff member if the status changed under their watch.
  if (issue.assignedTo && !issue.assignedTo.equals(user._id) && status === 'in_progress') {
    await notifyUser(issue.assignedTo, {
      type: 'status_change',
      issueId: issue._id,
      title: 'Issue moved to in progress',
      message: `"${issue.title}" has been marked in progress.`,
    });
  }

  const updated = await Issue.findById(issueId).populate('assignedTo', 'name department');
  return { issue: staffView(updated) };
};

const assignIssue = async (issueId, user, { assignedTo, note = '' }) => {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  assertCanTouch(issue, user);
  if (issue.status !== 'acknowledged' && issue.status !== 'assigned') {
    throw new ApiError(400, 'Only acknowledged issues can be assigned to staff');
  }

  const target = await User.findById(assignedTo);
  if (!target || target.role !== 'staff' || !target.isActive) {
    throw new ApiError(400, 'Assigned staff member not found');
  }
  if (user.role !== 'admin' && target.department !== user.department) {
    throw new ApiError(400, 'Can only assign staff from your own department');
  }
  if (issue.department && target.department !== issue.department) {
    throw new ApiError(400, `Assignee must belong to ${issue.department}`);
  }

  issue.assignedTo = assignedTo;
  if (issue.status === 'acknowledged') {
    issue.status = 'assigned';
  }
  issue.statusHistory.push({
    status: issue.status,
    changedBy: user._id,
    note: note || `Assigned to ${target.name}`,
  });
  await issue.save();

  await notifyUser(target._id, {
    type: 'status_change',
    issueId: issue._id,
    title: 'New issue assigned to you',
    message: `"${issue.title}" was assigned to you by ${user.name}.`,
  });

  const updated = await Issue.findById(issueId).populate('assignedTo', 'name department');
  return { issue: staffView(updated) };
};

const setPriority = async (issueId, user, { priority }) => {
  if (!PRIORITIES.includes(priority)) {
    throw new ApiError(400, `Priority must be one of: ${PRIORITIES.join(', ')}`);
  }
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  assertCanTouch(issue, user);
  issue.priority = priority;
  issue.statusHistory.push({
    status: issue.status,
    changedBy: user._id,
    note: `Priority set to ${priority}`,
  });
  await issue.save();
  const updated = await Issue.findById(issueId).populate('assignedTo', 'name department');
  return { issue: staffView(updated) };
};

// Admins may re-route "other" issues (or correct misrouting).
const rerouteIssue = async (issueId, user, { department }) => {
  if (user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can re-route issues');
  }
  if (department && !DEPARTMENTS.includes(department)) {
    throw new ApiError(400, `Department must be one of: ${DEPARTMENTS.join(', ')} or empty (admin triage)`);
  }
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  issue.department = department || null;
  issue.assignedTo = null;
  issue.statusHistory.push({
    status: issue.status,
    changedBy: user._id,
    note: department ? `Re-routed to ${department}` : 'Re-routed to admin triage',
  });
  await issue.save();
  const updated = await Issue.findById(issueId).populate('assignedTo', 'name department');
  return { issue: staffView(updated) };
};

const getDepartmentStaff = async (user) => {
  const query =
    user.role === 'admin'
      ? { role: 'staff', isActive: true }
      : { role: 'staff', isActive: true, department: user.department };
  const staff = await User.find(query).select('name department').sort('name');
  return staff.map((s) => ({ id: s._id, name: s.name, department: s.department }));
};

const staffView = (issue) => ({
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
  reporter: issue.reportedBy,
  assignedTo: issue.assignedTo
    ? { id: issue.assignedTo._id, name: issue.assignedTo.name, department: issue.assignedTo.department }
    : null,
  reportedAt: issue.createdAt,
  statusHistory: issue.statusHistory.map((entry) => ({
    status: entry.status,
    changedBy: entry.changedBy,
    timestamp: entry.timestamp,
    note: entry.note,
  })),
});

module.exports = {
  getQueue,
  getStats,
  updateStatus,
  assignIssue,
  setPriority,
  rerouteIssue,
  getDepartmentStaff,
};