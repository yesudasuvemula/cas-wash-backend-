const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  makeModel: {
    type: String,
    required: true,
    trim: true
  },
  sizeCategory: {
    type: String,
    required: true,
    enum: ['smallCar', 'mediumCar', 'largeCar', 'extraLargeCar'],
    default: 'mediumCar'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  color: {
    type: String,
    trim: true,
    default: ''
  },
  parkingSlot: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
