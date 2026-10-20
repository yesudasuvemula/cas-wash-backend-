const cron = require('node-cron');
const MonthlyBill = require('../models/MonthlyBill');
const Subscription = require('../models/Subscription');
const Settings = require('../models/Settings');
const ReminderLog = require('../models/ReminderLog');
const { sendWhatsAppMessage } = require('./whatsappService');

const initScheduler = () => {
  // Cron schedule: Runs daily at 09:00 AM Kolkata time
  // Check for 1st of month: generate all subscription bills
  // Check between 1st and 5th: automated payment reminder checks
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON SCHEDULER] Daily 9:00 AM maintenance running...');
    try {
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // 1. On day 1 of month, auto-generate billing records for all active subscriptions
      if (currentDay === 1) {
        console.log(`[CRON] Generating new monthly bills for ${currentMonth}...`);
        const activeSubs = await Subscription.find({ status: 'active' });
        const settings = await Settings.findOne();
        const dueDay = settings?.billingDueDayEnd || 5;
        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay, 23, 59, 59);

        for (const sub of activeSubs) {
          const exists = await MonthlyBill.findOne({
            customerId: sub.customerId,
            vehicleId: sub.vehicleId,
            billingMonth: currentMonth
          });

          if (!exists) {
            await MonthlyBill.create({
              customerId: sub.customerId,
              vehicleId: sub.vehicleId,
              subscriptionId: sub._id,
              billingMonth: currentMonth,
              amountDue: sub.monthlyPrice,
              amountPaid: 0,
              balance: sub.monthlyPrice,
              status: 'unpaid',
              dueDate
            });
          }
        }
      }

      // 2. Between day 1 and day 5: check active WhatsApp API auto-reminders
      const settings = await Settings.findOne();
      if (settings?.whatsAppConfig?.isConfigured && currentDay >= 1 && currentDay <= 5) {
        console.log(`[CRON] Performing payment reminder check for month ${currentMonth}...`);
        const unpaidBills = await MonthlyBill.find({
          billingMonth: currentMonth,
          balance: { $gt: 0 }
        }).populate('customerId').populate('vehicleId');

        for (const bill of unpaidBills) {
          const cust = bill.customerId;
          const veh = bill.vehicleId;
          if (!cust || !veh) continue;

          // Check if already reminded in the last 2 days
          const recentLog = await ReminderLog.findOne({
            customerId: cust._id,
            billingMonth: currentMonth,
            sentAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
          });

          if (!recentLog) {
            const message = `Hello ${cust.fullName}, this is a friendly reminder that your monthly car wash subscription payment of ₹${bill.balance} for vehicle ${veh.vehicleNumber} (Flat ${cust.flatNumber}, Block ${cust.blockNumber}) is pending for ${currentMonth}. Please complete your payment by the 5th. Thank you!`;
            
            const result = await sendWhatsAppMessage({ toPhone: cust.phone, messageText: message });
            await ReminderLog.create({
              customerId: cust._id,
              vehicleNumber: veh.vehicleNumber,
              customerName: cust.fullName,
              phone: cust.phone,
              billingMonth: currentMonth,
              amountDue: bill.balance,
              message,
              channel: result.mode === 'cloud_api' ? 'WhatsApp API' : 'WhatsApp Web Manual',
              status: result.status,
              responseDetails: result
            });
          }
        }
      }
    } catch (err) {
      console.error('[CRON SCHEDULER ERROR]:', err);
    }
  });

  console.log('Automated monthly scheduler initialized');
};

module.exports = { initScheduler };
