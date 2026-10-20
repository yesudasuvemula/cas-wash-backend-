const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Subscription = require('../models/Subscription');
const MonthlyBill = require('../models/MonthlyBill');
const Payment = require('../models/Payment');
const WashRecord = require('../models/WashRecord');
const { protect } = require('../middleware/auth');

// @route   GET /api/reports/dashboard-stats
// @desc    Calculate all statistics for Page 1 Dashboard
router.get('/dashboard-stats', protect, async (req, res) => {
  try {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. TODAY'S STATS
    const todayWashes = await WashRecord.find({ washDate: todayKey });
    const completedWashesToday = todayWashes.filter(w => w.status === 'Completed').length;
    const pendingWashesToday = todayWashes.filter(w => w.status === 'In Progress').length;

    // Start & end of today for payments & new customers
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const newCustomersToday = await Customer.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const todayPayments = await Payment.find({
      paymentDate: { $gte: startOfToday, $lte: endOfToday }
    });
    const paymentsReceivedToday = todayPayments.reduce((acc, p) => acc + p.amountPaid, 0);

    // 2. CUSTOMER STATS
    const totalRegisteredCustomers = await Customer.countDocuments({ isActive: true });
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const expiredSubscriptions = await Subscription.countDocuments({ status: 'expired' });

    // Current month bills
    const currentBills = await MonthlyBill.find({ billingMonth: currentMonthKey });
    const pendingPaymentCustomersCount = currentBills.filter(b => b.balance > 0).length;

    // Renewals due within 7 days
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const renewalDueCount = await Subscription.countDocuments({
      status: 'active',
      expiryDate: { $lte: nextWeek }
    });

    // 3. MONTHLY FINANCIAL STATS
    // Income is strictly calculated from actual Payments recorded in current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyPayments = await Payment.find({
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const monthlyIncomeReceived = monthlyPayments.reduce((acc, p) => acc + p.amountPaid, 0);

    const expectedMonthlyIncome = currentBills.reduce((acc, b) => acc + b.amountDue, 0);
    const outstandingUnpaidAmount = currentBills.reduce((acc, b) => acc + b.balance, 0);

    const paidCustomersCount = currentBills.filter(b => b.balance === 0).length;
    const unpaidCustomersCount = currentBills.filter(b => b.balance > 0).length;

    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // 4. CHARTS DATA
    // A) Daily car wash activity (past 7 days)
    const past7DaysWashes = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayCount = await WashRecord.countDocuments({ washDate: dayKey, status: 'Completed' });
      past7DaysWashes.push({
        date: dayKey,
        day: dayName,
        completed: dayCount
      });
    }

    // B) Monthly income trends (past 6 months actual collected)
    const monthlyIncomeTrends = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mKey = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = mDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const mPayments = await Payment.find({ billingMonth: mKey });
      const collected = mPayments.reduce((acc, p) => acc + p.amountPaid, 0);

      const mBills = await MonthlyBill.find({ billingMonth: mKey });
      const expected = mBills.reduce((acc, b) => acc + b.amountDue, 0);

      monthlyIncomeTrends.push({
        monthKey: mKey,
        month: mLabel,
        collected,
        expected
      });
    }

    // C) Vehicle size distribution
    const vehicles = await Vehicle.find({ isActive: true });
    const sizeCounts = {
      smallCar: 0,
      mediumCar: 0,
      largeCar: 0,
      extraLargeCar: 0
    };
    vehicles.forEach(v => {
      if (sizeCounts[v.sizeCategory] !== undefined) {
        sizeCounts[v.sizeCategory]++;
      } else {
        sizeCounts.mediumCar++;
      }
    });

    const vehicleDistribution = [
      { name: 'Small Car', category: 'smallCar', count: sizeCounts.smallCar, color: '#3B82F6' },
      { name: 'Medium Car', category: 'mediumCar', count: sizeCounts.mediumCar, color: '#10B981' },
      { name: 'Large Car', category: 'largeCar', count: sizeCounts.largeCar, color: '#F59E0B' },
      { name: 'Extra Large Car', category: 'extraLargeCar', count: sizeCounts.extraLargeCar, color: '#8B5CF6' }
    ];

    res.json({
      success: true,
      currentDate: todayKey,
      currentMonth: currentMonthKey,
      stats: {
        today: {
          totalWashed: todayWashes.length,
          completed: completedWashesToday,
          pending: pendingWashesToday,
          newCustomers: newCustomersToday,
          paymentsReceived: paymentsReceivedToday
        },
        customers: {
          totalRegistered: totalRegisteredCustomers,
          activeSubscriptions,
          expiredSubscriptions,
          pendingPayments: pendingPaymentCustomersCount,
          renewalsDue: renewalDueCount
        },
        monthly: {
          incomeReceived: monthlyIncomeReceived,
          expectedIncome: expectedMonthlyIncome,
          outstandingBalance: outstandingUnpaidAmount,
          paidCustomers: paidCustomersCount,
          unpaidCustomers: unpaidCustomersCount,
          newCustomersThisMonth
        }
      },
      charts: {
        dailyWashes: past7DaysWashes,
        incomeTrends: monthlyIncomeTrends,
        vehicleDistribution,
        paidVsUnpaid: [
          { name: 'Paid', value: paidCustomersCount, color: '#10B981' },
          { name: 'Unpaid / Overdue', value: unpaidCustomersCount, color: '#EF4444' }
        ]
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/reports/export-csv
// @desc    Export tabular reports to CSV
router.get('/export-csv', protect, async (req, res) => {
  try {
    const { type, month } = req.query; // 'customers', 'payments', 'washes'
    const now = new Date();
    const currentMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let csvContent = '';
    let filename = `carwash_export_${type}_${currentMonth}.csv`;

    if (type === 'customers') {
      const customers = await Customer.find({ isActive: true });
      const customerIds = customers.map(c => c._id);
      const vehicles = await Vehicle.find({ customerId: { $in: customerIds } });
      const bills = await MonthlyBill.find({ billingMonth: currentMonth, customerId: { $in: customerIds } });

      csvContent = 'Customer ID,Full Name,Phone,Apartment,Block,Flat,Vehicle Number,Make Model,Category,Payment Status\n';
      customers.forEach(c => {
        const v = vehicles.find(veh => veh.customerId.toString() === c._id.toString()) || {};
        const b = bills.find(bill => bill.customerId.toString() === c._id.toString()) || {};
        const pStatus = b.balance === 0 ? 'Paid' : (b.balance < b.amountDue ? 'Partially Paid' : 'Unpaid');

        csvContent += `"${c.customerId}","${c.fullName}","${c.phone}","${c.apartmentCommunity}","${c.blockNumber}","${c.flatNumber}","${v.vehicleNumber || ''}","${v.makeModel || ''}","${v.sizeCategory || ''}","${pStatus}"\n`;
      });
    } else if (type === 'payments') {
      const payments = await Payment.find().populate('customerId').populate('vehicleId').sort({ paymentDate: -1 });
      csvContent = 'Payment ID,Customer Name,Phone,Block,Flat,Vehicle Number,Billing Month,Amount Due,Amount Paid,Payment Date,Method,Reference,Status\n';
      payments.forEach(p => {
        const c = p.customerId || {};
        const v = p.vehicleId || {};
        const pDate = new Date(p.paymentDate).toLocaleDateString('en-IN');
        csvContent += `"${p._id}","${c.fullName || ''}","${c.phone || ''}","${c.blockNumber || ''}","${c.flatNumber || ''}","${v.vehicleNumber || ''}","${p.billingMonth}","${p.amountDue}","${p.amountPaid}","${pDate}","${p.paymentMethod}","${p.transactionReference}","${p.paymentStatus}"\n`;
      });
    } else {
      // Daily Washes
      const washes = await WashRecord.find().sort({ arrivalDateTime: -1 });
      csvContent = 'Wash ID,Customer Name,Phone,Block,Flat,Vehicle Number,Arrival Time,Completion Time,Status,WhatsApp Status\n';
      washes.forEach(w => {
        const arrival = new Date(w.arrivalDateTime).toLocaleString('en-IN');
        const completed = w.completionDateTime ? new Date(w.completionDateTime).toLocaleString('en-IN') : 'N/A';
        csvContent += `"${w.washRecordId}","${w.customerName}","${w.phone}","${w.blockNumber}","${w.flatNumber}","${w.vehicleNumber}","${arrival}","${completed}","${w.status}","${w.whatsAppStatus}"\n`;
      });
    }

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    return res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
