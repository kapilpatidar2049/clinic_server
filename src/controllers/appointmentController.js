const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const LeaveRequest = require('../models/LeaveRequest');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// Helper to convert time "10:00 AM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper to convert minutes from midnight to "10:00 AM"
const minutesToTime = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${paddedMinutes} ${meridiem}`;
};

// @desc    Get Available Slots for a Doctor on a Date
// @route   GET /api/appointments/slots/:doctorId?date=YYYY-MM-DD
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Please provide a date (YYYY-MM-DD).' });
    }

    const doctor = await DoctorProfile.findById(doctorId).populate('userId', 'name email phone avatar');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // 1. Check if doctor is on approved leave on this date
    const onLeave = await LeaveRequest.findOne({
      userId: doctor.userId._id,
      status: 'Approved',
      startDate: { $lte: date },
      endDate: { $gte: date },
    });

    if (onLeave) {
      return res.json({
        success: true,
        isDoctorAvailable: false,
        message: `Doctor is on approved leave (${onLeave.leaveType}) on this date.`,
        slots: [],
      });
    }

    // 2. Check day of week schedule
    const appointmentDate = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDay = dayNames[appointmentDate.getDay()];

    const daySchedule = doctor.clinicTimings.find((t) => t.day === selectedDay && t.isWorking);
    if (!daySchedule) {
      return res.json({
        success: true,
        isDoctorAvailable: false,
        message: `Doctor does not consult on ${selectedDay}s.`,
        slots: [],
      });
    }

    // 3. Generate slots based on slotDurationMinutes
    const startMins = timeToMinutes(daySchedule.startTime);
    const endMins = timeToMinutes(daySchedule.endTime);
    const duration = doctor.slotDurationMinutes || 15;

    // 4. Fetch booked appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ['Pending', 'Confirmed', 'Completed'] },
    }).select('slotTime tokenNumber status');

    const bookedSlotTimes = new Set(bookedAppointments.map((a) => a.slotTime));

    const slots = [];
    let token = 1;
    for (let current = startMins; current + duration <= endMins; current += duration) {
      const slotTimeStr = minutesToTime(current);
      const isBooked = bookedSlotTimes.has(slotTimeStr);

      slots.push({
        tokenNumber: token,
        slotTime: slotTimeStr,
        isAvailable: !isBooked,
      });
      token++;
    }

    res.json({
      success: true,
      isDoctorAvailable: true,
      doctor: {
        id: doctor._id,
        name: doctor.userId.name,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee,
        slotDuration: duration,
        schedule: `${daySchedule.startTime} to ${daySchedule.endTime}`,
      },
      date,
      totalSlots: slots.length,
      availableSlotsCount: slots.filter((s) => s.isAvailable).length,
      slots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book an Appointment
// @route   POST /api/appointments
exports.bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, slotTime, tokenNumber, symptoms, paymentMethod, bookedForPatientId } = req.body;

    const patientId = req.user.role === 'Patient' ? req.user.id : bookedForPatientId || req.user.id;

    if (!doctorId || !date || !slotTime) {
      return res.status(400).json({ success: false, message: 'Please provide doctorId, date, and slotTime.' });
    }

    const doctor = await DoctorProfile.findById(doctorId).populate('userId', 'name');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Double-booking check
    const existing = await Appointment.findOne({
      doctorId,
      date,
      slotTime,
      status: { $in: ['Pending', 'Confirmed', 'Completed'] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This slot has already been booked. Please choose another slot.',
      });
    }

    // Calculate token number if not sent
    let token = tokenNumber;
    if (!token) {
      const countToday = await Appointment.countDocuments({ doctorId, date });
      token = countToday + 1;
    }

    const appointmentId = `APT-${Date.now().toString().slice(-6)}`;

    const newAppointment = await Appointment.create({
      appointmentId,
      patientId,
      doctorId,
      date,
      slotTime,
      tokenNumber: token,
      status: 'Confirmed',
      consultationFee: doctor.consultationFee,
      paymentStatus: paymentMethod === 'Online (Card/UPI)' ? 'Paid' : 'Pending',
      paymentMethod: paymentMethod || 'Cash at Clinic',
      symptoms: symptoms || 'General Checkup',
      bookedBy: req.user.role,
    });

    // Populate patient and doctor
    await newAppointment.populate('patientId', 'name email phone');
    await newAppointment.populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email phone' },
    });

    // Create In-App Notification
    await Notification.create({
      recipient: patientId,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctor.userId.name} is confirmed for ${date} at ${slotTime}. Token #${token}.`,
      type: 'appointment',
      link: `/appointments/${newAppointment._id}`,
    });

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'BOOK_APPOINTMENT',
      module: 'Appointments',
      details: `Booked appointment ${appointmentId} with Dr. ${doctor.userId.name} for ${date} ${slotTime}`,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment: newAppointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get User Appointments (Patient or Doctor or Staff/Admin)
// @route   GET /api/appointments
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, date, doctorId, patientId } = req.query;
    let query = {};

    if (req.user.role === 'Patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'Doctor') {
      const docProfile = await DoctorProfile.findOne({ userId: req.user.id });
      if (docProfile) {
        query.doctorId = docProfile._id;
      }
    }

    if (status) query.status = status;
    if (date) query.date = date;
    if (doctorId && req.user.role !== 'Doctor') query.doctorId = doctorId;
    if (patientId && req.user.role !== 'Patient') query.patientId = patientId;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone avatar gender dob address')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone avatar' },
      })
      .sort({ date: -1, tokenNumber: 1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Appointment
// @route   GET /api/appointments/:id
exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone avatar gender dob address')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone avatar' },
      });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Appointment Status
// @route   PUT /api/appointments/:id/status
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason, paymentStatus } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (status) appointment.status = status;
    if (cancellationReason) appointment.cancellationReason = cancellationReason;
    if (paymentStatus) appointment.paymentStatus = paymentStatus;

    await appointment.save();

    // Notify patient
    await Notification.create({
      recipient: appointment.patientId,
      title: `Appointment Status: ${status}`,
      message: `Your appointment on ${appointment.date} at ${appointment.slotTime} has been marked as ${status}.`,
      type: 'appointment',
    });

    res.json({
      success: true,
      message: `Appointment updated to ${status}`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule Appointment
// @route   PUT /api/appointments/:id/reschedule
exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDate, newSlotTime, newDoctorId } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const docId = newDoctorId || appointment.doctorId;

    // Check slot availability
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: docId,
      date: newDate,
      slotTime: newSlotTime,
      status: { $in: ['Pending', 'Confirmed', 'Completed'] },
    });

    if (conflict) {
      return res.status(409).json({ success: false, message: 'Selected slot is already occupied.' });
    }

    appointment.date = newDate;
    appointment.slotTime = newSlotTime;
    if (newDoctorId) appointment.doctorId = newDoctorId;
    appointment.status = 'Rescheduled';

    await appointment.save();

    await Notification.create({
      recipient: appointment.patientId,
      title: 'Appointment Rescheduled',
      message: `Your appointment has been rescheduled to ${newDate} at ${newSlotTime}.`,
      type: 'appointment',
    });

    res.json({
      success: true,
      message: 'Appointment successfully rescheduled.',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};
