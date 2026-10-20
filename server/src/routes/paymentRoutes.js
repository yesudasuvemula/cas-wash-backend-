const express = require('express');
const router = express.Router();
const MonthlyBill = require('../models/MonthlyBill');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Subscription = require('../models/Subscription');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');

// Helper to determine status based on balance and due date
const evaluateBillStatus = (bill, dueDateEndDay = 5) => {
  if (bill.balance <= 0) return 'paid';
  if (bill.amountPaid > 0) return 'partially_paid';

  const now = new Date();
  const currentDay = now.getDate();
  const [bYear, bMonth] = bill.billingMonth.split('-').map(Number);
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  // If previous month or current month past the 5th
  if (bYear < nowYear || (bYear === nowYear && bMonth < nowMonth)) {
    return 'overdue';
  }
  if (bYear === nowYear && bMonth === nowMonth && currentDay > dueDateEndDay) {
    return 'overdue';
  }
  return 'unpaid';
};

// @route   GET /api/payments/bills
// @desc    Get monthly billing records with filters
router.get('/bills', protect, async (req, res) => {
  try {
    const { month, status, search, block } = req.query;
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let billFilter = { billingMonth: targetMonth };

    const bills = await MonthlyBill.find(billFilter)
      .populate('customerId')
      .populate('vehicleId')
      .sort({ createdAt: -1 });

    const settings = await Settings.findOne();
    const dueDayEnd = settings?.billingDueDayEnd || 5;

    let enriched = bills.map(bill => {
      const cust = bill.customerId || {};
      const veh = bill.vehicleId || {};
      const calculatedStatus = evaluateBillStatus(bill, dueDayEnd);

      return {
        _id: bill._id,
        customerId: cust._id,
        customerRefId: cust.customerId,
        customerName: cust.fullName || 'Unknown Customer',
        phone: cust.phone || '',
        apartmentCommunity: cust.apartmentCommunity || '',
        blockNumber: cust.blockNumber || '',
        flatNumber: cust.flatNumber || '',
        vehicleId: veh._id,
        vehicleNumber: veh.vehicleNumber || 'Unknown Vehicle',
        makeModel: veh.makeModel || '',
        sizeCategory: veh.sizeCategory || 'mediumCar',
        billingMonth: bill.billingMonth,
        amountDue: bill.amountDue,
        amountPaid: bill.amountPaid,
        balance: bill.balance,
        status: calculatedStatus,
        dueDate: bill.dueDate,
        notes: bill.notes,
        createdAt: bill.createdAt
      };
    });

    // Filter by block if supplied
    if (block && block !== 'all') {
      enriched = enriched.filter(b => b.blockNumber.toUpperCase() === block.toUpperCase());
    }

    // Filter by calculated status if supplied
    if (status && status !== 'all') {
      enriched = enriched.filter(b => b.status.toLowerCase() === status.toLowerCase());
    }

    // Filter by search
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      enriched = enriched.filter(b =>
        b.customerName.toLowerCase().includes(term) ||
        b.phone.toLowerCase().includes(term) ||
        b.vehicleNumber.toLowerCase().includes(term) ||
        b.blockNumber.toLowerCase().includes(term) ||
        b.flatNumber.toLowerCase().includes(term)
      );
    }

    // Calculate summaries for this target month
    const totalExpected = enriched.reduce((sum, b) => sum + b.amountDue, 0);
    const totalCollected = enriched.reduce((sum, b) => sum + b.amountPaid, 0);
    const totalOutstanding = enriched.reduce((sum, b) => sum + b.balance, 0);
    const paidCount = enriched.filter(b => b.status === 'paid').length;
    const unpaidCount = enriched.filter(b => b.status !== 'paid').length;
    const overdueCount = enriched.filter(b => b.status === 'overdue').length;

    res.json({
      success: true,
      billingMonth: targetMonth,
      summary: {
        totalExpected,
        totalCollected,
        totalOutstanding,
        paidCount,
        unpaidCount,
        overdueCount
      },
      count: enriched.length,
      bills: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/payments/record
// @desc    Record manual customer payment (Full or Partial)
router.post('/record', protect, async (req, res) => {
  try {
    const {
      customerId,
      vehicleId,
      billId,
      billingMonth,
      amountPaid,
      paymentMethod,
      transactionReference,
      notes,
      paymentDate
    } = req.body;

    if (!customerId || !amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide Customer ID and a valid payment amount.' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    let bill;
    if (billId) {
      bill = await MonthlyBill.findById(billId);
    } else if (billingMonth) {
      bill = await MonthlyBill.findOne({ customerId, billingMonth });
    }

    const payAmount = Number(amountPaid);

    let currentBillDue = bill ? bill.amountDue : payAmount;
    let newPaidTotal = bill ? bill.amountPaid + payAmount : payAmount;
    let newBalance = bill ? Math.max(0, bill.amountDue - newPaidTotal) : 0;

    let paymentStatus = 'Paid';
    if (newBalance > 0) {
      paymentStatus = 'Partially Paid';
    }

    // Create Payment transaction log
    const payment = await Payment.create({
      customerId: customer._id,
      vehicleId: vehicleId || (bill ? bill.vehicleId : null),
      billId: bill ? bill._id : null,
      billingMonth: billingMonth || (bill ? bill.billingMonth : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`),
      amountDue: currentBillDue,
      amountPaid: payAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'UPI',
      transactionReference: transactionReference || '',
      paymentStatus,
      notes: notes || ''
    });

    // Update the bill if exists
    if (bill) {
      bill.amountPaid = newPaidTotal;
      bill.balance = newBalance;
      bill.status = newBalance === 0 ? 'paid' : 'partially_paid';
      await bill.save();
    }

    // Auto-generate receipt and dispatch to customer's WhatsApp if requested or by default
    let receiptResult = null;
    let veh = null;
    if (vehicleId || bill?.vehicleId) {
      veh = await Vehicle.findById(vehicleId || bill.vehicleId);
    }
    const vehNumber = veh ? veh.vehicleNumber : (customer.vehicles?.[0]?.vehicleNumber || 'Registered Vehicle');
    const bMonth = billingMonth || (bill ? bill.billingMonth : 'Current Month');
    const pDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const refTxt = transactionReference ? ` (Ref: ${transactionReference})` : '';

    const receiptMessage = `*Payment Receipt - Elite Car Wash & Care*\n\nDear *${customer.fullName}*,\nThank you! We have received your payment of *₹${payAmount.toLocaleString('en-IN')}* via *${paymentMethod || 'Cash/UPI'}*${refTxt}.\n\n*Receipt Summary:*\n• Vehicle: *${vehNumber}*\n• Apartment: Block ${customer.blockNumber}, Flat ${customer.flatNumber}\n• Billing Month: ${bMonth}\n• Paid On: ${pDate}\n• Status: *${paymentStatus}* (Remaining Balance: ₹${newBalance})\n\nThank you for choosing our daily car wash subscription service!`;

    const { sendWhatsAppMessage } = require('../services/whatsappService');
    const ReminderLog = require('../models/ReminderLog');

    try {
      receiptResult = await sendWhatsAppMessage({
        toPhone: customer.phone,
        messageText: receiptMessage
      });

      await ReminderLog.create({
        customerId: customer._id,
        vehicleNumber: vehNumber,
        customerName: customer.fullName,
        phone: customer.phone,
        billingMonth: bMonth,
        amountDue: newBalance,
        message: receiptMessage,
        channel: receiptResult.mode === 'cloud_api' ? 'WhatsApp API' : 'WhatsApp Web Manual',
        status: receiptResult.status,
        responseDetails: receiptResult
      });
    } catch (wsErr) {
      console.error('Auto receipt sending error:', wsErr);
    }

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully!`,
      payment,
      bill,
      receiptResult,
      receiptMessage
    });
  } catch (error) {
    console.error('Payment record error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/payments/history
// @desc    Get all recorded payment history
router.get('/history', protect, async (req, res) => {
  try {
    const { month, method, customerId } = req.query;
    let filter = {};

    if (month && month !== 'all') {
      filter.billingMonth = month;
    }
    if (method && method !== 'all') {
      filter.paymentMethod = method;
    }
    if (customerId) {
      filter.customerId = customerId;
    }

    const payments = await Payment.find(filter)
      .populate('customerId')
      .populate('vehicleId')
      .sort({ paymentDate: -1 });

    const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    res.json({
      success: true,
      totalCollected,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/payments/generate-month-bills
// @desc    Generate monthly bills for all active subscriptions for a given month
router.post('/generate-month-bills', protect, async (req, res) => {
  try {
    const { billingMonth } = req.body;
    const now = new Date();
    const targetMonth = billingMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [year, monthNum] = targetMonth.split('-').map(Number);
    const settings = await Settings.findOne();
    const dueDay = settings?.billingDueDayEnd || 5;
    const dueDate = new Date(year, monthNum - 1, dueDay, 23, 59, 59);

    const activeSubs = await Subscription.find({ status: 'active' });
    let createdCount = 0;
    let existingCount = 0;

    for (const sub of activeSubs) {
      const existing = await MonthlyBill.findOne({
        customerId: sub.customerId,
        vehicleId: sub.vehicleId,
        billingMonth: targetMonth
      });

      if (!existing) {
        await MonthlyBill.create({
          customerId: sub.customerId,
          vehicleId: sub.vehicleId,
          subscriptionId: sub._id,
          billingMonth: targetMonth,
          amountDue: sub.monthlyPrice,
          amountPaid: 0,
          balance: sub.monthlyPrice,
          status: 'unpaid',
          dueDate
        });
        createdCount++;
      } else {
        existingCount++;
      }
    }

    res.json({
      success: true,
      message: `Generated bills for ${targetMonth}: ${createdCount} new, ${existingCount} already existed.`,
      createdCount,
      existingCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
