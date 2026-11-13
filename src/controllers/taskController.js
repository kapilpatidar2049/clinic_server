const ClinicTask = require('../models/ClinicTask');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Create New Clinic Task (Admin)
// @route   POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, department, assignedTo, priority, deadline } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({ success: false, message: 'Please provide task title, description, and deadline.' });
    }

    const taskId = `TSK-${Date.now().toString().slice(-6)}`;

    const task = await ClinicTask.create({
      taskId,
      title,
      description,
      department: department || 'Reception',
      assignedTo: assignedTo || null,
      priority: priority || 'Medium',
      deadline,
      status: 'Assigned',
      createdBy: req.user.id,
    });

    // Notify assigned staff
    if (assignedTo) {
      await Notification.create({
        recipient: assignedTo,
        title: 'New Task Assigned',
        message: `You have been assigned task: "${title}". Due date: ${deadline}`,
        type: 'task',
        link: `/staff/tasks`,
      });
    }

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'CREATE_TASK',
      module: 'Tasks',
      details: `Created task ${taskId}: ${title} for department ${department}`,
    });

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully.',
      task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Tasks (Filter for Staff or Admin)
// @route   GET /api/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, department, assignedTo } = req.query;
    let query = {};

    if (req.user.role === 'Staff') {
      // Staff sees tasks directly assigned to them OR tasks open to their department/all
      query.$or = [{ assignedTo: req.user.id }, { assignedTo: null }];
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (department && department !== 'All') query.department = department;

    const tasks = await ClinicTask.find(query)
      .populate('assignedTo', 'name email phone avatar')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Task Status & Remarks (Staff or Admin)
// @route   PUT /api/tasks/:id/status
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status, staffRemarks, adminFeedback } = req.body;
    const task = await ClinicTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (status) {
      task.status = status;
      if (status === 'Completed') task.completedAt = new Date();
    }
    if (staffRemarks) task.staffRemarks = staffRemarks;
    if (adminFeedback) task.adminFeedback = adminFeedback;

    await task.save();

    res.json({
      success: true,
      message: `Task status updated to ${status}`,
      task,
    });
  } catch (error) {
    next(error);
  }
};
