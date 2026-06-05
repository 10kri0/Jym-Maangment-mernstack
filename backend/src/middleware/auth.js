const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { env } = require('../config/env');

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ detail: 'Not authenticated' });
    }

    const payload = jwt.verify(token, env.JWT_SECRET);
    const admin = await Admin.findOne({ email: payload.sub }).lean();
    if (!admin) {
      return res.status(401).json({ detail: 'Admin not found' });
    }

    req.admin = {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role || 'admin',
    };
    next();
  } catch (error) {
    res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

async function requireSuperadmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ detail: 'Access denied: Superadmin privileges required' });
    }
    next();
  });
}

module.exports = { requireAdmin, requireSuperadmin };
