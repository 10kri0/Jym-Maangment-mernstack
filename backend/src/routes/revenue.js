const express = require('express');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { parseDate } = require('../utils/dates');

const router = express.Router();
router.use(requireAdmin);

async function groupedRevenue(adminId, match, groupId, projectField) {
  return Payment.aggregate([
    { $match: { admin_id: adminId, ...match } },
    { $group: { _id: groupId, revenue: { $sum: '$amount' }, transactions: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, [projectField]: '$_id', revenue: 1, transactions: 1 } },
  ]);
}

router.get('/daily', asyncHandler(async (req, res) => {
  const adminId = new mongoose.Types.ObjectId(req.admin.id);
  let start = parseDate(req.query.start_date);
  let end = parseDate(req.query.end_date);
  if (!start || !end) {
    end = new Date();
    start = new Date(end);
    start.setDate(start.getDate() - Number(req.query.days || 30));
  }

  const data = await groupedRevenue(
    adminId,
    { date: { $gte: start, $lte: end } },
    { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
    'date'
  );
  res.json({ data, period: 'daily' });
}));

router.get('/weekly', asyncHandler(async (req, res) => {
  const adminId = new mongoose.Types.ObjectId(req.admin.id);
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - Number(req.query.weeks || 12) * 7);

  const data = await groupedRevenue(
    adminId,
    { date: { $gte: start, $lte: end } },
    { $concat: [{ $toString: { $isoWeekYear: '$date' } }, '-W', { $toString: { $isoWeek: '$date' } }] },
    'week'
  );
  res.json({ data, period: 'weekly' });
}));

router.get('/monthly', asyncHandler(async (req, res) => {
  const adminId = new mongoose.Types.ObjectId(req.admin.id);
  let start;
  let end;
  if (req.query.year) {
    const year = Number(req.query.year);
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59);
  } else {
    end = new Date();
    start = new Date(end);
    start.setMonth(start.getMonth() - Number(req.query.months || 12));
  }

  const data = await groupedRevenue(
    adminId,
    { date: { $gte: start, $lte: end } },
    { $dateToString: { format: '%Y-%m', date: '$date' } },
    'month'
  );
  res.json({ data, period: 'monthly' });
}));

router.get('/yearly', asyncHandler(async (req, res) => {
  const adminId = new mongoose.Types.ObjectId(req.admin.id);
  const data = await groupedRevenue(
    adminId,
    {},
    { $dateToString: { format: '%Y', date: '$date' } },
    'year'
  );
  res.json({ data, period: 'yearly' });
}));

router.get('/metrics', asyncHandler(async (req, res) => {
  const adminId = new mongoose.Types.ObjectId(req.admin.id);
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(currentMonthStart.getTime() - 1000);

  const totalData = await Payment.aggregate([
    { $match: { admin_id: adminId } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const currentData = await Payment.aggregate([
    { $match: { admin_id: adminId, date: { $gte: currentMonthStart } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const prevData = await Payment.aggregate([
    { $match: { admin_id: adminId, date: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalRevenue = totalData[0]?.total || 0;
  const currentMonthRevenue = currentData[0]?.total || 0;
  const prevMonthRevenue = prevData[0]?.total || 0;
  const growth = prevMonthRevenue > 0
    ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 1000) / 10
    : 0;

  const bestPlan = (await Payment.aggregate([
    { $match: { admin_id: adminId } },
    { $group: { _id: '$plan_name', total_revenue: { $sum: '$amount' }, total_subscriptions: { $sum: 1 } } },
    { $sort: { total_revenue: -1 } },
    { $limit: 1 },
  ]))[0] || { _id: 'N/A', total_revenue: 0, total_subscriptions: 0 };

  const bestMonth = (await Payment.aggregate([
    { $match: { admin_id: adminId } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, revenue: { $sum: '$amount' } } },
    { $sort: { revenue: -1 } },
    { $limit: 1 },
  ]))[0] || { _id: 'N/A', revenue: 0 };

  const planRevenues = await Payment.aggregate([
    { $match: { admin_id: adminId } },
    { $group: { _id: '$plan_name', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { revenue: -1 } },
    { $project: { _id: 0, plan_name: '$_id', revenue: 1, subscriptions: '$count' } },
  ]);

  res.json({
    total_revenue: totalRevenue,
    current_month_revenue: currentMonthRevenue,
    prev_month_revenue: prevMonthRevenue,
    growth_percentage: growth,
    profit_estimation: Math.round(totalRevenue * 70) / 100,
    membership_revenue: totalRevenue,
    best_plan: {
      name: bestPlan._id,
      revenue: bestPlan.total_revenue,
      subscriptions: bestPlan.total_subscriptions,
    },
    best_month: {
      month: bestMonth._id,
      revenue: bestMonth.revenue,
    },
    plan_revenues: planRevenues,
  });
}));

module.exports = router;
