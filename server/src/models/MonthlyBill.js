const mongoose = require('mongoose');

const monthlyBillSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  billingMonth: {
    type: String, // format: "YYYY-MM", e.g. "2026-10"
    required: true
  },
  amountDue: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid', 'overdue'],
    default: 'unpaid'
  },
  dueDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

monthlyBillSchema.index({ customerId: 1, vehicleId: 1, billingMonth: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyBill', monthlyBillSchema);
