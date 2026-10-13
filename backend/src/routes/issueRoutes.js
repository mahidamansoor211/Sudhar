const router = require('express').Router();
const issueController = require('../controllers/issueController');
const { protect } = require('../middleware/auth');
const { upload } = require('../services/uploadService');

// createIssue requires auth + image upload. Times hard ~ 5 images x 8MB.
router.post('/', protect, upload.array('images', 5), issueController.createIssue);

router.get('/', issueController.listIssues);
router.get('/duplicates', issueController.checkDuplicates);
router.get('/mine', protect, issueController.myReports);
router.get('/:id', issueController.getIssue);
router.post('/:id/upvote', protect, issueController.upvote);
router.post('/:id/flag', protect, issueController.flag);
router.post('/:id/confirm-resolution', protect, upload.array('images', 5), issueController.confirmResolution);
router.post('/:id/dispute', protect, issueController.disputeResolution);
router.get('/:id/comments', issueController.listComments);
router.post('/:id/comments', protect, issueController.addComment);

module.exports = router;