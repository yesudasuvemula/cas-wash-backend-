const express = require('express');
const router = express.Router();
const WashRecord = require('../models/WashRecord');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const ReminderLog = require('../models/ReminderLog');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');
const { sendWhatsAppMessage, formatPhoneNumber } = require('../services/whatsappService');

// Helper to get formatted date string YYYY-MM-DD
const getWashDateKey = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// @route   GET /api/washes
// @desc    Get daily wash records with date and status filters
router.get('/', protect, async (req, res) => {
  try {
    const { date, status, search, block } = req.query;
    const washDate = date || getWashDateKey();

    let query = { washDate };

    if (status && status !== 'all') {
      query.status = status;
    }

    let records = await WashRecord.find(query).sort({ arrivalDateTime: -1 });

    if (block && block !== 'all') {
      records = records.filter(r => r.blockNumber.toUpperCase() === block.toUpperCase());
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      records = records.filter(r =>
        r.customerName.toLowerCase().includes(term) ||
        r.phone.toLowerCase().includes(term) ||
        r.vehicleNumber.toLowerCase().includes(term) ||
        r.blockNumber.toLowerCase().includes(term) ||
        r.flatNumber.toLowerCase().includes(term)
      );
    }

    const totalToday = records.length;
    const completedToday = records.filter(r => r.status === 'Completed').length;
    const inProgressToday = records.filter(r => r.status === 'In Progress').length;

    res.json({
      success: true,
      washDate,
      summary: {
        totalToday,
        completedToday,
        inProgressToday
      },
      records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/washes
// @desc    Record customer vehicle arrival for car wash
router.post('/', protect, async (req, res) => {
  try {
    const { customerId, vehicleId, notes, forceDuplicate } = req.body;

    if (!customerId || !vehicleId) {
      return res.status(400).json({ success: false, message: 'Customer and vehicle are required' });
    }

    const customer = await Customer.findById(customerId);
    const vehicle = await Vehicle.findById(vehicleId);

    if (!customer || !vehicle) {
      return res.status(404).json({ success: false, message: 'Customer or Vehicle not found' });
    }

    const todayKey = getWashDateKey();

    // Check duplicate wash for today unless forceDuplicate confirmed
    if (!forceDuplicate) {
      const existingWash = await WashRecord.findOne({
        vehicleNumber: vehicle.vehicleNumber,
        washDate: todayKey
      });

      if (existingWash) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          message: `Vehicle ${vehicle.vehicleNumber} already has a wash record today (${existingWash.status})! Confirm if you want to record another wash.`
        });
      }
    }

    const count = await WashRecord.countDocuments();
    const washRecordId = `WASH-${String(count + 501).padStart(5, '0')}`;

    const washRecord = await WashRecord.create({
      washRecordId,
      customerId: customer._id,
      vehicleId: vehicle._id,
      customerName: customer.fullName,
      phone: customer.phone,
      vehicleNumber: vehicle.vehicleNumber,
      blockNumber: customer.blockNumber,
      flatNumber: customer.flatNumber,
      apartmentCommunity: customer.apartmentCommunity,
      arrivalDateTime: new Date(),
      status: 'In Progress',
      washDate: todayKey,
      whatsAppStatus: 'Not Sent',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: `Arrival recorded for ${vehicle.vehicleNumber} (Block ${customer.blockNumber} - Flat ${customer.flatNumber})`,
      washRecord
    });
  } catch (error) {
    console.error('Error recording wash:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/washes/:id/status
// @desc    Update wash status (e.g. In Progress -> Completed)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const wash = await WashRecord.findById(req.params.id);

    if (!wash) {
      return res.status(404).json({ success: false, message: 'Wash record not found' });
    }

    wash.status = status || 'Completed';
    if (wash.status === 'Completed') {
      wash.completionDateTime = new Date();
    }
    await wash.save();

    res.json({
      success: true,
      message: `Wash status updated to ${wash.status}`,
      wash
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/washes/:id/send-whatsapp
// @desc    Send WhatsApp wash completion message or generate prefilled link
router.post('/:id/send-whatsapp', protect, async (req, res) => {
  try {
    const wash = await WashRecord.findById(req.params.id);
    if (!wash) {
      return res.status(404).json({ success: false, message: 'Wash record not found' });
    }

    const messageText = `Hello ${wash.customerName}, your vehicle ${wash.vehicleNumber} (Flat ${wash.flatNumber}, Block ${wash.blockNumber}) has been washed successfully today. Thank you for choosing our car wash service!`;

    const result = await sendWhatsAppMessage({
      toPhone: wash.phone,
      messageText
    });

    wash.whatsAppStatus = result.status;
    await wash.save();

    // Log in reminders/notification logs
    await ReminderLog.create({
      customerId: wash.customerId,
      vehicleNumber: wash.vehicleNumber,
      customerName: wash.customerName,
      phone: wash.phone,
      billingMonth: wash.washDate,
      amountDue: 0,
      message: messageText,
      channel: result.mode === 'cloud_api' ? 'WhatsApp API' : 'WhatsApp Web Manual',
      status: result.status,
      responseDetails: result
    });

    res.json({
      success: true,
      result,
      wash
    });
  } catch (error) {
    console.error('Wash WhatsApp error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/washes/:id/mark-link-opened
// @desc    Update WhatsApp status when owner clicks manual link
router.put('/:id/mark-link-opened', protect, async (req, res) => {
  try {
    const wash = await WashRecord.findById(req.params.id);
    if (!wash) return res.status(404).json({ success: false, message: 'Record not found' });

    wash.whatsAppStatus = 'Link Opened';
    await wash.save();

    res.json({ success: true, wash });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
