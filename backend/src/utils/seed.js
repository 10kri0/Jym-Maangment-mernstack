const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Plan = require('../models/Plan');
const Member = require('../models/Member');
const Payment = require('../models/Payment');

const DEFAULT_ADMIN_EMAIL = 'admin@am.com';
const DEFAULT_ADMIN_PASSWORD = '123';

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedDatabase() {
  const adminExists = await Admin.findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (!adminExists) {
    await Admin.create({
      name: 'Admin',
      email: DEFAULT_ADMIN_EMAIL,
      password: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10),
    });
  }

  const plansExist = await Plan.exists({});
  if (plansExist) {
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding database...');

  const plans = await Plan.insertMany([
    {
      name: 'Monthly Basic',
      duration_months: 1,
      price: 999,
      description: 'Access to gym floor and basic equipment. Perfect for beginners.',
      is_active: true,
    },
    {
      name: 'Quarterly Premium',
      duration_months: 3,
      price: 2499,
      description: 'Full gym access with cardio zone, weight training, and group classes.',
      is_active: true,
    },
    {
      name: 'Half Yearly Gold',
      duration_months: 6,
      price: 4499,
      description: 'Everything in Premium + personal trainer sessions twice a week.',
      is_active: true,
    },
    {
      name: 'Annual Platinum',
      duration_months: 12,
      price: 7999,
      description: 'All-inclusive access with unlimited personal training, diet plan, and spa.',
      is_active: true,
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
  const paymentStatuses = ['paid', 'paid', 'paid', 'pending', 'overdue'];
  const paymentMethods = ['cash', 'upi', 'card', 'bank_transfer'];

  const members = [];
  const payments = [];
  const now = new Date();

  for (let i = 0; i < 25; i += 1) {
    const plan = pick(plans);
    const fname = pick(firstNames);
    const lname = pick(lastNames);
    const joinDate = new Date(now.getTime() - randomInt(1, 300) * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(joinDate);
    expiryDate.setDate(expiryDate.getDate() + plan.duration_months * 30);
    const paymentStatus = pick(paymentStatuses);

    const member = new Member({
      full_name: `${fname} ${lname}`,
      mobile: `9${randomInt(100000000, 999999999)}`,
      email: `${fname.toLowerCase()}.${lname.toLowerCase()}${randomInt(1, 99)}@gmail.com`,
      address: pick(addresses),
      plan_id: plan._id,
      join_date: joinDate,
      expiry_date: expiryDate,
      payment_status: paymentStatus,
      amount_paid: paymentStatus === 'paid' ? plan.price : 0,
      created_at: joinDate,
      updated_at: joinDate,
    });
    members.push(member);

    if (paymentStatus === 'paid') {
      payments.push({
        member_id: member._id,
        amount: plan.price,
        plan_name: plan.name,
        payment_method: pick(paymentMethods),
        date: new Date(joinDate.getTime() + randomInt(0, 12) * 60 * 60 * 1000),
        notes: `Membership payment - ${plan.name}`,
      });
    }
  }

  await Member.insertMany(members);

  for (let i = 0; i < 40; i += 1) {
    const plan = pick(plans);
    const member = pick(members);
    payments.push({
      member_id: member._id,
      amount: plan.price,
      plan_name: plan.name,
      payment_method: pick(paymentMethods),
      date: new Date(now.getTime() - randomInt(1, 365) * 24 * 60 * 60 * 1000),
      notes: `Renewal payment - ${plan.name}`,
    });
  }

  await Payment.insertMany(payments);
  console.log('Database seeding complete');
}

module.exports = { seedDatabase };
