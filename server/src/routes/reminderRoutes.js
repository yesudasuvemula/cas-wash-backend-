const express = require('express');
const router = express.Router();
const MonthlyBill = require('../models/MonthlyBill');
const Customer = require('../models/Customer');
const ReminderLog = require('../models/ReminderLog');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');
const { sendWhatsAppMessage } = require('../services/whatsappService');

// @route   GET /api/reminders/pending
// @desc    Get list of unpaid customers needing payment reminders for a month
router.get('/pending', protect, async (req, res) => {
  try {
    const { month } = req.query;
    const now = new Date();
    const billingMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Find unpaid or partially paid bills for this month
    const unpaidBills = await MonthlyBill.find({
      billingMonth,
      balance: { $gt: 0 }
    }).populate('customerId').populate('vehicleId');

    // Get previous reminder logs for this month to avoid duplicates
    const reminderLogs = await ReminderLog.find({ billingMonth });

    const list = unpaidBills.map(bill => {
      const cust = bill.customerId || {};
      const veh = bill.vehicleId || {};

      const existingReminders = reminderLogs.filter(
        r => r.customerId && r.customerId.toString() === cust._id?.toString()
      );

      const reminderTemplate = `Hello ${cust.fullName || 'Customer'}, this is a friendly reminder that your monthly car wash subscription payment of ₹${bill.balance} for vehicle ${veh.vehicleNumber || ''} (Flat ${cust.flatNumber || ''}, Block ${cust.blockNumber || ''}) is pending for ${billingMonth}. Please complete your payment by the 5th. Thank you!`;

      return {
        billId: bill._id,
        customerId: cust._id,
        customerName: cust.fullName,
        phone: cust.phone,
        apartmentCommunity: cust.apartmentCommunity,
        blockNumber: cust.blockNumber,
        flatNumber: cust.flatNumber,
        vehicleNumber: veh.vehicleNumber,
        billingMonth,
        amountDue: bill.balance,
        totalSubscriptionAmount: bill.amountDue,
        reminderMessage: reminderTemplate,
        reminderCount: existingReminders.length,
        lastReminderSentAt: existingReminders[0]?.sentAt || null,
        lastReminderStatus: existingReminders[0]?.status || 'Not Sent'
      };
    });

    res.json({
      success: true,
      billingMonth,
      totalPending: list.length,
      customers: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/reminders/send-single
// @desc    Send payment reminder to a single customer
router.post('/send-single', protect, async (req, res) => {
  try {
    const { customerId, vehicleNumber, phone, customerName, billingMonth, amountDue, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message are required' });
    }

    const result = await sendWhatsAppMessage({
      toPhone: phone,
      messageText: message
    });

    const log = await ReminderLog.create({
      customerId,
      vehicleNumber: vehicleNumber || 'N/A',
      customerName: customerName || 'Customer',
      phone,
      billingMonth: billingMonth || 'Current',
      amountDue: Number(amountDue) || 0,
      message,
      channel: result.mode === 'cloud_api' ? 'WhatsApp API' : 'WhatsApp Web Manual',
      status: result.status,
      responseDetails: result
    });

    res.json({
      success: true,
      message: result.mode === 'cloud_api' ? 'Reminder sent via WhatsApp API' : 'WhatsApp web link generated',
      result,
      log
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/reminders/send-bulk
// @desc    Send reminders to selected customers
router.post('/send-bulk', protect, async (req, res) => {
  try {
    const { reminders } = req.body; // array of reminder objects

    if (!Array.isArray(reminders) || reminders.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipients selected for reminders' });
    }

    const results = [];
    for (const item of reminders) {
      try {
        const sendResult = await sendWhatsAppMessage({
          toPhone: item.phone,
          messageText: item.reminderMessage
        });

        const log = await ReminderLog.create({
          customerId: item.customerId,
          vehicleNumber: item.vehicleNumber,
          customerName: item.customerName,
          phone: item.phone,
          billingMonth: item.billingMonth,
          amountDue: item.amountDue,
          message: item.reminderMessage,
          channel: sendResult.mode === 'cloud_api' ? 'WhatsApp API' : 'WhatsApp Web Manual',
          status: sendResult.status,
          responseDetails: sendResult
        });

        results.push({ customerName: item.customerName, status: sendResult.status, logId: log._id, webLink: sendResult.webLink });
      } catch (err) {
        results.push({ customerName: item.customerName, status: 'Failed', error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Processed reminders for ${results.length} customer(s)`,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/reminders/logs
// @desc    Get reminder notification history
router.get('/logs', protect, async (req, res) => {
  try {
    const { month, channel, status } = req.query;
    let query = {};
    if (month && month !== 'all') query.billingMonth = month;
    if (channel && channel !== 'all') query.channel = channel;
    if (status && status !== 'all') query.status = status;

    const logs = await ReminderLog.find(query).sort({ sentAt: -1 }).limit(100);

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
