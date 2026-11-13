const express = require('express');
const router = express.Router();
const {
  generateSalaryStatement,
  getMySalaries,
  getAllSalaries,
  getSalaryById,
} = require('../controllers/salaryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/generate', protect, authorize('Admin'), generateSalaryStatement);
router.get('/my', protect, getMySalaries);
router.get('/', protect, authorize('Admin'), getAllSalaries);
router.get('/:id', protect, getSalaryById);

module.exports = router;
