const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const adminService = require('../services/adminService');
const { ROLES, DEPARTMENTS, STATUSES, CATEGORIES } = require('../config/constants');

// GET /api/admin/stats
const analytics = asyncHandler(async (req, res) => {
  const data = await adminService.getAnalytics();
  res.json({ success: true, ...data });
});

// GET /api/admin/issues?department=&status=&category=&flagged=&search=
const listIssues = asyncHandler(async (req, res) => {
  const issues = await adminService.getAdminQueue({
    department: req.query.department,
    status: req.query.status,
    category: req.query.category,
    flagged: req.query.flagged,
    search: req.query.search,
  });
  res.json({ success: true, count: issues.length, issues });
});

// GET /api/admin/users?search=&role=&active=
const listUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getUsers({
    search: req.query.search,
    role: req.query.role,
    active: req.query.active,
  });
  res.json({ success: true, count: users.length, users });
});

// PATCH /api/admin/users/:id/status   body: { isActive: bool }
const toggleUser = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive (boolean) is required');
  }
  const result = await adminService.setUserActive(req.params.id, req.user._id, isActive);
  res.json({ success: true, ...result });
});

// POST /api/admin/issues/:id/clear-spam
const clearSpam = asyncHandler(async (req, res) => {
  const result = await adminService.clearSpam(req.params.id);
  res.json({ success: true, ...result });
});

module.exports = { analytics, listIssues, listUsers, toggleUser, clearSpam };