const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// GET /api/notifications?limit=&unreadOnly=
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const notifications = await notificationService.getUserNotifications(req.user._id, {
      limit: req.query.limit,
      unreadOnly: req.query.unreadOnly === 'true',
    });
    res.json({ success: true, count: notifications.length, notifications });
  })
);

// GET /api/notifications/unread-count
router.get(
  '/unread-count',
  protect,
  asyncHandler(async (req, res) => {
    const count = await notificationService.unreadCount(req.user._id);
    res.json({ success: true, count });
  })
);

// POST /api/notifications/:id/read
router.post(
  '/:id/read',
  protect,
  asyncHandler(async (req, res) => {
    const result = await notificationService.markAsRead(req.params.id, req.user._id);
    res.json({ success: true, ...result });
  })
);

// POST /api/notifications/read-all
router.post(
  '/read-all',
  protect,
  asyncHandler(async (req, res) => {
    res.json(await notificationService.markAllAsRead(req.user._id));
  })
);

module.exports = router;