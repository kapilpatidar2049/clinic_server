const express = require('express');
const router = express.Router();
const {
  getPublicClinicInfo,
  addGalleryItem,
  deleteGalleryItem,
  resetGalleryToDefault,
} = require('../controllers/clinicController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route for landing page & visitors
router.get('/public', getPublicClinicInfo);

// Admin-only management endpoints
router.post('/gallery', protect, authorize('Admin'), addGalleryItem);
router.delete('/gallery/:itemId', protect, authorize('Admin'), deleteGalleryItem);
router.post('/gallery/reset', protect, authorize('Admin'), resetGalleryToDefault);

module.exports = router;
