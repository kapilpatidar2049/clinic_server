const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const StaffProfile = require('../models/StaffProfile');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'myclinic_super_secret_jwt_key_2026_secure', {
    expiresIn: '30d',
  });
};

// @desc    Register a new patient
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, gender, dob, address } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or phone number already exists.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'Patient',
      gender: gender || 'Other',
      dob,
      address,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user with email/phone & password
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password.',
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your login details.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact clinic admin.',
      });
    }

    const token = generateToken(user._id);

    // Fetch extra role profile if doctor or staff
    let extraProfile = null;
    if (user.role === 'Doctor') {
      extraProfile = await DoctorProfile.findOne({ userId: user._id });
    } else if (user.role === 'Staff') {
      extraProfile = await StaffProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        avatar: user.avatar,
        extraProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let extraProfile = null;

    if (user.role === 'Doctor') {
      extraProfile = await DoctorProfile.findOne({ userId: user._id });
    } else if (user.role === 'Staff') {
      extraProfile = await StaffProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        extraProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, gender, dob } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;
    if (address) user.address = address;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick Instant Demo Login for Testing Roles
// @route   POST /api/auth/demo-login
exports.demoLogin = async (req, res, next) => {
  try {
    const { role } = req.body; // 'Admin', 'Doctor', 'Staff', 'Patient'
    const targetRole = role || 'Patient';

    const user = await User.findOne({ role: targetRole, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No active demo user found for role: ${targetRole}. Please run seed script.`,
      });
    }

    const token = generateToken(user._id);
    let extraProfile = null;
    if (user.role === 'Doctor') {
      extraProfile = await DoctorProfile.findOne({ userId: user._id });
    } else if (user.role === 'Staff') {
      extraProfile = await StaffProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        avatar: user.avatar,
        extraProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};
