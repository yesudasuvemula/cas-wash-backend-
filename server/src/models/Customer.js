const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  apartmentCommunity: {
    type: String,
    required: true,
    trim: true,
    default: 'Green Residency'
  },
  blockNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  flatNumber: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

customerSchema.virtual('vehicles', {
  ref: 'Vehicle',
  localField: '_id',
  foreignField: 'customerId'
});

customerSchema.virtual('subscriptions', {
  ref: 'Subscription',
  localField: '_id',
  foreignField: 'customerId'
});

customerSchema.index({ fullName: 'text', phone: 'text', blockNumber: 'text', flatNumber: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
