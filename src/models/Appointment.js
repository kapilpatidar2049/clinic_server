const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
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
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    slotTime: {
      type: String, // e.g. "10:15 AM"
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No Show', 'Rescheduled'],
      default: 'Confirmed',
    },
    consultationFee: {
      type: Number,
      default: 500,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Online (Card/UPI)', 'Cash at Clinic', 'Insurance', 'Pending'],
      default: 'Cash at Clinic',
    },
    transactionId: {
      type: String,
      default: '',
    },
    symptoms: {
      type: String,
      default: '',
    },
    bookedBy: {
      type: String,
      enum: ['Patient', 'Receptionist', 'Admin'],
      default: 'Patient',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
