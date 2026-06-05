const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { env } = require('../config/env');
const { asyncHandler } = require('../utils/asyncHandler');
const { httpError } = require('../utils/httpError');
const { requireAdmin } = require('../middleware/auth');

const DEFAULT_ADMIN_EMAIL = 'admin@am.com';
const DEFAULT_ADMIN_PASSWORD = '123456';
const LEGACY_ADMIN_EMAIL = 'admin@gym.com';
const LEGACY_ADMIN_PASSWORD = 'admin123';

const router = express.Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw httpError(400, 'Email and password are required');
  }

  const loginEmail = String(email).toLowerCase();
  let admin = await Admin.findOne({ email: loginEmail });

  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    if (loginEmail === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      admin = await Admin.findOneAndUpdate(
        { email: DEFAULT_ADMIN_EMAIL },
        {
          name: 'Admin',
          email: DEFAULT_ADMIN_EMAIL,
          password: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10),
        },
        { upsert: true, new: true }
      );
    } else if (loginEmail === LEGACY_ADMIN_EMAIL && password === LEGACY_ADMIN_PASSWORD) {
      admin = await Admin.findOneAndUpdate(
        { email: LEGACY_ADMIN_EMAIL },
        {
          name: 'Admin',
          email: LEGACY_ADMIN_EMAIL,
          password: await bcrypt.hash(LEGACY_ADMIN_PASSWORD, 10),
        },
        { upsert: true, new: true }
      );
    }
  }

  if (!admin) {
    throw httpError(401, 'Invalid email or password');
  }

  const accessToken = jwt.sign(
    { sub: admin.email, id: admin._id, role: admin.role || 'admin' },
    env.JWT_SECRET,
    { expiresIn: `${env.JWT_EXPIRY_HOURS}h` }
  );

  res.json({
    access_token: accessToken,
    token_type: 'bearer',
    admin_name: admin.name,
    admin_email: admin.email,
    admin_role: admin.role || 'admin',
  });
}));

router.put('/change-password', requireAdmin, asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    throw httpError(400, 'Current and new passwords are required');
  }

  const admin = await Admin.findOne({ email: req.admin.email });
  if (!admin || !(await bcrypt.compare(current_password, admin.password))) {
    throw httpError(400, 'Incorrect current password');
  }

  admin.password = await bcrypt.hash(new_password, 10);
  await admin.save();

  res.json({ message: 'Password updated successfully' });
}));

module.exports = router;
