const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { CATEGORIES } = require('../config/constants');
const { saveImages } = require('../services/uploadService');
const issueService = require('../services/issueService');

// POST /api/issues  (multipart/form-data)
// Fields: title, description, category, lng, lat, address, images[]
const createIssue = asyncHandler(async (req, res) => {
  const { title, description, category, lng, lat, address } = req.body;

  if (!title || !category) {
    throw new ApiError(400, 'Title and category are required');
  }
  if (!CATEGORIES.includes(category)) {
    throw new ApiError(400, `Category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (lng === undefined || lat === undefined || lng === '' || lat === '') {
    throw new ApiError(400, 'GPS coordinates are required (lng, lat)');
  }

  const images = await saveImages(req.files || []);

  const { issue, department } = await issueService.createIssue(
    {
      title,
      description: description || '',
      category,
      lng: Number(lng),
      lat: Number(lat),
      address: address || '',
      images,
    },
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: department
      ? `Issue reported and routed automatically to ${department}`
      : 'Issue reported. It will be triaged manually by an administrator.',
    department,
    issue: await issueService.getIssueById(issue._id, req.user._id),
  });
});

// GET /api/issues?lat=&lng=&category=&status=&department=&radiusMeters=
const listIssues = asyncHandler(async (req, res) => {
  const issues = await issueService.getIssues({
    category: req.query.category,
    status: req.query.status,
    department: req.query.department,
    lat: req.query.lat,
    lng: req.query.lng,
    radiusMeters: req.query.radiusMeters,
    userId: req.user?._id,
  });
  res.json({ success: true, count: issues.length, issues });
});

// GET /api/issues/duplicates?lat=&lng=&category=
// Used before submission to prompt upvoting instead of creating a duplicate.
const checkDuplicates = asyncHandler(async (req, res) => {
  const { lat, lng, category } = req.query;
  if (!lat || !lng || !category) {
    throw new ApiError(400, 'lat, lng and category are required');
  }
  const duplicates = await issueService.findNearbyDuplicates({
    lng: Number(lng),
    lat: Number(lat),
    category,
    userId: req.user?._id,
  });
  res.json({ success: true, count: duplicates.length, duplicates });
});

// GET /api/issues/:id
const getIssue = asyncHandler(async (req, res) => {
  const issue = await issueService.getIssueById(req.params.id, req.user?._id);
  res.json({ success: true, issue });
});

// POST /api/issues/:id/upvote
const upvote = asyncHandler(async (req, res) => {
  const result = await issueService.upvoteIssue(req.params.id, req.user._id);
  res.json({ success: true, ...result });
});

// POST /api/issues/:id/flag
const flag = asyncHandler(async (req, res) => {
  const result = await issueService.flagIssue(req.params.id, req.user._id);
  res.json({ success: true, ...result });
});

// POST /api/issues/:id/confirm-resolution  (multipart, optional verification photos)
const confirmResolution = asyncHandler(async (req, res) => {
  const confirmationImages = await saveImages(req.files || []);
  const result = await issueService.confirmResolution(req.params.id, req.user._id, {
    confirmationImages,
  });
  res.json({ success: true, ...result });
});

// GET /api/issues/mine
const myReports = asyncHandler(async (req, res) => {
  const reports = await issueService.getMyReports(req.user._id, {
    includeUpvoted: req.query.includeUpvoted !== 'false',
  });
  res.json({ success: true, count: reports.length, reports });
});

module.exports = {
  createIssue,
  listIssues,
  checkDuplicates,
  getIssue,
  upvote,
  flag,
  confirmResolution,
  myReports,
};