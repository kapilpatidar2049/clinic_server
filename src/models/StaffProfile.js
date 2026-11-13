const mongoose = require('mongoose');

const staffProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    department: {
      type: String,
      enum: ['Reception', 'Reports', 'Pharmacy', 'Cleaning', 'Support', 'Administration'],
      default: 'Reception',
    },
    designation: {
      type: String,
      default: 'Front Desk Executive',
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    shiftTimings: {
      start: { type: String, default: '09:00 AM' },
      end: { type: String, default: '05:00 PM' },
    },
    salaryConfig: {
      basicSalary: { type: Number, default: 25000 },
      allowances: { type: Number, default: 3000 },
      deductions: { type: Number, default: 1000 },
    },
    reportingManager: {
      type: String,
      default: 'Clinic Administrator',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffProfile', staffProfileSchema);
