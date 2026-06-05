const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, minlength: 2, maxlength: 100 },
    mobile: { type: String, required: true, minlength: 10, maxlength: 15, index: true },
    email: { type: String, default: null, sparse: true, lowercase: true, trim: true },
    address: { type: String, default: null, maxlength: 300 },
    branch: { type: String, default: null, enum: ['Eru', 'Motobajr', null] },
    plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    join_date: { type: Date, required: true },
    expiry_date: { type: Date, required: true, index: true },
    payment_status: {
      type: String,
      enum: ['completed', 'pending'],
      default: 'pending',
      index: true,
    },
    amount_paid: { type: Number, default: 0 },
    notes: { type: String, default: null },
    alert_dismissed_at: { type: Date, default: null },
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Member', memberSchema);
