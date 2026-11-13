const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const StaffProfile = require('../models/StaffProfile');
const Specialization = require('../models/Specialization');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const EmergencyHomeVisit = require('../models/EmergencyHomeVisit');
const StaffAttendance = require('../models/StaffAttendance');
const LeaveRequest = require('../models/LeaveRequest');
const SalaryStatement = require('../models/SalaryStatement');
const ClinicTask = require('../models/ClinicTask');
const ClinicSettings = require('../models/ClinicSettings');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    console.log('🧹 Clearing old clinic data...');
    await Promise.all([
      User.deleteMany({}),
      DoctorProfile.deleteMany({}),
      StaffProfile.deleteMany({}),
      Specialization.deleteMany({}),
      Appointment.deleteMany({}),
      Prescription.deleteMany({}),
      EmergencyHomeVisit.deleteMany({}),
      StaffAttendance.deleteMany({}),
      LeaveRequest.deleteMany({}),
      SalaryStatement.deleteMany({}),
      ClinicTask.deleteMany({}),
      ClinicSettings.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('🏥 Seeding Clinic Settings...');
    const settings = await ClinicSettings.create({
      clinicName: 'My Clinic Healthcare & Multi-Specialty Center',
      tagline: 'Excellence in Comprehensive Healthcare & Family Medicine',
      phone: '+91 98765 43210',
      emergencyPhone: '+91 98765 00100',
      email: 'care@myclinic.health',
      address: 'Plot 42, Healthcare Enclave, Main Outer Ring Road, New Delhi, 110001',
      operatingHours: {
        openingTime: '08:00 AM',
        closingTime: '09:00 PM',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
      defaultSlotDuration: 15,
      allowOnlinePayment: true,
      emergencyHomeVisitService: true,
    });

    console.log('🩺 Seeding Specializations...');
    const specializationsData = [
      { name: 'General Medicine', description: 'Primary healthcare, fever, viral infections, lifestyle disorders', iconName: 'Stethoscope' },
      { name: 'Cardiology', description: 'Heart care, hypertension, ECG, echocardiography, cardiac monitoring', iconName: 'HeartPulse' },
      { name: 'Pediatrics', description: 'Child care, neonatal health, immunization, growth assessment', iconName: 'Baby' },
      { name: 'Dermatology', description: 'Skin, hair, allergic conditions, cosmetic dermatology', iconName: 'Sparkles' },
      { name: 'Orthopedics', description: 'Bone fractures, joint pain, arthritis, spinal rehabilitation', iconName: 'Bone' },
      { name: 'Neurology', description: 'Brain, nerves, migraine, stroke management, neuro consult', iconName: 'Activity' },
    ];
    await Specialization.insertMany(specializationsData);

    console.log('👤 Seeding Users & Accounts...');
    // 1. Admin
    const adminUser = await User.create({
      name: 'Dr. Alok Verma (Admin)',
      email: 'admin@myclinic.com',
      phone: '9810011001',
      password: 'Admin@123',
      role: 'Admin',
      gender: 'Male',
      address: { fullAddress: 'Clinic Administration Office, New Delhi' },
    });

    // 2. Doctor 1 (Cardiology)
    const doctorUser1 = await User.create({
      name: 'Rajesh Sharma',
      email: 'doctor1@myclinic.com',
      phone: '9810011002',
      password: 'Doctor@123',
      role: 'Doctor',
      gender: 'Male',
      address: { fullAddress: 'Greater Kailash, New Delhi' },
    });

    const doctorProfile1 = await DoctorProfile.create({
      userId: doctorUser1._id,
      specialization: 'Cardiology',
      qualifications: ['MBBS', 'MD (Medicine)', 'DM (Cardiology)'],
      experienceYears: 14,
      registrationNumber: 'MCI-DEL-28491',
      consultationFee: 800,
      slotDurationMinutes: 15,
      reportingTime: '09:30 AM',
      clinicTimings: [
        { day: 'Monday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
        { day: 'Tuesday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
        { day: 'Wednesday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
        { day: 'Thursday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
        { day: 'Friday', startTime: '10:00 AM', endTime: '02:00 PM', isWorking: true },
        { day: 'Saturday', startTime: '10:00 AM', endTime: '01:00 PM', isWorking: true },
      ],
      digitalLetterhead: {
        clinicName: 'My Clinic Heart & Vascular Institute',
        address: 'Consulting Suite 101, My Clinic Center, New Delhi',
        contact: '+91 98100 11002',
        headerText: 'Department of Cardiology & Vascular Medicine',
        footerText: 'Emergency: Dial +91 98765 00100. Review within 7 days is complimentary.',
      },
    });

    // 3. Doctor 2 (Pediatrics)
    const doctorUser2 = await User.create({
      name: 'Priya Mehra',
      email: 'doctor2@myclinic.com',
      phone: '9810011003',
      password: 'Doctor@123',
      role: 'Doctor',
      gender: 'Female',
      address: { fullAddress: 'Saket, New Delhi' },
    });

    const doctorProfile2 = await DoctorProfile.create({
      userId: doctorUser2._id,
      specialization: 'Pediatrics',
      qualifications: ['MBBS', 'DCH', 'DNB (Pediatrics)'],
      experienceYears: 9,
      registrationNumber: 'MCI-DEL-39218',
      consultationFee: 600,
      slotDurationMinutes: 15,
      reportingTime: '10:00 AM',
      clinicTimings: [
        { day: 'Monday', startTime: '10:30 AM', endTime: '02:30 PM', isWorking: true },
        { day: 'Wednesday', startTime: '10:30 AM', endTime: '02:30 PM', isWorking: true },
        { day: 'Friday', startTime: '10:30 AM', endTime: '02:30 PM', isWorking: true },
        { day: 'Saturday', startTime: '10:00 AM', endTime: '01:00 PM', isWorking: true },
      ],
      digitalLetterhead: {
        clinicName: 'My Clinic Child & Adolescent Care',
        address: 'Consulting Suite 104, My Clinic Center, New Delhi',
        contact: '+91 98100 11003',
        headerText: 'Department of Pediatrics & Child Development',
        footerText: 'Keep medicines out of reach of children. Follow up after 5 days.',
      },
    });

    // 4. Staff 1 (Receptionist)
    const staffUser1 = await User.create({
      name: 'Sunita Sharma',
      email: 'reception@myclinic.com',
      phone: '9810011004',
      password: 'Staff@123',
      role: 'Staff',
      gender: 'Female',
      address: { fullAddress: 'Lajpat Nagar, New Delhi' },
    });

    await StaffProfile.create({
      userId: staffUser1._id,
      department: 'Reception',
      designation: 'Senior Front Desk Executive',
      salaryConfig: {
        basicSalary: 28000,
        allowances: 3500,
        deductions: 1200,
      },
    });

    // 5. Staff 2 (Reports & Lab Coordinator)
    const staffUser2 = await User.create({
      name: 'Ramesh Kumar',
      email: 'reports@myclinic.com',
      phone: '9810011005',
      password: 'Staff@123',
      role: 'Staff',
      gender: 'Male',
      address: { fullAddress: 'Malviya Nagar, New Delhi' },
    });

    await StaffProfile.create({
      userId: staffUser2._id,
      department: 'Reports',
      designation: 'Medical Records & Lab Officer',
      salaryConfig: {
        basicSalary: 26000,
        allowances: 3000,
        deductions: 1000,
      },
    });

    // 6. Patients
    const patientUser1 = await User.create({
      name: 'Amit Patel',
      email: 'patient1@gmail.com',
      phone: '9810011006',
      password: 'Patient@123',
      role: 'Patient',
      gender: 'Male',
      dob: new Date('1990-05-15'),
      address: {
        street: 'Flat 302, Palm Heights',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110017',
        fullAddress: 'Flat 302, Palm Heights, South Extension, New Delhi',
      },
    });

    const patientUser2 = await User.create({
      name: 'Neha Verma',
      email: 'patient2@gmail.com',
      phone: '9810011007',
      password: 'Patient@123',
      role: 'Patient',
      gender: 'Female',
      dob: new Date('1996-08-22'),
      address: {
        street: 'B-14 Green Park',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110016',
        fullAddress: 'B-14 Green Park Extension, New Delhi',
      },
    });

    console.log('📅 Seeding Appointments...');
    const todayStr = new Date().toISOString().split('T')[0];

    const appt1 = await Appointment.create({
      appointmentId: 'APT-1001',
      patientId: patientUser1._id,
      doctorId: doctorProfile1._id,
      date: todayStr,
      slotTime: '10:00 AM',
      tokenNumber: 1,
      status: 'Confirmed',
      consultationFee: 800,
      paymentStatus: 'Paid',
      paymentMethod: 'Online (Card/UPI)',
      symptoms: 'Mild chest heaviness and breathlessness during stair climbing',
    });

    const appt2 = await Appointment.create({
      appointmentId: 'APT-1002',
      patientId: patientUser2._id,
      doctorId: doctorProfile1._id,
      date: todayStr,
      slotTime: '10:15 AM',
      tokenNumber: 2,
      status: 'Confirmed',
      consultationFee: 800,
      paymentStatus: 'Pending',
      paymentMethod: 'Cash at Clinic',
      symptoms: 'Routine lipid profile review & blood pressure check',
    });

    console.log('💊 Seeding Digital Prescription...');
    await Prescription.create({
      prescriptionId: 'RX-88401',
      appointmentId: appt1._id,
      patientId: patientUser1._id,
      doctorId: doctorProfile1._id,
      vitals: {
        bloodPressure: '138/88 mmHg',
        pulseRate: '78 bpm',
        temperature: '98.4 °F',
        weight: '74 kg',
        spo2: '99%',
      },
      diagnosis: 'Stage 1 Hypertension & Mild Anginal Equivalent',
      clinicalNotes: 'Heart sounds normal. No murmur. ECG shows normal sinus rhythm.',
      medicines: [
        { name: 'Tab Telmisartan', dosage: '40 mg', frequency: '1-0-0', duration: '30 Days', instructions: 'Morning after breakfast' },
        { name: 'Tab Metoprolol Succinate ER', dosage: '25 mg', frequency: '0-0-1', duration: '30 Days', instructions: 'Night after dinner' },
        { name: 'Tab Rosuvastatin', dosage: '10 mg', frequency: '0-0-1', duration: '30 Days', instructions: 'Night before bedtime' },
      ],
      testsRecommended: ['Lipid Profile Fasting', '2D Echocardiogram', 'HbA1c'],
      dietaryAdvice: 'Low sodium diet (< 3g salt/day), 30 mins brisk walking, avoid fried items.',
      followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      letterheadSnapshot: {
        clinicName: 'My Clinic Heart & Vascular Institute',
        clinicAddress: 'Consulting Suite 101, My Clinic Center, New Delhi',
        clinicContact: '+91 98100 11002',
        doctorName: 'Dr. Rajesh Sharma',
        specialization: 'Cardiology',
        qualifications: 'MBBS, MD (Medicine), DM (Cardiology)',
        regNo: 'MCI-DEL-28491',
        headerText: 'Department of Cardiology & Vascular Medicine',
        footerText: 'Emergency: Dial +91 98765 00100. Review within 7 days is complimentary.',
      },
      status: 'Finalized',
    });

    console.log('🚑 Seeding Emergency Home Visit Request...');
    await EmergencyHomeVisit.create({
      visitId: 'EMG-9021',
      patientId: patientUser1._id,
      doctorId: doctorProfile1._id,
      patientName: 'Amit Patel',
      contactNumber: '9810011006',
      emergencyDetails: 'Severe dizziness, sweating, and difficulty standing. Need urgent home assessment.',
      location: {
        address: 'Flat 302, Palm Heights, South Extension, New Delhi',
        latitude: 28.5703,
        longitude: 77.2217,
        landmark: 'Opposite Community Park Gate 2',
      },
      status: 'Accepted',
      priority: 'Critical',
      doctorRemarks: 'Doctor on the way with emergency cardiac kit.',
      homeVisitFee: 1500,
      paymentStatus: 'Pending',
    });

    console.log('⏰ Seeding Staff Attendance...');
    await StaffAttendance.create({
      staffId: staffUser1._id,
      date: todayStr,
      checkIn: new Date(new Date().setHours(8, 55, 0, 0)),
      status: 'Present',
      isLate: false,
      notes: 'Punctual check-in',
    });

    await StaffAttendance.create({
      staffId: staffUser2._id,
      date: todayStr,
      checkIn: new Date(new Date().setHours(9, 10, 0, 0)),
      status: 'Present',
      isLate: false,
      notes: 'On time',
    });

    console.log('📋 Seeding Clinic Tasks...');
    await ClinicTask.create({
      taskId: 'TSK-501',
      title: 'Verify pending lab reports for Morning OPD',
      description: 'Collect all blood biochemistry and urine analysis reports from partner diagnostic center and attach to patient profiles.',
      department: 'Reports',
      assignedTo: staffUser2._id,
      priority: 'High',
      deadline: todayStr,
      status: 'In Progress',
      createdBy: adminUser._id,
    });

    await ClinicTask.create({
      taskId: 'TSK-502',
      title: 'Coordinate Patient Queue for Dr. Rajesh Sharma',
      description: 'Ensure token sequencing is followed smoothly and patient vitals are recorded before consultation.',
      department: 'Reception',
      assignedTo: staffUser1._id,
      priority: 'Medium',
      deadline: todayStr,
      status: 'Assigned',
      createdBy: adminUser._id,
    });

    console.log('🏖️ Seeding Leave Requests...');
    await LeaveRequest.create({
      userId: doctorUser2._id,
      userRole: 'Doctor',
      leaveType: 'Casual Leave',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalDays: 2,
      reason: 'Attending Pediatric Medical Conference in Mumbai',
      status: 'Pending',
    });

    console.log('💰 Seeding Salary Statement...');
    await SalaryStatement.create({
      statementId: 'SAL-202610-001',
      staffId: staffUser1._id,
      month: 10,
      year: 2026,
      monthName: 'October 2026',
      basicSalary: 28000,
      allowances: [
        { title: 'HRA', amount: 5600 },
        { title: 'Medical Allowance', amount: 1500 },
        { title: 'Conveyance', amount: 1500 },
      ],
      totalAllowances: 8600,
      deductions: [
        { title: 'Provident Fund (PF)', amount: 3360 },
        { title: 'Professional Tax', amount: 200 },
      ],
      totalDeductions: 3560,
      attendanceDeduction: 0,
      presentDays: 26,
      netSalary: 33040,
      status: 'Published',
    });

    console.log('🔔 Seeding System Notifications...');
    await Notification.create({
      recipient: patientUser1._id,
      title: 'Welcome to My Clinic!',
      message: 'Your health account is active. You can book doctor appointments and view medical records anytime.',
      type: 'system',
    });

    console.log(`✅ ALL DEMO SEED DATA CREATED SUCCESSFULLY!`);
    console.log(`--------------------------------------------------`);
    console.log(`Demo Credentials:`);
    console.log(`🔑 Admin:   admin@myclinic.com    / Admin@123`);
    console.log(`🔑 Doctor:  doctor1@myclinic.com  / Doctor@123`);
    console.log(`🔑 Staff:   reception@myclinic.com / Staff@123`);
    console.log(`🔑 Patient: patient1@gmail.com    / Patient@123`);
    console.log(`--------------------------------------------------`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
};

// Allow running directly via `node src/config/seed.js`
if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my_clinic')
    .then(async () => {
      console.log('MongoDB connected for seed script.');
      await seedData();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Connection failed:', err);
      process.exit(1);
    });
}

module.exports = seedData;
