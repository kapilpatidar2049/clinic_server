const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const ClinicSettings = require('../models/ClinicSettings');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Create Digital Prescription
// @route   POST /api/prescriptions
exports.createPrescription = async (req, res, next) => {
  try {
    const {
      appointmentId,
      patientId,
      vitals,
      diagnosis,
      clinicalNotes,
      medicines,
      testsRecommended,
      dietaryAdvice,
      followUpDate,
    } = req.body;

    if (!patientId || !diagnosis || !medicines || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide patient, diagnosis, and at least one medicine.',
      });
    }

    // Identify doctor profile
    let doctorProfile = await DoctorProfile.findOne({ userId: req.user.id }).populate('userId');
    if (!doctorProfile && req.user.role === 'Admin') {
      // Admin creating on behalf of doctor
      doctorProfile = await DoctorProfile.findOne().populate('userId');
    }

    if (!doctorProfile) {
      return res.status(403).json({ success: false, message: 'Only authorized doctors can issue prescriptions.' });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const settings = await ClinicSettings.findOne() || {
      clinicName: 'My Clinic Healthcare',
      address: 'Medical Enclave, Delhi',
      phone: '+91 98765 43210',
    };

    const prescriptionId = `RX-${Date.now().toString().slice(-6)}`;

    // Prepare Letterhead Snapshot
    const letterheadSnapshot = {
      clinicName: doctorProfile.digitalLetterhead?.clinicName || settings.clinicName,
      clinicAddress: doctorProfile.digitalLetterhead?.address || settings.address,
      clinicContact: doctorProfile.digitalLetterhead?.contact || settings.phone,
      doctorName: `Dr. ${doctorProfile.userId.name}`,
      specialization: doctorProfile.specialization,
      qualifications: doctorProfile.qualifications?.join(', ') || 'MBBS, MD',
      regNo: doctorProfile.registrationNumber || 'MCI-REG-9874',
      headerText: doctorProfile.digitalLetterhead?.headerText || 'Consultant Physician',
      footerText: doctorProfile.digitalLetterhead?.footerText || 'Follow dosage strictly. In case of emergency visit nearest hospital.',
    };

    const prescription = await Prescription.create({
      prescriptionId,
      appointmentId: appointmentId || null,
      patientId,
      doctorId: doctorProfile._id,
      vitals: vitals || {},
      diagnosis,
      clinicalNotes: clinicalNotes || '',
      medicines,
      testsRecommended: testsRecommended || [],
      dietaryAdvice: dietaryAdvice || 'Healthy balanced diet and proper hydration.',
      followUpDate,
      letterheadSnapshot,
      status: 'Finalized',
    });

    // Mark appointment as Completed if linked
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { status: 'Completed' });
    }

    // Notify Patient
    await Notification.create({
      recipient: patientId,
      title: 'Digital Prescription Available',
      message: `Dr. ${doctorProfile.userId.name} has issued your digital prescription (${prescriptionId}). You can view and download it now.`,
      type: 'appointment',
      link: `/prescriptions/${prescription._id}`,
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'CREATE_PRESCRIPTION',
      module: 'Prescriptions',
      details: `Issued prescription ${prescriptionId} for patient ${patient.name}`,
    });

    res.status(201).json({
      success: true,
      message: 'Digital prescription created successfully!',
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Prescriptions
// @route   GET /api/prescriptions
exports.getPrescriptions = async (req, res, next) => {
  try {
    const { patientId } = req.query;
    let query = {};

    if (req.user.role === 'Patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'Doctor') {
      const docProfile = await DoctorProfile.findOne({ userId: req.user.id });
      if (docProfile) query.doctorId = docProfile._id;
    }

    if (patientId && req.user.role !== 'Patient') {
      query.patientId = patientId;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name email phone gender dob address')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('appointmentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Prescription by ID
// @route   GET /api/prescriptions/:id
exports.getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone gender dob address')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('appointmentId');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({ success: true, prescription });
  } catch (error) {
    next(error);
  }
};
