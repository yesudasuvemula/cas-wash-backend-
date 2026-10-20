const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MonthlyBill'
  },
  billingMonth: {
    type: String, // e.g. "2026-10"
    required: true
  },
  amountDue: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Cash', 'Bank Transfer', 'Cheque', 'Other'],
    default: 'UPI'
  },
  transactionReference: {
    type: String,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Unpaid', 'Overdue'],
    default: 'Paid'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
