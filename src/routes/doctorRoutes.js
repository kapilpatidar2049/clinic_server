const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  updateTimings,
  updateLetterhead,
  getDoctorDashboard,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getDoctors);
router.get('/dashboard/metrics', protect, authorize('Doctor', 'Admin'), getDoctorDashboard);
router.get('/:id', getDoctorById);
router.put('/timings', protect, authorize('Doctor', 'Admin'), updateTimings);
router.put('/letterhead', protect, authorize('Doctor', 'Admin'), updateLetterhead);

module.exports = router;
