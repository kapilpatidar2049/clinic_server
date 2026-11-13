const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualifications: {
      type: [String],
      default: ['MBBS'],
    },
    experienceYears: {
      type: Number,
      default: 5,
    },
    registrationNumber: {
      type: String,
      default: 'MCI-123456',
    },
    consultationFee: {
      type: Number,
      default: 500,
    },
    slotDurationMinutes: {
      type: Number,
      default: 15, // Configurable per doctor: 10, 15, 20 mins
    },
    reportingTime: {
      type: String,
      default: '09:30 AM',
    },
    clinicTimings: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        startTime: { type: String, default: '10:00 AM' },
        endTime: { type: String, default: '02:00 PM' },
        isWorking: { type: Boolean, default: true },
      },
    ],
    digitalLetterhead: {
      clinicName: { type: String, default: 'My Clinic Healthcare' },
      address: { type: String, default: 'Sector 14, Main Medical Boulevard' },
      contact: { type: String, default: '+91 98765 43210' },
      logoUrl: { type: String, default: '' },
      headerText: { type: String, default: 'Consultant Physician & Specialist' },
      footerText: { type: String, default: 'Wish you a speedy recovery! Valid for 7 days.' },
    },
    about: {
      type: String,
      default: 'Experienced medical practitioner providing compassionate healthcare.',
    },
    isAvailableForEmergencyVisit: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
