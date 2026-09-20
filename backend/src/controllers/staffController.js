const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const staffService = require('../services/staffService');
const { STATUSES, CATEGORIES, PRIORITIES } = require('../config/constants');

// GET /api/staff/issues?status=&category=&priority=&flagged=&search=
const listQueue = asyncHandler(async (req, res) => {
  const issues = await staffService.getQueue(req.user, {
    status: req.query.status,
    category: req.query.category,
    priority: req.query.priority,
    flagged: req.query.flagged,
    search: req.query.search,
  });
  res.json({ success: true, count: issues.length, issues });
});

// GET /api/staff/stats
const stats = asyncHandler(async (req, res) => {
  const data = await staffService.getStats(req.user);
  res.json({ success: true, ...data });
});

// PATCH /api/staff/issues/:id/status   body: { status, note }
const changeStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!status || !STATUSES.includes(status)) {
    throw new ApiError(400, `status must be one of: ${STATUSES.join(', ')}`);
  }
  const result = await staffService.updateStatus(req.params.id, req.user, { status, note: note || '' });
  res.json({ success: true, ...result });
});

// POST /api/staff/issues/:id/assign    body: { assignedTo, note }
const assign = asyncHandler(async (req, res) => {
  const { assignedTo, note } = req.body;
  if (!assignedTo) {
    throw new ApiError(400, 'assignedTo (staff user id) is required');
  }
  const result = await staffService.assignIssue(req.params.id, req.user, { assignedTo, note: note || '' });
  res.json({ success: true, ...result });
});

// PATCH /api/staff/issues/:id/priority body: { priority }
const priority = asyncHandler(async (req, res) => {
  const { priority: value } = req.body;
  if (!value || !PRIORITIES.includes(value)) {
    throw new ApiError(400, `priority must be one of: ${PRIORITIES.join(', ')}`);
  }
  const result = await staffService.setPriority(req.params.id, req.user, { priority: value });
  res.json({ success: true, ...result });
});

// PATCH /api/staff/issues/:id/reroute   body: { department }  (admin only)
const reroute = asyncHandler(async (req, res) => {
  const result = await staffService.rerouteIssue(req.params.id, req.user, {
    department: req.body.department || null,
  });
  res.json({ success: true, ...result });
});

// GET /api/staff/members  (assignee dropdown)
const members = asyncHandler(async (req, res) => {
  const staffList = await staffService.getDepartmentStaff(req.user);
  res.json({ success: true, staff: staffList });
});

module.exports = { listQueue, stats, changeStatus, assign, priority, reroute, members };