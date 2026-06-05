const express = require('express');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAdmin);

async function withPlanName(member, adminId) {
  const plan = await Plan.findOne({ _id: member.plan_id, admin_id: adminId }).lean();
  return plan?.name || 'Unknown';
}

router.get('', asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const alertThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const alertQuery = {
    admin_id: req.admin.id,
    $or: [
      { alert_dismissed_at: { $exists: false } },
      { alert_dismissed_at: null },
      { alert_dismissed_at: { $lt: alertThreshold } },
    ],
  };

  const expiringMembers = await Member.find({
    ...alertQuery,
    expiry_date: { $gte: now, $lte: sevenDaysLater },
  }).sort({ expiry_date: 1 }).lean();
  const expiredMembers = await Member.find({
    ...alertQuery,
    expiry_date: { $lt: now },
  }).sort({ expiry_date: -1 }).limit(50).lean();
  const pendingMembers = await Member.find({
    ...alertQuery,
    payment_status: 'pending',
  }).sort({ created_at: -1 }).lean();

  const expiring = await Promise.all(expiringMembers.map(async (member) => ({
    id: String(member._id),
    full_name: member.full_name,
    mobile: member.mobile,
    plan_name: await withPlanName(member, req.admin.id),
    expiry_date: member.expiry_date.toISOString(),
    days_left: Math.floor((member.expiry_date - now) / (24 * 60 * 60 * 1000)),
    type: 'expiring',
  })));

  const expired = await Promise.all(expiredMembers.map(async (member) => ({
    id: String(member._id),
    full_name: member.full_name,
    mobile: member.mobile,
    plan_name: await withPlanName(member, req.admin.id),
    expiry_date: member.expiry_date.toISOString(),
    days_expired: Math.floor((now - member.expiry_date) / (24 * 60 * 60 * 1000)),
    type: 'expired',
  })));

  const pendingPayments = await Promise.all(pendingMembers.map(async (member) => ({
    id: String(member._id),
    full_name: member.full_name,
    mobile: member.mobile,
    plan_name: await withPlanName(member, req.admin.id),
    payment_status: member.payment_status,
    amount_paid: member.amount_paid || 0,
    type: 'payment',
  })));

  res.json({
    expiring,
    expired,
    pending_payments: pendingPayments,
    total_alerts: expiring.length + expired.length + pendingPayments.length,
  });
}));

module.exports = router;
