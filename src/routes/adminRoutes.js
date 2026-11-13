const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  createDoctor,
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  getSpecializations,
  createSpecialization,
  updateClinicSettings,
  getPatients,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('Admin'));

router.get('/dashboard', getAdminDashboard);
router.post('/doctors', createDoctor);
router.post('/staff', createStaff);
router.get('/staff', getAllStaff);
router.get('/staff/:id', getStaffById);
router.put('/staff/:id', updateStaff);
router.get('/specializations', getSpecializations);
router.post('/specializations', createSpecialization);
router.put('/settings', updateClinicSettings);
router.get('/patients', getPatients);
router.get('/logs', getAuditLogs);

module.exports = router;
