const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');
const { notifyUser } = require('./socketService');
const { notifyIssueStakeholders } = require('./notificationService');
const {
  CATEGORY_TO_DEPARTMENT,
  SLA_MS,
} = require('../config/constants');

const DUPLICATE_RADIUS_METERS = 50;
const LAHORE_BOUNDS = {
  minLat: 31.4,
  maxLat: 31.6,
  minLng: 74.2,
  maxLng: 74.4,
};

const computeSlaDeadline = (category) => {
  const sla = SLA_MS[category] || SLA_MS.other;
  return new Date(Date.now() + sla);
};

const validateLahoreCoords = (lng, lat) => {
  const inBounds =
    lat >= LAHORE_BOUNDS.minLat &&
    lat <= LAHORE_BOUNDS.maxLat &&
    lng >= LAHORE_BOUNDS.minLng &&
    lng <= LAHORE_BOUNDS.maxLng;
  if (!inBounds) {
    throw new ApiError(400, 'Coordinates must be within Lahore, Pakistan');
  }
};

// Creates an issue: auto-routes category -> department with no human involved.
const createIssue = async ({ title, description, category, lng, lat, address, images }, userId) => {
  validateLahoreCoords(lng, lat);

  const department = CATEGORY_TO_DEPARTMENT[category];

  const issue = await Issue.create({
    reportedBy: userId,
    title,
    description,
    category,
    department,
    location: { type: 'Point', coordinates: [lng, lat] },
    address,
    images,
    status: 'reported',
    slaDeadline: computeSlaDeadline(category),
    statusHistory: [
      {
        status: 'reported',
        changedBy: userId,
        note: 'Issue reported by citizen',
      },
    ],
  });

  // Let the receiving department's staff (and admins) know a new report arrived.
  await notifyIssueStakeholders({
    department,
    payload: {
      type: 'new_issue',
      issueId: issue._id,
      title: 'New issue in your queue',
      message: `"${title}" (${category}) reported at ${address || 'an unlabeled location'}.`,
    },
  });

  return { issue, department };
};

// Geospatial duplicate detection: near (<50m) + same category.
const findNearbyDuplicates = async ({ lng, lat, category, excludeIssueId, userId }) => {
  const query = {
    _id: { $ne: excludeIssueId },
    category,
    status: { $in: ['reported', 'acknowledged', 'assigned', 'in_progress'] },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: DUPLICATE_RADIUS_METERS,
      },
    },
  };

  const issues = await Issue.find(query)
    .select('title description status upvotes images')
    .limit(5);

  return issues.map((issue) => {
    const upvoteCount = issue.upvotes.length;
    const upvotedByMe = userId ? issue.upvotes.some((id) => id.equals(userId)) : false;
    return {
      id: issue._id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      upvoteCount,
      upvotedByMe,
      image: issue.images[0] || null,
    };
  });
};

const getIssues = async ({ category, status, department, lat, lng, radiusMeters = 20000, userId }) => {
  const query = {};

  if (category) query.category = category;
  if (status) query.status = status;
  if (department) query.department = department;

  // If a center point is provided, apply geospatial filter.
  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radiusMeters),
      },
    };
  }

  const issues = await Issue.find(query)
    .populate('assignedTo', 'name department')
    .sort({ createdAt: -1 })
    .limit(200);

  return issues.map((issue) => issueToView(issue, userId));
};

const getIssueById = async (issueId, userId) => {
  const issue = await Issue.findById(issueId).populate(
    'assignedTo',
    'name department'
  );
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  return issueToView(issue, userId);
};

const upvoteIssue = async (issueId, userId) => {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  if (issue.upvotes.some((id) => id.equals(userId))) {
    throw new ApiError(400, 'You have already upvoted this issue');
  }
  issue.upvotes.push(userId);
  await issue.save();

  // Notify the reporter that their report gained an upvote (not themselves).
  if (issue.reportedBy && !issue.reportedBy.equals(userId)) {
    await notifyUser(issue.reportedBy, {
      type: 'upvote',
      issueId: issue._id,
      title: 'Your report gained an upvote',
      message: `"${issue.title}" just received an upvote from another citizen.`,
    });
  }

  return { upvoteCount: issue.upvotes.length };
};

// Citizen/staff flag an issue as spam or irrelevant for moderation review.
const flagIssue = async (issueId, userId) => {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  if (issue.flaggedBy.some((id) => id.equals(userId))) {
    throw new ApiError(400, 'You have already flagged this issue');
  }
  issue.flaggedBy.push(userId);
  if (issue.flaggedBy.length >= 3) {
    issue.flaggedAsSpam = true;
  }
  await issue.save();

  await notifyIssueStakeholders({
    department: issue.department,
    payload: {
      type: 'flag',
      issueId: issue._id,
      title: issue.flaggedAsSpam
        ? 'Report marked as spam'
        : 'A report was flagged',
      message: `"${issue.title}" was flagged for review${issue.flaggedAsSpam ? ' and is now marked as spam.' : '.'}`,
    },
  });

  return { flagCount: issue.flaggedBy.length, flaggedAsSpam: issue.flaggedAsSpam };
};

// Reporter confirms a resolution (optionally with a verification photo).
const confirmResolution = async (issueId, userId, { confirmationImages = [] }) => {
  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  if (!issue.reportedBy.equals(userId)) {
    throw new ApiError(403, 'Only the reporter can confirm resolution');
  }
  if (issue.status !== 'resolved') {
    throw new ApiError(400, 'This issue is not marked as resolved yet');
  }
  if (issue.resolutionConfirmedByReporter) {
    throw new ApiError(400, 'Resolution already confirmed');
  }

  issue.resolutionConfirmedByReporter = true;
  if (confirmationImages.length > 0) {
    issue.images.push(...confirmationImages);
  }
  issue.statusHistory.push({
    status: 'resolved',
    changedBy: userId,
    note: confirmationImages.length
      ? 'Resolution confirmed by reporter with photo evidence'
      : 'Resolution confirmed by reporter',
  });
  await issue.save();

  // Let the department + admins know the citizen verified the fix.
  await notifyIssueStakeholders({
    department: issue.department,
    excludeUserId: userId,
    payload: {
      type: 'resolution_confirmed',
      issueId: issue._id,
      title: 'Resolution confirmed by citizen',
      message: `"${issue.title}" was verified as fixed by the reporter.`,
    },
  });

  return { resolutionConfirmedByReporter: true };
};

// All issues the user submitted, and optionally ones they upvoted.
const getMyReports = async (userId, { includeUpvoted = true } = {}) => {
  const query = { reportedBy: userId };
  let issues = await Issue.find(query).sort({ createdAt: -1 });

  if (includeUpvoted) {
    const upvoted = await Issue.find({
      upvotes: userId,
      reportedBy: { $ne: userId },
    }).sort({ createdAt: -1 });
    issues = issues.concat(upvoted);
  }

  return issues.map((issue) => {
    const view = issueToView(issue, userId);
    view.submittedByMe = issue.reportedBy.equals(userId);
    return view;
  });
};

const issueToView = (issue, userId) => ({
  id: issue._id,
  title: issue.title,
  description: issue.description,
  category: issue.category,
  department: issue.department,
  location: issue.location,
  address: issue.address,
  images: issue.images,
  status: issue.status,
  assignedTo: issue.assignedTo
    ? { id: issue.assignedTo._id, name: issue.assignedTo.name, department: issue.assignedTo.department }
    : null,
  priority: issue.priority,
  slaDeadline: issue.slaDeadline,
  upvoteCount: issue.upvotes.length,
  upvotedByMe: userId ? issue.upvotes.some((id) => id.equals(userId)) : false,
  flaggedAsSpam: issue.flaggedAsSpam,
  flaggedByMe: userId ? issue.flaggedBy.some((id) => id.equals(userId)) : false,
  resolutionConfirmedByReporter: issue.resolutionConfirmedByReporter,
  reporter: issue.reportedBy,
  reportedAt: issue.createdAt,
  updatedAt: issue.updatedAt,
  statusHistory: issue.statusHistory.map((entry) => ({
    status: entry.status,
    changedBy: entry.changedBy,
    timestamp: entry.timestamp,
    note: entry.note,
  })),
});

module.exports = {
  createIssue,
  findNearbyDuplicates,
  getIssues,
  getIssueById,
  upvoteIssue,
  flagIssue,
  confirmResolution,
  getMyReports,
  DUPLICATE_RADIUS_METERS,
};