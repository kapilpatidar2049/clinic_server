const mongoose = require('mongoose');

const allowanceItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
});

const deductionItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
});

const salaryStatementSchema = new mongoose.Schema(
  {
    statementId: {
      type: String,
      required: true,
      unique: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: Number, // 1 to 12
      required: true,
    },
    monthName: {
      type: String, // e.g., "October 2026"
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    allowances: [allowanceItemSchema],
    totalAllowances: {
      type: Number,
      default: 0,
    },
    deductions: [deductionItemSchema],
    totalDeductions: {
      type: Number,
      default: 0,
    },
    attendanceDeduction: {
      type: Number,
      default: 0,
    },
    presentDays: {
      type: Number,
      default: 26,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Paid'],
      default: 'Published',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Cheque', 'Cash'],
      default: 'Bank Transfer',
    },
    transactionReference: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalaryStatement', salaryStatementSchema);
