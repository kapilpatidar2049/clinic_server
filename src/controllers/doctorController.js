const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const EmergencyHomeVisit = require('../models/EmergencyHomeVisit');
const User = require('../models/User');

// @desc    Get All Active Doctors
// @route   GET /api/doctors
exports.getDoctors = async (req, res, next) => {
  try {
    const { specialization, search } = req.query;
    let query = { isActive: true };

    if (specialization && specialization !== 'All') {
      query.specialization = specialization;
    }

    let doctors = await DoctorProfile.find(query).populate('userId', 'name email phone avatar gender');

    // Filter out if user account is deactivated
    doctors = doctors.filter((doc) => doc.userId && doc.userId.name);

    if (search) {
      const term = search.toLowerCase();
      doctors = doctors.filter(
        (doc) =>
          doc.userId.name.toLowerCase().includes(term) ||
          doc.specialization.toLowerCase().includes(term) ||
          doc.qualifications.some((q) => q.toLowerCase().includes(term))
      );
    }

    res.json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Doctor by ID
// @route   GET /api/doctors/:id
exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id).populate('userId', 'name email phone avatar gender address');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Doctor Schedule, Timings & Reporting Time
// @route   PUT /api/doctors/timings
exports.updateTimings = async (req, res, next) => {
  try {
    const { clinicTimings, reportingTime, slotDurationMinutes } = req.body;
    let profile = await DoctorProfile.findOne({ userId: req.user.id });

    if (!profile && req.user.role === 'Admin') {
      profile = await DoctorProfile.findById(req.body.doctorId);
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    if (clinicTimings) profile.clinicTimings = clinicTimings;
    if (reportingTime) profile.reportingTime = reportingTime;
    if (slotDurationMinutes) profile.slotDurationMinutes = slotDurationMinutes;

    await profile.save();

    res.json({
      success: true,
      message: 'Clinic schedule and timings updated successfully.',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Doctor Letterhead
// @route   PUT /api/doctors/letterhead
exports.updateLetterhead = async (req, res, next) => {
  try {
    const { digitalLetterhead } = req.body;
    let profile = await DoctorProfile.findOne({ userId: req.user.id });

    if (!profile && req.user.role === 'Admin') {
      profile = await DoctorProfile.findById(req.body.doctorId);
    }

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    profile.digitalLetterhead = {
      ...profile.digitalLetterhead.toObject(),
      ...digitalLetterhead,
    };

    await profile.save();

    res.json({
      success: true,
      message: 'Digital letterhead template updated.',
      digitalLetterhead: profile.digitalLetterhead,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor Dashboard Metrics
// @route   GET /api/doctors/dashboard/metrics
exports.getDoctorDashboard = async (req, res, next) => {
  try {
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's appointments count
    const todayAppointments = await Appointment.find({
      doctorId: doctorProfile._id,
      date: todayStr,
    }).populate('patientId', 'name phone gender dob avatar');

    const totalToday = todayAppointments.length;
    const completedToday = todayAppointments.filter((a) => a.status === 'Completed').length;
    const pendingToday = todayAppointments.filter((a) => ['Pending', 'Confirmed'].includes(a.status)).length;

    // Upcoming appointments count
    const upcomingCount = await Appointment.countDocuments({
      doctorId: doctorProfile._id,
      date: { $gt: todayStr },
      status: { $in: ['Pending', 'Confirmed'] },
    });

    // Emergency home visits
    const pendingHomeVisits = await EmergencyHomeVisit.find({
      $or: [{ doctorId: null }, { doctorId: doctorProfile._id }],
      status: { $in: ['Requested', 'Notified', 'Accepted', 'In Progress'] },
    }).populate('patientId', 'name phone');

    res.json({
      success: true,
      doctor: {
        id: doctorProfile._id,
        name: req.user.name,
        specialization: doctorProfile.specialization,
        reportingTime: doctorProfile.reportingTime,
        slotDuration: doctorProfile.slotDurationMinutes,
      },
      stats: {
        totalToday,
        completedToday,
        pendingToday,
        upcomingCount,
        pendingHomeVisitsCount: pendingHomeVisits.length,
      },
      todayQueue: todayAppointments.sort((a, b) => a.tokenNumber - b.tokenNumber),
      emergencyRequests: pendingHomeVisits,
    });
  } catch (error) {
    next(error);
  }
};
