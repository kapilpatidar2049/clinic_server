const express = require('express');
const router = express.Router();
const {
  requestHomeVisit,
  getHomeVisits,
  respondToHomeVisit,
  updateStatus,
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/request', protect, requestHomeVisit);
router.get('/', protect, getHomeVisits);
router.put('/:id/respond', protect, authorize('Doctor', 'Admin'), respondToHomeVisit);
router.put('/:id/status', protect, updateStatus);

module.exports = router;
