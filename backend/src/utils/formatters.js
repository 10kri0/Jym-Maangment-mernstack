function iso(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function planToResponse(plan, memberCount = 0) {
  return {
    id: String(plan._id),
    name: plan.name,
    duration_months: plan.duration_months,
    price: plan.price,
    description: plan.description,
    is_active: plan.is_active ?? true,
    member_count: memberCount,
    created_at: iso(plan.created_at),
    updated_at: iso(plan.updated_at),
  };
}

function memberToResponse(member, planName = null) {
  return {
    id: String(member._id),
    full_name: member.full_name,
    mobile: member.mobile,
    email: member.email || null,
    address: member.address || null,
    branch: member.branch || null,
    plan_id: String(member.plan_id),
    plan_name: planName,
    join_date: iso(member.join_date),
    expiry_date: iso(member.expiry_date),
    payment_status: member.payment_status,
    amount_paid: member.amount_paid || 0,
    notes: member.notes || null,
    created_at: iso(member.created_at),
    updated_at: iso(member.updated_at),
  };
}

module.exports = { iso, planToResponse, memberToResponse };
