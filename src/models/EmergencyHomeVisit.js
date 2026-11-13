const mongoose = require('mongoose');

const emergencyHomeVisitSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
    },
    patientName: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    emergencyDetails: {
      type: String,
      required: true,
    },
    location: {
      address: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number },
      landmark: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['Requested', 'Notified', 'Accepted', 'Rejected', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Requested',
    },
    priority: {
      type: String,
      enum: ['Normal', 'High', 'Critical'],
      default: 'Critical',
    },
    doctorRemarks: {
      type: String,
      default: '',
    },
    homeVisitFee: {
      type: Number,
      default: 1500,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmergencyHomeVisit', emergencyHomeVisitSchema);
