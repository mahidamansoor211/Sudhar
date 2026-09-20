const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['status_change', 'upvote', 'assigned', 'comment', 'resolution_confirmed', 'flagged', 'system', 'new_issue', 'flag'],
      required: true,
    },
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Notification title cannot exceed 200 characters'],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notification message cannot exceed 1000 characters'],
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);