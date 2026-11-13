const StaffAttendance = require('../models/StaffAttendance');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Staff Check-In (Daily)
// @route   POST /api/attendance/check-in
exports.checkIn = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const staffId = req.user.id;

    let attendance = await StaffAttendance.findOne({ staffId, date: today });

    if (attendance) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked in today.',
        attendance,
      });
    }

    const now = new Date();
    // Check if late (e.g. after 09:30 AM)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 30);

    attendance = await StaffAttendance.create({
      staffId,
      date: today,
      checkIn: now,
      status: 'Present',
      isLate,
      notes: req.body.notes || (isLate ? 'Late arrival recorded' : 'On time'),
    });

    res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully!',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Staff Check-Out (Daily)
// @route   POST /api/attendance/check-out
exports.checkOut = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const staffId = req.user.id;

    const attendance = await StaffAttendance.findOne({ staffId, date: today });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today. Please check in first.',
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'You have already checked out today.',
        attendance,
      });
    }

    const now = new Date();
    attendance.checkOut = now;

    // Calculate total hours
    const diffMs = now.getTime() - new Date(attendance.checkIn).getTime();
    const diffHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    attendance.totalHours = diffHours;

    if (diffHours < 4) {
      attendance.status = 'Half-day';
    }

    await attendance.save();

    res.json({
      success: true,
      message: `Checked out successfully! Total working hours: ${diffHours} hrs`,
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User's Attendance History
// @route   GET /api/attendance/my
exports.getMyAttendance = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    let query = { staffId: req.user.id };

    if (month && year) {
      const monthPadded = month.toString().padStart(2, '0');
      query.date = { $regex: `^${year}-${monthPadded}` };
    }

    const records = await StaffAttendance.find(query).sort({ date: -1 });

    const totalDaysPresent = records.filter((r) => r.status === 'Present').length;
    const totalHalfDays = records.filter((r) => r.status === 'Half-day').length;
    const totalHoursWorked = records.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

    res.json({
      success: true,
      summary: {
        totalRecords: records.length,
        presentDays: totalDaysPresent,
        halfDays: totalHalfDays,
        totalHours: parseFloat(totalHoursWorked.toFixed(2)),
      },
      records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Staff Attendance (Admin / Manager)
// @route   GET /api/attendance
exports.getAllAttendance = async (req, res, next) => {
  try {
    const { date, staffId, status } = req.query;
    let query = {};

    if (date) query.date = date;
    if (staffId) query.staffId = staffId;
    if (status) query.status = status;

    const records = await StaffAttendance.find(query)
      .populate('staffId', 'name email phone avatar')
      .populate('correctedBy', 'name')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Correction of Attendance
// @route   PUT /api/attendance/:id
exports.updateAttendance = async (req, res, next) => {
  try {
    const { status, totalHours, notes } = req.body;
    const record = await StaffAttendance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (status) record.status = status;
    if (totalHours !== undefined) record.totalHours = totalHours;
    if (notes) record.notes = notes;
    record.correctedBy = req.user.id;

    await record.save();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'CORRECT_ATTENDANCE',
      module: 'Attendance',
      details: `Updated attendance record for date ${record.date} to status ${status}`,
    });

    res.json({ success: true, message: 'Attendance updated with audit trail.', record });
  } catch (error) {
    next(error);
  }
};
