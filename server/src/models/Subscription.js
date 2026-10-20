const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
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
  planCategory: {
    type: String,
    enum: ['smallCar', 'mediumCar', 'largeCar', 'extraLargeCar'],
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'paused', 'cancelled'],
    default: 'active'
  },
  autoRenew: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

subscriptionSchema.index({ customerId: 1, vehicleId: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
