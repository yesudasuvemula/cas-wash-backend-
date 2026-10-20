const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  businessName: {
    type: String,
    default: 'Elite Car Wash & Care'
  },
  tagline: {
    type: String,
    default: 'Premium Daily Care & Society Subscriptions'
  },
  contactNumber: {
    type: String,
    default: '+91 98765 43210'
  },
  email: {
    type: String,
    default: 'contact@elitecarwash.com'
  },
  currency: {
    type: String,
    default: '₹'
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  dateFormat: {
    type: String,
    default: 'DD-MM-YYYY'
  },
  apartmentCommunity: {
    type: String,
    default: 'Green Residency'
  },
  categoryPricing: {
    smallCar: {
      label: { type: String, default: 'Small Car (Hatchback)' },
      price: { type: Number, default: 1000 }
    },
    mediumCar: {
      label: { type: String, default: 'Medium Car (Sedan/Compact SUV)' },
      price: { type: Number, default: 1150 }
    },
    largeCar: {
      label: { type: String, default: 'Large Car (Mid/Full SUV)' },
      price: { type: Number, default: 1230 }
    },
    extraLargeCar: {
      label: { type: String, default: 'Extra Large Car (Luxury/7-Seater/Truck)' },
      price: { type: Number, default: 1350 }
    }
  },
  billingDueDayStart: {
    type: Number,
    default: 1
  },
  billingDueDayEnd: {
    type: Number,
    default: 5
  },
  upiId: {
    type: String,
    default: 'elitecarwash@upi'
  },
  upiName: {
    type: String,
    default: 'Elite Car Wash & Care'
  },
  whatsAppConfig: {
    phoneNumberId: { type: String, default: '' },
    accessToken: { type: String, default: '' },
    businessAccountId: { type: String, default: '' },
    isConfigured: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
