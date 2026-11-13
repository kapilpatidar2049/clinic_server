const mongoose = require('mongoose');

const clinicTaskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      enum: ['Reception', 'Reports', 'Pharmacy', 'Cleaning', 'Support', 'All'],
      default: 'Reception',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    deadline: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    status: {
      type: String,
      enum: ['Assigned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
      default: 'Assigned',
    },
    staffRemarks: {
      type: String,
      default: '',
    },
    adminFeedback: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicTask', clinicTaskSchema);
