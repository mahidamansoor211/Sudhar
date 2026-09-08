const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, DEPARTMENTS } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'citizen',
    },
    department: {
      type: String,
      enum: [...DEPARTMENTS, null],
      default: null,
      validate: {
        validator: function (value) {
          if (this.role === 'staff' && !value) {
            return false;
          }
          if (this.role !== 'staff' && value) {
            return false;
          }
          return true;
        },
        message: 'Department is required for staff and forbidden for others',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
