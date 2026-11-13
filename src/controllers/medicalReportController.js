const MedicalReport = require('../models/MedicalReport');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Upload Medical Report
// @route   POST /api/reports/upload
exports.uploadReport = async (req, res, next) => {
  try {
    const { patientId, title, category, appointmentId, notes } = req.body;

    const targetPatientId = req.user.role === 'Patient' ? req.user.id : patientId;
    if (!targetPatientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }

    if (!title) {
      return res.status(400).json({ success: false, message: 'Report title is required.' });
    }

    let fileUrl = '';
    let fileType = 'application/pdf';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileType = req.file.mimetype;
    } else if (req.body.fileUrl) {
      fileUrl = req.body.fileUrl;
      fileType = req.body.fileType || 'application/pdf';
    } else {
      // Demo fallback mock report if no file uploaded
      fileUrl = `/uploads/sample-report-${Date.now()}.pdf`;
    }

    const reportId = `REP-${Date.now().toString().slice(-6)}`;

    const report = await MedicalReport.create({
      reportId,
      patientId: targetPatientId,
      appointmentId: appointmentId || null,
      title,
      category: category || 'Blood Test',
      fileUrl,
      fileType,
      uploadedBy: req.user.id,
      uploaderRole: req.user.role,
      notes: notes || '',
    });

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'UPLOAD_REPORT',
      module: 'Staff',
      details: `Report ${reportId} (${title}) uploaded for patient ID ${targetPatientId}`,
    });

    res.status(201).json({
      success: true,
      message: 'Medical report uploaded successfully.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Patient Medical Reports
// @route   GET /api/reports
exports.getReports = async (req, res, next) => {
  try {
    const { patientId, category } = req.query;
    let query = {};

    if (req.user.role === 'Patient') {
      query.patientId = req.user.id;
    } else if (patientId) {
      query.patientId = patientId;
    }

    if (category) query.category = category;

    const reports = await MedicalReport.find(query)
      .populate('patientId', 'name email phone')
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Medical Report
// @route   DELETE /api/reports/:id
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await MedicalReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Only uploader, Admin, or Patient owner can delete
    if (
      req.user.role !== 'Admin' &&
      report.uploadedBy.toString() !== req.user.id &&
      report.patientId.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this report.' });
    }

    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
