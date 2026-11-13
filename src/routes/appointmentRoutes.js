const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  bookAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/slots/:doctorId', getAvailableSlots);
router.post('/', protect, bookAppointment);
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/status', protect, updateAppointmentStatus);
router.put('/:id/reschedule', protect, rescheduleAppointment);

module.exports = router;
