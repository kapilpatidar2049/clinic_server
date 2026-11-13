const mongoose = require('mongoose');

const medicineItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, default: '500 mg' }, // e.g., 500mg, 1 tablet
  frequency: { type: String, default: '1-0-1' }, // e.g., 1-0-1 (Morning-Afternoon-Night)
  duration: { type: String, default: '5 Days' },
  instructions: { type: String, default: 'After Food' },
});

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
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
    vitals: {
      bloodPressure: { type: String, default: '120/80 mmHg' },
      pulseRate: { type: String, default: '72 bpm' },
      temperature: { type: String, default: '98.6 °F' },
      weight: { type: String, default: '68 kg' },
      spo2: { type: String, default: '98%' },
    },
    diagnosis: {
      type: String,
      required: true,
    },
    clinicalNotes: {
      type: String,
      default: '',
    },
    medicines: [medicineItemSchema],
    testsRecommended: {
      type: [String],
      default: [],
    },
    dietaryAdvice: {
      type: String,
      default: 'Drink plenty of water and get adequate rest.',
    },
    followUpDate: {
      type: String, // YYYY-MM-DD
    },
    letterheadSnapshot: {
      clinicName: String,
      clinicAddress: String,
      clinicContact: String,
      doctorName: String,
      specialization: String,
      qualifications: String,
      regNo: String,
      headerText: String,
      footerText: String,
    },
    status: {
      type: String,
      enum: ['Draft', 'Finalized'],
      default: 'Finalized',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
