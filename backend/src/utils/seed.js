const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Plan = require('../models/Plan');
const Member = require('../models/Member');
const Payment = require('../models/Payment');

const DEFAULT_SUPERADMIN_EMAIL = 'superadmin@gym.com';
const DEFAULT_SUPERADMIN_PASSWORD = 'superadmin123';

const DEFAULT_ADMIN_EMAIL = 'admin@am.com';
const DEFAULT_ADMIN_PASSWORD = '123456';

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedDatabase() {
  // Ensure default superadmin exists
  let superadmin = await Admin.findOne({ email: DEFAULT_SUPERADMIN_EMAIL });
  if (!superadmin) {
    superadmin = await Admin.create({
      name: 'Super Admin',
      email: DEFAULT_SUPERADMIN_EMAIL,
      password: await bcrypt.hash(DEFAULT_SUPERADMIN_PASSWORD, 10),
      role: 'superadmin',
    });
  }

  // Ensure default client admin exists
  let clientAdmin = await Admin.findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (!clientAdmin) {
    clientAdmin = await Admin.create({
      name: 'Admin',
      email: DEFAULT_ADMIN_EMAIL,
      password: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10),
      role: 'admin',
    });
  } else {
    // Update the password to '123456' as requested by the user
    clientAdmin.password = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await clientAdmin.save();
  }

  // Migrate legacy data if any exists without admin_id
  await Plan.updateMany({ admin_id: { $exists: false } }, { $set: { admin_id: clientAdmin._id } });
  await Member.updateMany({ admin_id: { $exists: false } }, { $set: { admin_id: clientAdmin._id } });
  await Payment.updateMany({ admin_id: { $exists: false } }, { $set: { admin_id: clientAdmin._id } });

  // Check if we already have historical data for 2024
  const hasYearData = await Payment.exists({
    admin_id: clientAdmin._id,
    date: {
      $gte: new Date(2024, 0, 1),
      $lt: new Date(2025, 0, 1),
    },
  });

  if (hasYearData) {
    console.log('Database already seeded with historical 2024 data.');
    return;
  }

  console.log('Seeding multi-year database (2024, 2025, 2026)...');

  // Clear existing data for a clean slate
  await Plan.deleteMany({});
  await Member.deleteMany({});
  await Payment.deleteMany({});

  const plans = await Plan.insertMany([
    {
      name: 'Monthly Basic',
      duration_months: 1,
      price: 999,
      description: 'Access to gym floor and basic equipment. Perfect for beginners.',
      is_active: true,
      admin_id: clientAdmin._id,
    },
    {
      name: 'Quarterly Premium',
      duration_months: 3,
      price: 2499,
      description: 'Full gym access with cardio zone, weight training, and group classes.',
      is_active: true,
      admin_id: clientAdmin._id,
    },
    {
      name: 'Half Yearly Gold',
      duration_months: 6,
      price: 4499,
      description: 'Everything in Premium + personal trainer sessions twice a week.',
      is_active: true,
      admin_id: clientAdmin._id,
    },
    {
      name: 'Annual Platinum',
      duration_months: 12,
      price: 7999,
      description: 'All-inclusive access with unlimited personal training, diet plan, and spa.',
      is_active: true,
      admin_id: clientAdmin._id,
    },
  ]);

  const firstNames = [
    'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohit', 'Kavita',
    'Suresh', 'Neha', 'Arjun', 'Pooja', 'Deepak', 'Ritu', 'Manish', 'Swati',
    'Rajesh', 'Meera', 'Karan', 'Divya', 'Arun', 'Nisha', 'Vishal', 'Anita', 'Sanjay',
  ];
  const lastNames = [
    'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Joshi', 'Rao',
    'Mehta', 'Shah', 'Reddy', 'Nair', 'Desai', 'Mishra', 'Chauhan',
  ];
  const addresses = [
    '123 MG Road, Ahmedabad', '45 Park Street, Surat', '78 Ring Road, Vadodara',
    '90 Station Road, Rajkot', '12 Lake View, Gandhinagar', '34 Civil Lines, Bhavnagar',
    '56 Mall Road, Jamnagar', '67 Market Lane, Anand', '89 Temple Road, Junagadh',
  ];
  const paymentMethods = ['cash', 'upi', 'card', 'bank_transfer'];
  const branches = ['Eru', 'Motobajr', null];

  const now = new Date();
  const members = [];
  const payments = [];

  // Seed 40 members with payments spanning from 2024 to 2026
  for (let i = 0; i < 40; i += 1) {
    const plan = pick(plans);
    const fname = pick(firstNames);
    const lname = pick(lastNames);
    const memberId = new mongoose.Types.ObjectId();

    // join date randomly between Jan 1, 2024 and 5 days ago
    const startRange = new Date(2024, 0, 1).getTime();
    const endRange = now.getTime() - 5 * 24 * 60 * 60 * 1000;
    const joinTime = startRange + Math.random() * (endRange - startRange);
    const joinDate = new Date(joinTime);

    // 75% chance member is active (continues to pay), 25% chance they churned (stopped paying)
    const isActiveMember = Math.random() < 0.75;

    let currentExpiry = new Date(joinDate);
    currentExpiry.setMonth(currentExpiry.getMonth() + plan.duration_months);

    // Initial Payment
    payments.push({
      member_id: memberId,
      amount: plan.price,
      plan_name: plan.name,
      payment_method: pick(paymentMethods),
      date: new Date(joinDate),
      notes: `Membership subscription - ${plan.name}`,
      admin_id: clientAdmin._id,
    });

    let lastPaymentDate = new Date(joinDate);
    let cycleCount = 1;

    // Generate renewals chronologically
    while (true) {
      if (!isActiveMember && cycleCount >= randomInt(1, 3)) {
        break;
      }

      const nextPayDate = new Date(lastPaymentDate);
      nextPayDate.setMonth(nextPayDate.getMonth() + plan.duration_months);

      // Don't generate payments in the future
      if (nextPayDate.getTime() > now.getTime()) {
        break;
      }

      payments.push({
        member_id: memberId,
        amount: plan.price,
        plan_name: plan.name,
        payment_method: pick(paymentMethods),
        date: new Date(nextPayDate),
        notes: `Membership renewal - ${plan.name}`,
        admin_id: clientAdmin._id,
      });

      currentExpiry = new Date(nextPayDate);
      currentExpiry.setMonth(currentExpiry.getMonth() + plan.duration_months);
      lastPaymentDate = nextPayDate;
      cycleCount += 1;
    }

    let paymentStatus = 'pending';
    if (currentExpiry.getTime() >= now.getTime()) {
      paymentStatus = 'completed';
    }

    members.push({
      _id: memberId,
      full_name: `${fname} ${lname}`,
      mobile: `9${randomInt(100000000, 999999999)}`,
      email: `${fname.toLowerCase()}.${lname.toLowerCase()}${randomInt(1, 99)}@gmail.com`,
      address: pick(addresses),
      branch: pick(branches),
      plan_id: plan._id,
      join_date: joinDate,
      expiry_date: currentExpiry,
      payment_status: paymentStatus,
      amount_paid: paymentStatus === 'completed' ? plan.price : 0,
      admin_id: clientAdmin._id,
    });
  }

  await Member.insertMany(members);
  await Payment.insertMany(payments);
  console.log(`Database seeding complete. Inserted ${members.length} members and ${payments.length} payments.`);
}

module.exports = { seedDatabase };
