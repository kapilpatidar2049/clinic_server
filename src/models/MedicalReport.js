const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Blood Test', 'Pathology', 'X-Ray / Radiology', 'Ultrasound', 'Prescription', 'Discharge Summary', 'Other'],
      default: 'Blood Test',
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: 'application/pdf',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploaderRole: {
      type: String,
      enum: ['Patient', 'Doctor', 'Staff', 'Admin'],
      default: 'Patient',
    },
    reportDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
