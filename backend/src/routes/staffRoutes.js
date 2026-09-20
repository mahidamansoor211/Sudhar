const router = require('express').Router();
const staffController = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('staff', 'admin'));

router.get('/issues', staffController.listQueue);
router.get('/stats', staffController.stats);
router.get('/members', staffController.members);
router.patch('/issues/:id/status', staffController.changeStatus);
router.post('/issues/:id/assign', staffController.assign);
router.patch('/issues/:id/priority', staffController.priority);
router.patch('/issues/:id/reroute', staffController.reroute);

module.exports = router;