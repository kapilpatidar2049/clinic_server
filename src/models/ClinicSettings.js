const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, default: 'Facilities' },
  imageUrl: { type: String, required: true },
  description: { type: String, default: '' },
  isFeatured: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
});

const clinicSettingsSchema = new mongoose.Schema(
  {
    clinicName: {
      type: String,
      default: 'My Clinic Healthcare & Wellness Center',
    },
    tagline: {
      type: String,
      default: 'Compassionate Care, Advanced Medicine',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    emergencyPhone: {
      type: String,
      default: '+91 98765 00100',
    },
    email: {
      type: String,
      default: 'care@myclinic.health',
    },
    address: {
      type: String,
      default: 'Plot 42, Health Plaza, Medical City, New Delhi, India',
    },
    operatingHours: {
      openingTime: { type: String, default: '08:00 AM' },
      closingTime: { type: String, default: '09:00 PM' },
      workingDays: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
    },
    defaultSlotDuration: {
      type: Number,
      default: 15,
    },
    allowOnlinePayment: {
      type: Boolean,
      default: true,
    },
    emergencyHomeVisitService: {
      type: Boolean,
      default: true,
    },
    prescriptionTemplate: {
      headerText: { type: String, default: 'My Clinic Multi-Specialty Outpatient Department' },
      footerText: { type: String, default: 'Not valid for medico-legal purposes. Follow prescribed regimen strictly.' },
    },
    gallery: [galleryItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClinicSettings', clinicSettingsSchema);
