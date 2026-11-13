const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      default: 'System',
    },
    role: {
      type: String,
      default: 'System',
    },
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      enum: ['Auth', 'Appointments', 'Doctors', 'Staff', 'Prescriptions', 'HomeVisits', 'Attendance', 'Leaves', 'Salary', 'Tasks', 'Settings'],
      required: true,
    },
    details: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
