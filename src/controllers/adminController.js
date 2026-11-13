const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const StaffProfile = require('../models/StaffProfile');
const Specialization = require('../models/Specialization');
const Appointment = require('../models/Appointment');
const EmergencyHomeVisit = require('../models/EmergencyHomeVisit');
const StaffAttendance = require('../models/StaffAttendance');
const LeaveRequest = require('../models/LeaveRequest');
const ClinicTask = require('../models/ClinicTask');
const SalaryStatement = require('../models/SalaryStatement');
const ClinicSettings = require('../models/ClinicSettings');
const AuditLog = require('../models/AuditLog');

// @desc    Admin Master Dashboard Stats
// @route   GET /api/admin/dashboard
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalPatients,
      totalDoctors,
      totalStaff,
      todayAppointments,
      pendingHomeVisits,
      todayAttendance,
      pendingLeaves,
      pendingTasks,
      settings,
    ] = await Promise.all([
      User.countDocuments({ role: 'Patient' }),
      DoctorProfile.countDocuments({ isActive: true }),
      StaffProfile.countDocuments({ isActive: true }),
      Appointment.find({ date: todayStr }),
      EmergencyHomeVisit.countDocuments({ status: { $in: ['Requested', 'Notified', 'In Progress'] } }),
      StaffAttendance.find({ date: todayStr }),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      ClinicTask.countDocuments({ status: { $in: ['Assigned', 'In Progress'] } }),
      ClinicSettings.findOne(),
    ]);

    const todayAppointmentsStats = {
      total: todayAppointments.length,
      confirmed: todayAppointments.filter((a) => a.status === 'Confirmed').length,
      completed: todayAppointments.filter((a) => a.status === 'Completed').length,
      cancelled: todayAppointments.filter((a) => a.status === 'Cancelled').length,
      noShow: todayAppointments.filter((a) => a.status === 'No Show').length,
    };

    const attendanceStats = {
      present: todayAttendance.filter((a) => a.status === 'Present').length,
      halfDay: todayAttendance.filter((a) => a.status === 'Half-day').length,
      onLeave: todayAttendance.filter((a) => a.status === 'Leave').length,
    };

    // Calculate revenue estimate for current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthSalaries = await SalaryStatement.find({ month: currentMonth, year: currentYear });
    const totalPayroll = monthSalaries.reduce((acc, curr) => acc + curr.netSalary, 0);

    // Recent activity audit logs
    const recentLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalStaff,
        todayAppointments: todayAppointmentsStats,
        pendingHomeVisits,
        todayAttendance: attendanceStats,
        pendingLeaves,
        pendingTasks,
        totalPayroll,
      },
      clinicSettings: settings,
      recentLogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add New Doctor (Creates User + DoctorProfile)
// @route   POST /api/admin/doctors
exports.createDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      gender,
      specialization,
      qualifications,
      experienceYears,
      registrationNumber,
      consultationFee,
      slotDurationMinutes,
      reportingTime,
      clinicTimings,
    } = req.body;

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Doctor with this email or phone already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: password || 'Doctor@123',
      role: 'Doctor',
      gender: gender || 'Other',
    });

    const defaultTimings = clinicTimings || [
      { day: 'Monday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
      { day: 'Tuesday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
      { day: 'Wednesday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
      { day: 'Thursday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
      { day: 'Friday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
      { day: 'Saturday', startTime: '10:00 AM', endTime: '01:00 PM', isWorking: true },
    ];

    const profile = await DoctorProfile.create({
      userId: user._id,
      specialization: specialization || 'General Medicine',
      qualifications: qualifications || ['MBBS', 'MD'],
      experienceYears: experienceYears || 5,
      registrationNumber: registrationNumber || `REG-${Date.now().toString().slice(-5)}`,
      consultationFee: consultationFee || 500,
      slotDurationMinutes: slotDurationMinutes || 15,
      reportingTime: reportingTime || '09:30 AM',
      clinicTimings: defaultTimings,
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: 'Admin',
      action: 'ADD_DOCTOR',
      module: 'Doctors',
      details: `Added new doctor Dr. ${name} (${specialization})`,
    });

    res.status(201).json({
      success: true,
      message: 'Doctor added successfully with assigned schedule.',
      doctor: { user, profile },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add New Staff Member
// @route   POST /api/admin/staff
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, phone, password, gender, department, designation, basicSalary } = req.body;

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email or phone already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password: password || 'Staff@123',
      role: 'Staff',
      gender: gender || 'Other',
    });

    const staffProfile = await StaffProfile.create({
      userId: user._id,
      department: department || 'Reception',
      designation: designation || 'Staff Member',
      salaryConfig: {
        basicSalary: basicSalary || 25000,
        allowances: 3000,
        deductions: 1000,
      },
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: 'Admin',
      action: 'ADD_STAFF',
      module: 'Staff',
      details: `Added new staff ${name} in ${department} department`,
    });

    res.status(201).json({
      success: true,
      message: 'Staff member added successfully.',
      staff: { user, staffProfile },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Staff Members
// @route   GET /api/admin/staff
exports.getAllStaff = async (req, res, next) => {
  try {
    const staffMembers = await StaffProfile.find().populate('userId', 'name email phone avatar gender isActive');
    res.json({ success: true, count: staffMembers.length, staff: staffMembers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Staff Member by ID
// @route   GET /api/admin/staff/:id
exports.getStaffById = async (req, res, next) => {
  try {
    const staff = await StaffProfile.findById(req.params.id).populate('userId', 'name email phone avatar gender isActive');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }
    res.json({ success: true, staff });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Staff Member Details
// @route   PUT /api/admin/staff/:id
exports.updateStaff = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      gender,
      department,
      designation,
      basicSalary,
      allowances,
      deductions,
      shiftStart,
      shiftEnd,
      reportingManager,
      isActive,
    } = req.body;

    const staff = await StaffProfile.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Update associated User details
    if (name || phone || gender !== undefined || isActive !== undefined) {
      await User.findByIdAndUpdate(staff.userId, {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(gender && { gender }),
        ...(isActive !== undefined && { isActive }),
      });
    }

    // Update StaffProfile fields
    if (department) staff.department = department;
    if (designation) staff.designation = designation;
    if (reportingManager) staff.reportingManager = reportingManager;
    if (shiftStart || shiftEnd) {
      if (!staff.shiftTimings) staff.shiftTimings = {};
      if (shiftStart) staff.shiftTimings.start = shiftStart;
      if (shiftEnd) staff.shiftTimings.end = shiftEnd;
    }
    if (basicSalary !== undefined || allowances !== undefined || deductions !== undefined) {
      if (!staff.salaryConfig) staff.salaryConfig = {};
      if (basicSalary !== undefined) staff.salaryConfig.basicSalary = Number(basicSalary);
      if (allowances !== undefined) staff.salaryConfig.allowances = Number(allowances);
      if (deductions !== undefined) staff.salaryConfig.deductions = Number(deductions);
    }
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    const updatedStaff = await StaffProfile.findById(req.params.id).populate('userId', 'name email phone avatar gender isActive');

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: 'Admin',
      action: 'UPDATE_STAFF',
      module: 'Staff',
      details: `Updated staff profile for ${updatedStaff.userId?.name || staff._id}`,
    });

    res.json({
      success: true,
      message: 'Staff profile updated successfully.',
      staff: updatedStaff,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage Specializations
// @route   GET /api/admin/specializations
exports.getSpecializations = async (req, res, next) => {
  try {
    const specs = await Specialization.find();
    res.json({ success: true, count: specs.length, specializations: specs });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Specialization
// @route   POST /api/admin/specializations
exports.createSpecialization = async (req, res, next) => {
  try {
    const { name, description, iconName } = req.body;
    const spec = await Specialization.create({ name, description, iconName });
    res.status(201).json({ success: true, specialization: spec });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Clinic Settings
// @route   PUT /api/admin/settings
exports.updateClinicSettings = async (req, res, next) => {
  try {
    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = new ClinicSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    res.json({
      success: true,
      message: 'Clinic settings updated successfully.',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Patients Directory (Admin)
// @route   GET /api/admin/patients
exports.getPatients = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = { role: 'Patient' };

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const patients = await User.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: patients.length, patients });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Audit Logs
// @route   GET /api/admin/logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};
