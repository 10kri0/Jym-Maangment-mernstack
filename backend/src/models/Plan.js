const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    duration_months: { type: Number, required: true, min: 1, max: 24 },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

planSchema.index({ name: 1, admin_id: 1 }, { unique: true });

module.exports = mongoose.model('Plan', planSchema);
