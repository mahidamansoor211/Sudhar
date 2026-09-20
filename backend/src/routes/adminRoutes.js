const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', adminController.analytics);
router.get('/issues', adminController.listIssues);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.toggleUser);
router.post('/issues/:id/clear-spam', adminController.clearSpam);

module.exports = router;