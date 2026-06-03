const express = require('express');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { startOfDay } = require('../utils/dates');

const router = express.Router();
router.use(requireAdmin);

async function sumPayments(match) {
  const rows = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return rows[0]?.total || 0;
}

router.get('/stats', asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    totalMembers,
    activeMembers,
    expiredMembers,
    todayRevenue,
    monthlyRevenue,
    annualRevenue,
    pendingPayments,
  ] = await Promise.all([
    Member.countDocuments({}),
    Member.countDocuments({ expiry_date: { $gte: now } }),
    Member.countDocuments({ expiry_date: { $lt: now } }),
    sumPayments({ date: { $gte: todayStart } }),
    sumPayments({ date: { $gte: monthStart } }),
    sumPayments({ date: { $gte: yearStart } }),
    Member.countDocuments({ payment_status: { $in: ['pending', 'overdue'] } }),
  ]);

  const recentMembersRaw = await Member.find().sort({ created_at: -1 }).limit(10).lean();
  const recentMembers = await Promise.all(recentMembersRaw.map(async (member) => {
    const plan = await Plan.findById(member.plan_id).lean();
    return {
      id: String(member._id),
      full_name: member.full_name,
      mobile: member.mobile,
      plan_name: plan?.name || 'Unknown',
      join_date: member.join_date.toISOString(),
      expiry_date: member.expiry_date.toISOString(),
      payment_status: member.payment_status,
    };
  }));

  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const revenueTrend = await Payment.aggregate([
    { $match: { date: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', revenue: '$total', transactions: '$count' } },
  ]);

  const planDistribution = await Member.aggregate([
    { $lookup: { from: 'plans', localField: 'plan_id', foreignField: '_id', as: 'plan' } },
    { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
    { $group: { _id: '$plan.name', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, name: { $ifNull: ['$_id', 'Unknown'] }, value: '$count' } },
  ]);

  res.json({
    total_members: totalMembers,
    active_members: activeMembers,
    expired_members: expiredMembers,
    today_revenue: todayRevenue,
    monthly_revenue: monthlyRevenue,
    annual_revenue: annualRevenue,
    pending_payments: pendingPayments,
    recent_members: recentMembers,
    revenue_trend: revenueTrend,
    plan_distribution: planDistribution,
  });
}));

module.exports = router;
