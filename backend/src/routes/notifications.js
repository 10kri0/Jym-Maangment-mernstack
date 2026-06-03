const express = require('express');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();
router.use(requireAdmin);

async function withPlanName(member) {
  const plan = await Plan.findById(member.plan_id).lean();
  return plan?.name || 'Unknown';
}

router.get('', asyncHandler(async (req, res) => {
  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const expiringMembers = await Member.find({
    expiry_date: { $gte: now, $lte: sevenDaysLater },
  }).sort({ expiry_date: 1 }).lean();
  const expiredMembers = await Member.find({
    expiry_date: { $lt: now },
  }).sort({ expiry_date: -1 }).limit(50).lean();
  const pendingMembers = await Member.find({
    payment_status: { $in: ['pending', 'overdue'] },
  }).sort({ created_at: -1 }).lean();

  const expiring = await Promise.all(expiringMembers.map(async (member) => ({
    id: String(member._id),
    full_name: member.full_name,
    mobile: member.mobile,
    plan_name: await withPlanName(member),
    expiry_date: member.expiry_date.toISOString(),
    days_left: Math.floor((member.expiry_date - now) / (24 * 60 * 60 * 1000)),
    type: 'expiring',
  })));

  const expired = await Promise.all(expiredMembers.map(async (member) => ({
    id: String(member._id),
    full_name: member.full_name,
    mobile: member.mobile,
    plan_name: await withPlanName(member),
    expiry_date: member.expiry_date.toISOString(),
    days_expired: Math.floor((now - member.expiry_date) / (24 * 60 * 60 * 1000)),
    type: 'expired',
  })));

  const pendingPayments = await Promise.all(pendingMembers.map(async (member) => ({
    id: String(member._id),
    full_name: member.full_name,
    mobile: member.mobile,
    plan_name: await withPlanName(member),
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
