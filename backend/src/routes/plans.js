const express = require('express');
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const Member = require('../models/Member');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');
const { httpError } = require('../utils/httpError');
const { planToResponse } = require('../utils/formatters');

const router = express.Router();
const { ObjectId } = mongoose.Types;

function validateObjectId(id, message = 'Invalid plan ID') {
  if (!ObjectId.isValid(id)) throw httpError(400, message);
}

router.use(requireAdmin);

router.get('', asyncHandler(async (req, res) => {
  const plans = await Plan.find().sort({ price: 1 }).lean();
  const data = await Promise.all(plans.map(async (plan) => {
    const count = await Member.countDocuments({ plan_id: plan._id });
    return planToResponse(plan, count);
  }));
  res.json({ plans: data });
}));

router.get('/:plan_id', asyncHandler(async (req, res) => {
  validateObjectId(req.params.plan_id);
  const plan = await Plan.findById(req.params.plan_id).lean();
  if (!plan) throw httpError(404, 'Plan not found');
  const count = await Member.countDocuments({ plan_id: plan._id });
  res.json(planToResponse(plan, count));
}));

router.post('', asyncHandler(async (req, res) => {
  const { name, duration_months, price, description = null, is_active = true } = req.body;
  if (!name || !duration_months || price === undefined) {
    throw httpError(400, 'Name, duration_months, and price are required');
  }

  const existing = await Plan.findOne({ name });
  if (existing) throw httpError(400, 'Plan name already exists');

  const plan = await Plan.create({ name, duration_months, price, description, is_active });
  res.status(201).json(planToResponse(plan.toObject()));
}));

router.put('/:plan_id', asyncHandler(async (req, res) => {
  validateObjectId(req.params.plan_id);
  const plan = await Plan.findById(req.params.plan_id);
  if (!plan) throw httpError(404, 'Plan not found');

  const allowed = ['name', 'duration_months', 'price', 'description', 'is_active'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) plan[key] = req.body[key];
  }
  await plan.save();

  const count = await Member.countDocuments({ plan_id: plan._id });
  res.json(planToResponse(plan.toObject(), count));
}));

router.delete('/:plan_id', asyncHandler(async (req, res) => {
  validateObjectId(req.params.plan_id);
  const memberCount = await Member.countDocuments({ plan_id: req.params.plan_id });
  if (memberCount > 0) {
    throw httpError(400, `Cannot delete plan. ${memberCount} members are currently using this plan.`);
  }

  const result = await Plan.deleteOne({ _id: req.params.plan_id });
  if (result.deletedCount === 0) throw httpError(404, 'Plan not found');
  res.json({ message: 'Plan deleted successfully' });
}));

module.exports = router;
