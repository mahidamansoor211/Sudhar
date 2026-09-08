const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { ROLES, DEPARTMENTS } = require('../config/constants');

const signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// Self-registration is always a citizen. Staff/admin are created by the admin
// through the seed script or the admin user-management endpoints (Phase 5).
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(400, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: 'citizen' });

  const token = signToken(user._id);
  res.status(201).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account deactivated, contact an administrator');
  }

  const token = signToken(user._id);
  res.status(200).json({
    success: true,
    token,
    user: user.toPublicJSON(),
  });
});

// Returns the authenticated user, used on app load to restore session.
const me = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toPublicJSON(),
  });
});

// Exposed for the seed script / admin user creation (Phase 5).
// Validates role/department semantics for staff accounts.
const validateRoleInput = (role, department) => {
  if (role === 'staff' && !DEPARTMENTS.includes(department)) {
    throw new ApiError(400, 'Staff accounts require a valid department');
  }
  if (role !== 'staff' && department) {
    throw new ApiError(400, 'Only staff accounts may have a department');
  }
};

module.exports = { register, login, me, validateRoleInput };