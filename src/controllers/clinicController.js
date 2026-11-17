const ClinicSettings = require('../models/ClinicSettings');

const DEFAULT_GALLERY = [
  {
    title: 'Advanced Doctor Consultation Suite',
    category: 'OPD Rooms',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    description: 'Ergonomic consultation suites with integrated digital vitals monitors and paperless diagnosis terminal.',
    isFeatured: true,
  },
  {
    title: 'Patient Waiting Lounge & Reception Desk',
    category: 'Waiting Lounge',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    description: 'Hygienic, comfortable waiting environment with live queue token sequencing LED displays.',
    isFeatured: true,
  },
  {
    title: 'Automated Pathology & Diagnostic Lab',
    category: 'Diagnostics & Lab',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    description: 'NABL accredited pathology and clinical biochemistry testing for accurate same-day reports.',
    isFeatured: true,
  },
  {
    title: 'Minor OT & Daycare Procedure Wing',
    category: 'Procedure & OT',
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80',
    description: 'Ultra-sterile surgical environment for outpatient minor surgeries, wound care, and sterile dressings.',
    isFeatured: true,
  },
  {
    title: '24/7 Integrated Digital Pharmacy',
    category: 'Pharmacy',
    imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=1200&q=80',
    description: 'Directly linked to doctor digital prescriptions for 100% accurate medicine dispensing.',
    isFeatured: true,
  },
  {
    title: 'Emergency Home Care & Mobile Unit',
    category: 'Emergency',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    description: 'Equipped with mobile ECG, oxygen therapy, and real-time GPS telemetry for urgent home visits.',
    isFeatured: true,
  },
];

// @desc    Get Public Clinic Information & Gallery
// @route   GET /api/clinic/public
exports.getPublicClinicInfo = async (req, res, next) => {
  try {
    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = await ClinicSettings.create({ gallery: DEFAULT_GALLERY });
    } else if (!settings.gallery || settings.gallery.length === 0) {
      settings.gallery = DEFAULT_GALLERY;
      await settings.save();
    }

    res.json({
      success: true,
      clinic: {
        clinicName: settings.clinicName,
        tagline: settings.tagline,
        phone: settings.phone,
        emergencyPhone: settings.emergencyPhone,
        email: settings.email,
        address: settings.address,
        operatingHours: settings.operatingHours,
        defaultSlotDuration: settings.defaultSlotDuration,
        allowOnlinePayment: settings.allowOnlinePayment,
        emergencyHomeVisitService: settings.emergencyHomeVisitService,
        gallery: settings.gallery || DEFAULT_GALLERY,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Photo to Gallery (Admin)
// @route   POST /api/clinic/gallery
exports.addGalleryItem = async (req, res, next) => {
  try {
    const { title, category, imageUrl, description, isFeatured } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Title and Image URL are required' });
    }

    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = new ClinicSettings({ gallery: DEFAULT_GALLERY });
    }

    const newItem = {
      title,
      category: category || 'Facilities',
      imageUrl,
      description: description || '',
      isFeatured: isFeatured !== false,
    };

    settings.gallery.push(newItem);
    await settings.save();

    res.status(201).json({
      success: true,
      message: 'Photo added to clinic gallery successfully',
      gallery: settings.gallery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Photo from Gallery (Admin)
// @route   DELETE /api/clinic/gallery/:itemId
exports.deleteGalleryItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    let settings = await ClinicSettings.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Clinic settings not found' });
    }

    settings.gallery = settings.gallery.filter((item) => item._id.toString() !== itemId);
    await settings.save();

    res.json({
      success: true,
      message: 'Photo deleted from gallery successfully',
      gallery: settings.gallery,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Gallery to Defaults (Admin)
// @route   POST /api/clinic/gallery/reset
exports.resetGalleryToDefault = async (req, res, next) => {
  try {
    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = new ClinicSettings();
    }

    settings.gallery = DEFAULT_GALLERY;
    await settings.save();

    res.json({
      success: true,
      message: 'Gallery reset to recommended high-definition clinic photos',
      gallery: settings.gallery,
    });
  } catch (error) {
    next(error);
  }
};
