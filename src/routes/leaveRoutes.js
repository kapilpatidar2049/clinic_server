const express = require('express');
const router = express.Router();
const { applyLeave, getMyLeaves, getAllLeaves, reviewLeave } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.get('/', protect, authorize('Admin'), getAllLeaves);
router.put('/:id/review', protect, authorize('Admin'), reviewLeave);

module.exports = router;
