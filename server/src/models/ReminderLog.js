const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  billingMonth: {
    type: String, // e.g. "2026-10"
    required: true
  },
  amountDue: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['WhatsApp API', 'WhatsApp Web Manual', 'SMS'],
    default: 'WhatsApp API'
  },
  status: {
    type: String,
    enum: ['Pending', 'Sent via API', 'Link Opened', 'Delivered', 'Failed'],
    default: 'Pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  responseDetails: {
    type: Object
  }
}, {
  timestamps: true
});

reminderLogSchema.index({ customerId: 1, billingMonth: 1 });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
