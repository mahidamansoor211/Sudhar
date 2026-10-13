const Comment = require('../models/Comment');
const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');
const { notifyUser } = require('./socketService');
const { notifyIssueStakeholders } = require('./notificationService');

// Posts a comment on an issue. Any signed-in user can comment; the reporter,
// the assigned staff member and all admins are notified (except the author).
const addComment = async ({ issueId, userId, userName, text }) => {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const comment = await Comment.create({ issueId, userId, text });

  const payload = {
    type: 'comment',
    issueId: issue._id,
    title: `${userName} commented on your report`,
    message: `"${issue.title}" — ${text.slice(0, 120)}`,
  };

  // The reporter always cares about discussion on their issue.
  if (!issue.reportedBy.equals(userId)) {
    await notifyUser(issue.reportedBy, payload);
  }

  // Department staff, admins, and the assignee see it too.
  if (issue.assignedTo && !issue.assignedTo.equals(userId)) {
    await notifyUser(issue.assignedTo, {
      ...payload,
      title: `${userName} commented on an assigned issue`,
    });
  }
  await notifyIssueStakeholders({
    department: issue.department,
    excludeUserId: userId,
    payload,
  });

  return commentView(comment, userName);
};

const getComments = async (issueId) => {
  const comments = await Comment.find({ issueId })
    .sort({ createdAt: 1 })
    .populate('userId', 'name role department')
    .limit(200);

  return comments.map((c) => ({
    id: c._id,
    issueId: c.issueId,
    user: c.userId
      ? { id: c.userId._id, name: c.userId.name, role: c.userId.role, department: c.userId.department }
      : { name: 'Deleted user' },
    text: c.text,
    createdAt: c.createdAt,
  }));
};

const commentView = (comment, userName) => ({
  id: comment._id,
  issueId: comment.issueId,
  user: { name: userName },
  text: comment.text,
  createdAt: comment.createdAt,
});

module.exports = { addComment, getComments };