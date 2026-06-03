const express = require('express');
const mongoose = require('mongoose');
const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { httpError } = require('../utils/httpError');
const { memberToResponse } = require('../utils/formatters');
const { parseDate, addMonths } = require('../utils/dates');

const router = express.Router();
const { ObjectId } = mongoose.Types;

function validateObjectId(id, message = 'Invalid ID') {
  if (!ObjectId.isValid(id)) throw httpError(400, message);
}

async function findPlanName(planId) {
  const plan = await Plan.findById(planId).lean();
  return plan ? plan.name : 'Unknown';
}

router.use(requireAdmin);

router.get('', asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100);
  const skip = (page - 1) * limit;
  const query = {};
  const now = new Date();

  if (req.query.search) {
    const regex = new RegExp(String(req.query.search), 'i');
    query.$or = [
      { full_name: regex },
      { mobile: regex },
      { email: regex },
      { address: regex },
      { branch: regex },
    ];
  }
  if (req.query.payment_status) query.payment_status = req.query.payment_status;
  if (req.query.status_filter === 'active') query.expiry_date = { $gte: now };
  if (req.query.status_filter === 'expired') query.expiry_date = { $lt: now };

  const total = await Member.countDocuments(query);
  const members = await Member.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).lean();
  const data = await Promise.all(members.map(async (member) => (
    memberToResponse(member, await findPlanName(member.plan_id))
  )));

  res.json({
    members: data,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}));

router.get('/:member_id', asyncHandler(async (req, res) => {
  validateObjectId(req.params.member_id, 'Invalid member ID');
  const member = await Member.findById(req.params.member_id).lean();
  if (!member) throw httpError(404, 'Member not found');

  const payments = await Payment.find({ member_id: member._id }).sort({ date: -1 }).lean();
  const response = memberToResponse(member, await findPlanName(member.plan_id));
  response.payments = payments.map((payment) => ({
    id: String(payment._id),
    amount: payment.amount,
    plan_name: payment.plan_name,
    payment_method: payment.payment_method || 'cash',
    date: payment.date.toISOString(),
    notes: payment.notes || null,
  }));
  res.json(response);
}));

router.post('', asyncHandler(async (req, res) => {
  const body = req.body;
  validateObjectId(body.plan_id, 'Invalid plan ID');
  const plan = await Plan.findById(body.plan_id).lean();
  if (!plan) throw httpError(404, 'Plan not found');

  const member = await Member.create({
    full_name: body.full_name,
    mobile: body.mobile,
    email: body.email || null,
    address: body.address || null,
    branch: body.branch || null,
    plan_id: plan._id,
    join_date: parseDate(body.join_date),
    expiry_date: parseDate(body.expiry_date),
    payment_status: body.payment_status || 'pending',
    amount_paid: Number(body.amount_paid || 0),
    notes: body.notes || null,
  });

  if (member.payment_status === 'paid' && member.amount_paid > 0) {
    await Payment.create({
      member_id: member._id,
      amount: member.amount_paid,
      plan_name: plan.name,
      payment_method: 'cash',
      notes: `Initial membership payment - ${plan.name}`,
    });
  }

  res.status(201).json(memberToResponse(member.toObject(), plan.name));
}));

router.put('/:member_id', asyncHandler(async (req, res) => {
  validateObjectId(req.params.member_id, 'Invalid member ID');
  const member = await Member.findById(req.params.member_id);
  if (!member) throw httpError(404, 'Member not found');

  const allowed = [
    'full_name', 'mobile', 'email', 'address', 'branch', 'payment_status', 'amount_paid', 'notes',
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      member[key] = req.body[key] === '' ? null : req.body[key];
    }
  }
  if (req.body.plan_id !== undefined) {
    validateObjectId(req.body.plan_id, 'Invalid plan ID');
    member.plan_id = req.body.plan_id;
  }
  if (req.body.join_date !== undefined) member.join_date = parseDate(req.body.join_date);
  if (req.body.expiry_date !== undefined) member.expiry_date = parseDate(req.body.expiry_date);

  await member.save();
  res.json(memberToResponse(member.toObject(), await findPlanName(member.plan_id)));
}));

router.delete('/:member_id', asyncHandler(async (req, res) => {
  validateObjectId(req.params.member_id, 'Invalid member ID');
  const result = await Member.deleteOne({ _id: req.params.member_id });
  if (result.deletedCount === 0) throw httpError(404, 'Member not found');
  await Payment.deleteMany({ member_id: req.params.member_id });
  res.json({ message: 'Member deleted successfully' });
}));

router.post('/:member_id/renew', asyncHandler(async (req, res) => {
  validateObjectId(req.params.member_id, 'Invalid member ID');
  validateObjectId(req.query.plan_id, 'Invalid plan ID');
  const member = await Member.findById(req.params.member_id);
  if (!member) throw httpError(404, 'Member not found');
  const plan = await Plan.findById(req.query.plan_id).lean();
  if (!plan) throw httpError(404, 'Plan not found');

  const now = new Date();
  const startDate = member.expiry_date > now ? member.expiry_date : now;
  member.plan_id = plan._id;
  member.expiry_date = addMonths(startDate, plan.duration_months);
  member.payment_status = 'paid';
  member.amount_paid = plan.price;
  await member.save();

  await Payment.create({
    member_id: member._id,
    amount: plan.price,
    plan_name: plan.name,
    payment_method: 'cash',
    notes: `Membership renewal - ${plan.name}`,
  });

  res.json(memberToResponse(member.toObject(), plan.name));
}));

module.exports = router;
