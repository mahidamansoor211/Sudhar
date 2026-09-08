const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

const ApiError = require('../utils/ApiError');

// Verifies the JWT and attaches the relevant user to req.user.
// Middleware must be used on protected routes.
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Not authorized, no token provided');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, 'Not authorized, invalid or expired token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'Not authorized, user no longer exists');
    }
    if (!user.isActive) {
      throw new ApiError(403, 'Account deactivated, contact an administrator');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Scopes access to users whose role is in the allowed list.
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authorized'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { protect, authorize };
