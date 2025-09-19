const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Enforce fixed admin credentials
    if (email.toLowerCase() === 'admin@culturaft.com') {
      // Check if admin already exists
      let adminUser = await User.findOne({ email: 'admin@culturaft.com' });
      if (adminUser) {
        return res.status(400).json({ message: 'Admin account already exists' });
      }
      if (password !== 'culturaft2025') {
        return res.status(400).json({ message: 'Invalid admin password' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      adminUser = new User({ name: 'Admin', email: 'admin@culturaft.com', password: hashedPassword, role: 'admin' });
      await adminUser.save();
      const token = jwt.sign({ userId: adminUser._id }, 'your_jwt_secret', { expiresIn: '1h' });
      return res.status(201).json({
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        }
      });
    }
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create new user
    user = new User({ name, email, password: hashedPassword, role: 'user' });
    await user.save();
    // Generate JWT for immediate login
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Enforce fixed admin credentials
    if (email.toLowerCase() === 'admin@culturaft.com') {
      let adminUser = await User.findOne({ email: 'admin@culturaft.com' });
      if (!adminUser) {
        return res.status(400).json({ message: 'Admin account does not exist' });
      }
      if (password !== 'culturaft2025') {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      // Generate JWT
      const token = jwt.sign({ userId: adminUser._id }, 'your_jwt_secret', { expiresIn: '1h' });
      return res.json({
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        }
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Generate JWT
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
    // Return user info and token
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
