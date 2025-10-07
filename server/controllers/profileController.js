const UserProfile = require('../models/UserProfile');
const cloudinary = require('../config/cloudinary');

exports.getProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.params.userId });
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateProfile = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    preferences,
  } = req.body;

  const profileFields = {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    preferences,
  };

  if (preferences && typeof preferences === 'string') {
    profileFields.preferences = JSON.parse(preferences);
  }

  try {
    let profile = await UserProfile.findOne({ userId: req.params.userId });

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      profileFields.avatar = result.secure_url;
    }

    if (profile) {
      // Update
      profile = await UserProfile.findOneAndUpdate(
        { userId: req.params.userId },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }

    // Create
    profile = new UserProfile({ ...profileFields, userId: req.params.userId });
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};