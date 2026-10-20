const mongoose = require('mongoose');

const washRecordSchema = new mongoose.Schema({
  washRecordId: {
    type: String,
    required: true,
    unique: true
  },
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
  customerName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  blockNumber: {
    type: String,
    required: true
  },
  flatNumber: {
    type: String,
    required: true
  },
  apartmentCommunity: {
    type: String,
    default: 'Green Residency'
  },
  arrivalDateTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Cancelled'],
    default: 'In Progress'
  },
  completionDateTime: {
    type: Date
  },
  washDate: {
    type: String, // format "YYYY-MM-DD" for easy unique daily indexing
    required: true
  },
  whatsAppStatus: {
    type: String,
    enum: ['Not Sent', 'Link Opened', 'Sent via API', 'Delivered', 'Failed'],
    default: 'Not Sent'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

washRecordSchema.index({ vehicleNumber: 1, washDate: 1 });

module.exports = mongoose.model('WashRecord', washRecordSchema);
