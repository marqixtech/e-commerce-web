const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { asyncHandler } = require('../middleware/errorHandler');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    res.statusCode = 400;
    throw new Error('fullName, email and password are required');
  }
  if (!isValidEmail(email)) {
    res.statusCode = 400;
    throw new Error('Please provide a valid email address');
  }
  if (password.length < 6) {
    res.statusCode = 400;
    throw new Error('Password must be at least 6 characters');
  }

  const existing = await userModel.findByEmail(email.toLowerCase());
  if (existing) {
    res.statusCode = 409;
    throw new Error('An account with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await userModel.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    phone,
  });

  const token = signToken(user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user, token },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.statusCode = 400;
    throw new Error('Email and password are required');
  }

  const user = await userModel.findByEmail(email.toLowerCase());
  if (!user) {
    res.statusCode = 401;
    throw new Error('Invalid email or password');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.statusCode = 401;
    throw new Error('Invalid email or password');
  }

  const token = signToken(user);

  // never send password_hash back to the client
  delete user.password_hash;

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: { user, token },
  });
});

// GET /api/auth/me  (requires auth middleware)
const getMe = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    res.statusCode = 404;
    throw new Error('User not found');
  }
  res.json({ success: true, data: { user } });
});

module.exports = { register, login, getMe };
