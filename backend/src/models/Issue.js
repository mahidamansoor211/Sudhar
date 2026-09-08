const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: ['pothole', 'streetlight', 'garbage', 'water', 'other'],
      required: true,
    },
    department: {
      type: String,
      enum: ['WASA', 'LWMC', 'TEPA', 'LESCO', null],
      default: null,
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: [
        'reported',
        'acknowledged',
        'assigned',
        'in_progress',
        'resolved',
        'rejected',
      ],
      default: 'reported',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    slaDeadline: {
      type: Date,
      default: null,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    resolutionConfirmedByReporter: {
      type: Boolean,
      default: false,
    },
    flaggedAsSpam: {
      type: Boolean,
      default: false,
    },
    flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

issueSchema.index({ location: '2dsphere' });
issueSchema.index({ status: 1, department: 1 });
issueSchema.index({ department: 1, createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);
