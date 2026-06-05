const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  plan_name: { type: String, required: true },
  payment_method: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'other'],
    default: 'cash',
  },
  date: { type: Date, default: Date.now, index: true },
  notes: { type: String, default: null },
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
});

module.exports = mongoose.model('Payment', paymentSchema);
