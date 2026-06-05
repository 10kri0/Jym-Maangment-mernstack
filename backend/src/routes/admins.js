const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const { requireSuperadmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { httpError } = require('../utils/httpError');

const router = express.Router();
router.use(requireSuperadmin);

// GET /api/admins - List all client admins
router.get('', asyncHandler(async (req, res) => {
  const admins = await Admin.find({ role: 'admin' }).sort({ name: 1 }).select('-password').lean();
  res.json({ admins });
}));

// POST /api/admins - Create a new client admin
router.post('', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw httpError(400, 'Name, email, and password are required');
  }

  const existing = await Admin.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    throw httpError(400, 'An admin with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await Admin.create({
    name,
    email: String(email).toLowerCase(),
    password: hashedPassword,
    role: 'admin',
  });

  const response = admin.toObject();
  delete response.password;
  res.status(201).json(response);
}));

// PUT /api/admins/:id/password - Reset client admin's password
router.put('/:id/password', asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) {
    throw httpError(400, 'Password is required');
  }

  const admin = await Admin.findById(req.params.id);
  if (!admin) {
    throw httpError(404, 'Admin not found');
  }

  if (admin.role === 'superadmin') {
    throw httpError(403, 'Cannot change superadmin password through this endpoint');
  }

  admin.password = await bcrypt.hash(password, 10);
  await admin.save();

  res.json({ message: 'Client password updated successfully' });
}));

// DELETE /api/admins/:id - Delete a client admin and all their associated data
router.delete('/:id', asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) {
    throw httpError(404, 'Admin not found');
  }

  if (admin.role === 'superadmin') {
    throw httpError(403, 'Cannot delete superadmin');
  }

  // Purge all associated members, plans, and payments
  await Member.deleteMany({ admin_id: admin._id });
  await Plan.deleteMany({ admin_id: admin._id });
  await Payment.deleteMany({ admin_id: admin._id });

  // Delete admin
  await Admin.deleteOne({ _id: admin._id });

  res.json({ message: 'Client admin and all associated gym data deleted successfully' });
}));

module.exports = router;
