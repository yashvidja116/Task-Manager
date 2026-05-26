const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');


const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    let userRole = 'member';
    if (role === 'admin') {
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        userRole = 'admin'; // First user becomes admin
      }
    }

    const user = await User.create({ name, email, password, role: userRole });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        refreshToken,
        user: user.toPublicJSON(),
      },
    });
  } catch (error) {// Debugging line
    res.status(500).json({ success: false, message: error.message });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: user.toPublicJSON(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};


const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Password updated successfully', data: { token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, logout, updatePassword };
