const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTaskStatus } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('Admin'), createTask);
router.get('/', protect, getTasks);
router.put('/:id/status', protect, updateTaskStatus);

module.exports = router;
