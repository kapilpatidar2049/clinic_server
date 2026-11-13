const LeaveRequest = require('../models/LeaveRequest');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Apply for Leave (Doctor or Staff)
// @route   POST /api/leaves
exports.applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide start date, end date, and reason.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await LeaveRequest.create({
      userId: req.user.id,
      userRole: req.user.role,
      leaveType: leaveType || 'Full-Day',
      startDate,
      endDate,
      totalDays,
      reason,
      status: 'Pending',
    });

    // Check if Doctor has existing booked appointments during this period
    let affectedAppointmentsCount = 0;
    if (req.user.role === 'Doctor') {
      const DoctorProfile = require('../models/DoctorProfile');
      const docProfile = await DoctorProfile.findOne({ userId: req.user.id });
      if (docProfile) {
        affectedAppointmentsCount = await Appointment.countDocuments({
          doctorId: docProfile._id,
          date: { $gte: startDate, $lte: endDate },
          status: { $in: ['Pending', 'Confirmed'] },
        });
      }
    }

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'APPLY_LEAVE',
      module: 'Leaves',
      details: `Applied for ${totalDays} day(s) ${leaveType} leave from ${startDate} to ${endDate}`,
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted for admin approval.',
      affectedAppointmentsCount,
      leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User's Leaves
// @route   GET /api/leaves/my
exports.getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Leaves (Admin)
// @route   GET /api/leaves
exports.getAllLeaves = async (req, res, next) => {
  try {
    const { status, role } = req.query;
    let query = {};
    if (status) query.status = status;
    if (role) query.userRole = role;

    const leaves = await LeaveRequest.find(query)
      .populate('userId', 'name email phone avatar role')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: leaves.length, leaves });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Approve or Reject Leave Request
// @route   PUT /api/leaves/:id/review
exports.reviewLeave = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body; // status: 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
    }

    const leave = await LeaveRequest.findById(req.params.id).populate('userId');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    leave.status = status;
    leave.adminRemarks = adminRemarks || '';
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();

    await leave.save();

    // If Doctor leave approved, flag or notify affected appointments
    let affectedNotice = '';
    if (leave.userRole === 'Doctor' && status === 'Approved') {
      const DoctorProfile = require('../models/DoctorProfile');
      const docProfile = await DoctorProfile.findOne({ userId: leave.userId._id });
      if (docProfile) {
        const affectedAppointments = await Appointment.find({
          doctorId: docProfile._id,
          date: { $gte: leave.startDate, $lte: leave.endDate },
          status: { $in: ['Pending', 'Confirmed'] },
        }).populate('patientId');

        for (const appt of affectedAppointments) {
          appt.status = 'Rescheduled';
          appt.notes = `Doctor is on approved leave from ${leave.startDate} to ${leave.endDate}. Please reschedule.`;
          await appt.save();

          await Notification.create({
            recipient: appt.patientId._id,
            title: 'Appointment Schedule Update',
            message: `Dr. ${leave.userId.name} will be unavailable on ${appt.date}. Please pick a new slot or contact clinic support.`,
            type: 'appointment',
          });
        }
        affectedNotice = `(${affectedAppointments.length} existing appointments were notified)`;
      }
    }

    // Notify employee
    await Notification.create({
      recipient: leave.userId._id,
      title: `Leave Request ${status}`,
      message: `Your leave request for ${leave.startDate} to ${leave.endDate} was ${status}. Admin notes: ${adminRemarks || 'None'}`,
      type: 'leave',
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: `LEAVE_${status.toUpperCase()}`,
      module: 'Leaves',
      details: `${status} leave for ${leave.userId.name} ${affectedNotice}`,
    });

    res.json({
      success: true,
      message: `Leave request has been ${status}. ${affectedNotice}`,
      leave,
    });
  } catch (error) {
    next(error);
  }
};
