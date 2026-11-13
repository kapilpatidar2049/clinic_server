const EmergencyHomeVisit = require('../models/EmergencyHomeVisit');
const DoctorProfile = require('../models/DoctorProfile');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Request an Emergency Home Visit
// @route   POST /api/emergency/request
exports.requestHomeVisit = async (req, res, next) => {
  try {
    const { emergencyDetails, contactNumber, location, preferredDoctorId, priority } = req.body;

    if (!emergencyDetails || !contactNumber || !location || !location.address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide emergency details, contact number, and address.',
      });
    }

    const visitId = `EMG-${Date.now().toString().slice(-6)}`;

    const homeVisit = await EmergencyHomeVisit.create({
      visitId,
      patientId: req.user.id,
      doctorId: preferredDoctorId || null,
      patientName: req.user.name,
      contactNumber,
      emergencyDetails,
      location,
      priority: priority || 'Critical',
      status: 'Requested',
    });

    // Notify Doctors who are available for home visits
    const availableDocs = await DoctorProfile.find({ isAvailableForEmergencyVisit: true }).populate('userId');

    for (const doc of availableDocs) {
      if (doc.userId) {
        await Notification.create({
          recipient: doc.userId._id,
          title: '🚨 URGENT: Emergency Home Visit Request!',
          message: `${req.user.name} requires an immediate emergency home visit at ${location.address}. Reason: ${emergencyDetails}`,
          type: 'home_visit',
          link: `/doctor/home-visits/${homeVisit._id}`,
        });
      }
    }

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'EMERGENCY_HOME_VISIT_REQUEST',
      module: 'HomeVisits',
      details: `Emergency request ${visitId} triggered at ${location.address}`,
    });

    res.status(201).json({
      success: true,
      message: 'Emergency request sent to on-call doctors. A doctor will respond promptly.',
      homeVisit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Home Visit Requests (Filter by role)
// @route   GET /api/emergency
exports.getHomeVisits = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};

    if (req.user.role === 'Patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'Doctor') {
      const docProfile = await DoctorProfile.findOne({ userId: req.user.id });
      if (docProfile) {
        // Doctors see unassigned requests or requests assigned to them
        query.$or = [{ doctorId: null }, { doctorId: docProfile._id }];
      }
    }

    if (status) query.status = status;

    const visits = await EmergencyHomeVisit.find(query)
      .populate('patientId', 'name email phone avatar address')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: visits.length,
      visits,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Doctor Responds to Emergency Home Visit (Accept/Reject)
// @route   PUT /api/emergency/:id/respond
exports.respondToHomeVisit = async (req, res, next) => {
  try {
    const { action, doctorRemarks } = req.body; // action: 'accept' or 'reject'
    const visit = await EmergencyHomeVisit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Emergency visit request not found.' });
    }

    const docProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!docProfile) {
      return res.status(403).json({ success: false, message: 'Only registered doctors can respond.' });
    }

    if (action === 'accept') {
      visit.doctorId = docProfile._id;
      visit.status = 'Accepted';
      visit.acceptedAt = new Date();
      if (doctorRemarks) visit.doctorRemarks = doctorRemarks;

      await visit.save();

      // Notify Patient
      await Notification.create({
        recipient: visit.patientId,
        title: '🚑 Doctor Accepted Emergency Visit!',
        message: `Dr. ${req.user.name} has accepted your emergency request and is preparing to visit. Contact: ${req.user.phone}`,
        type: 'home_visit',
      });
    } else if (action === 'reject') {
      visit.status = 'Rejected';
      if (doctorRemarks) visit.doctorRemarks = doctorRemarks;
      await visit.save();

      // Notify Patient
      await Notification.create({
        recipient: visit.patientId,
        title: 'Emergency Request Update',
        message: `A doctor was unable to take your request. Other on-call doctors have been alerted.`,
        type: 'home_visit',
      });
    }

    res.json({
      success: true,
      message: `Emergency visit request ${action}ed successfully.`,
      visit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Status (e.g. In Progress, Completed, Cancelled)
// @route   PUT /api/emergency/:id/status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, doctorRemarks } = req.body;
    const visit = await EmergencyHomeVisit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found.' });
    }

    visit.status = status;
    if (doctorRemarks) visit.doctorRemarks = doctorRemarks;
    if (status === 'Completed') visit.completedAt = new Date();

    await visit.save();

    await Notification.create({
      recipient: visit.patientId,
      title: `Emergency Visit Status: ${status}`,
      message: `Your emergency home visit status has been updated to: ${status}`,
      type: 'home_visit',
    });

    res.json({ success: true, message: `Status updated to ${status}`, visit });
  } catch (error) {
    next(error);
  }
};
