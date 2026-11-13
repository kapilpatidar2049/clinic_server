const SalaryStatement = require('../models/SalaryStatement');
const StaffProfile = require('../models/StaffProfile');
const StaffAttendance = require('../models/StaffAttendance');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Generate / Create Monthly Salary Statement (Admin)
// @route   POST /api/salary/generate
exports.generateSalaryStatement = async (req, res, next) => {
  try {
    const { staffId, month, year, allowances, deductions, customBasicSalary, status } = req.body;

    if (!staffId || !month || !year) {
      return res.status(400).json({ success: false, message: 'Please provide staffId, month, and year.' });
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser) {
      return res.status(404).json({ success: false, message: 'Staff user not found.' });
    }

    const staffProfile = await StaffProfile.findOne({ userId: staffId });
    const basic = customBasicSalary || staffProfile?.salaryConfig?.basicSalary || 25000;

    // Check attendance for this month
    const monthPadded = month.toString().padStart(2, '0');
    const attendanceRecords = await StaffAttendance.find({
      staffId,
      date: { $regex: `^${year}-${monthPadded}` },
    });

    const presentDays = attendanceRecords.filter((a) => a.status === 'Present').length;
    const halfDays = attendanceRecords.filter((a) => a.status === 'Half-day').length;
    const effectiveDays = presentDays + halfDays * 0.5;

    // Calculate deductions if unexcused absences
    const totalWorkingDaysInMonth = 26;
    let attendanceDeduction = 0;
    if (attendanceRecords.length > 0 && effectiveDays < totalWorkingDaysInMonth) {
      const perDayWage = basic / totalWorkingDaysInMonth;
      const unpaidDays = Math.max(0, totalWorkingDaysInMonth - effectiveDays);
      attendanceDeduction = Math.round(perDayWage * Math.min(unpaidDays, 4)); // cap demo deduction
    }

    const defaultAllowances = allowances || [
      { title: 'HRA (House Rent Allowance)', amount: Math.round(basic * 0.2) },
      { title: 'Medical Allowance', amount: 1500 },
      { title: 'Conveyance Allowance', amount: 1500 },
    ];

    const defaultDeductions = deductions || [
      { title: 'Provident Fund (PF)', amount: Math.round(basic * 0.12) },
      { title: 'Professional Tax', amount: 200 },
    ];

    const totalAllowances = defaultAllowances.reduce((sum, item) => sum + item.amount, 0);
    const totalDeductions = defaultDeductions.reduce((sum, item) => sum + item.amount, 0);
    const netSalary = Math.round(basic + totalAllowances - totalDeductions - attendanceDeduction);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = `${monthNames[month - 1]} ${year}`;
    const statementId = `SAL-${year}${monthPadded}-${Date.now().toString().slice(-4)}`;

    // Upsert salary statement
    let statement = await SalaryStatement.findOne({ staffId, month, year });

    if (statement) {
      statement.basicSalary = basic;
      statement.allowances = defaultAllowances;
      statement.totalAllowances = totalAllowances;
      statement.deductions = defaultDeductions;
      statement.totalDeductions = totalDeductions;
      statement.attendanceDeduction = attendanceDeduction;
      statement.presentDays = effectiveDays;
      statement.netSalary = netSalary;
      statement.status = status || 'Published';
      await statement.save();
    } else {
      statement = await SalaryStatement.create({
        statementId,
        staffId,
        month,
        year,
        monthName,
        basicSalary: basic,
        allowances: defaultAllowances,
        totalAllowances,
        deductions: defaultDeductions,
        totalDeductions,
        attendanceDeduction,
        presentDays: effectiveDays || 26,
        netSalary,
        status: status || 'Published',
      });
    }

    // Notify Staff member
    await Notification.create({
      recipient: staffId,
      title: 'Salary Slip Available',
      message: `Your monthly salary statement for ${monthName} has been published. Net Payable: ₹${netSalary.toLocaleString('en-IN')}`,
      type: 'salary',
      link: `/staff/salary/${statement._id}`,
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'GENERATE_SALARY',
      module: 'Salary',
      details: `Generated salary statement ${statementId} for ${staffUser.name} - ₹${netSalary}`,
    });

    res.status(201).json({
      success: true,
      message: 'Salary statement generated & published successfully!',
      statement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get My Salary Statements (Staff)
// @route   GET /api/salary/my
exports.getMySalaries = async (req, res, next) => {
  try {
    const statements = await SalaryStatement.find({
      staffId: req.user.id,
      status: { $in: ['Published', 'Paid'] },
    }).sort({ year: -1, month: -1 });

    res.json({ success: true, count: statements.length, statements });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Salary Statements (Admin)
// @route   GET /api/salary
exports.getAllSalaries = async (req, res, next) => {
  try {
    const { month, year, staffId } = req.query;
    let query = {};
    if (month) query.month = parseInt(month, 10);
    if (year) query.year = parseInt(year, 10);
    if (staffId) query.staffId = staffId;

    const statements = await SalaryStatement.find(query)
      .populate('staffId', 'name email phone avatar')
      .sort({ year: -1, month: -1 });

    const totalPayout = statements.reduce((sum, s) => sum + s.netSalary, 0);

    res.json({
      success: true,
      count: statements.length,
      totalPayout,
      statements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Salary Statement Details
// @route   GET /api/salary/:id
exports.getSalaryById = async (req, res, next) => {
  try {
    const statement = await SalaryStatement.findById(req.params.id).populate('staffId', 'name email phone address');
    if (!statement) {
      return res.status(404).json({ success: false, message: 'Salary statement not found' });
    }
    res.json({ success: true, statement });
  } catch (error) {
    next(error);
  }
};
