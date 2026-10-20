const User = require('../models/User');
const Settings = require('../models/Settings');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Subscription = require('../models/Subscription');
const MonthlyBill = require('../models/MonthlyBill');
const Payment = require('../models/Payment');
const WashRecord = require('../models/WashRecord');

const seedInitialData = async () => {
  try {
    // 1. Create default owner admin if none exists
    const adminExists = await User.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
    if (!adminExists) {
      await User.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@carwash.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        fullName: 'Rajesh Verma (Owner)',
        role: 'owner'
      });
      console.log('Default owner account created: admin / admin123');
    }

    // 2. Create default business settings if none exists
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        businessName: 'Elite Car Wash & Care',
        tagline: 'Premium Society Subscription Service',
        contactNumber: '+91 98450 12345',
        email: 'owner@elitecarwash.com',
        currency: '₹',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD-MM-YYYY',
        apartmentCommunity: 'Green Residency',
        categoryPricing: {
          smallCar: { label: 'Small Car (Hatchback)', price: 1000 },
          mediumCar: { label: 'Medium Car (Sedan/Compact SUV)', price: 1150 },
          largeCar: { label: 'Large Car (Mid/Full SUV)', price: 1230 },
          extraLargeCar: { label: 'Extra Large Car (Luxury/7-Seater)', price: 1350 }
        },
        billingDueDayStart: 1,
        billingDueDayEnd: 5
      });
      console.log('Default business settings created.');
    }

    // 3. Populate demo data if database has 0 customers
    const custCount = await Customer.countDocuments();
    if (custCount === 0) {
      console.log('Populating demo customers, vehicles, and subscriptions for Green Residency...');
      
      const sampleCustomers = [
        {
          customerId: 'CUST-0101',
          fullName: 'Ravi Kumar',
          phone: '+91 98765 11223',
          blockNumber: 'B',
          flatNumber: '204',
          vehicleNumber: 'AP 16 XX 1234',
          makeModel: 'Hyundai Creta',
          sizeCategory: 'mediumCar',
          price: 1150,
          paid: true
        },
        {
          customerId: 'CUST-0102',
          fullName: 'Sneha Sharma',
          phone: '+91 98123 44556',
          blockNumber: 'A',
          flatNumber: '402',
          vehicleNumber: 'TS 09 AB 5678',
          makeModel: 'Maruti Suzuki Swift',
          sizeCategory: 'smallCar',
          price: 1000,
          paid: false
        },
        {
          customerId: 'CUST-0103',
          fullName: 'Vikramaditya Rao',
          phone: '+91 99887 76655',
          blockNumber: 'C',
          flatNumber: '101',
          vehicleNumber: 'KA 03 MN 9900',
          makeModel: 'Toyota Fortuner',
          sizeCategory: 'extraLargeCar',
          price: 1350,
          paid: true
        },
        {
          customerId: 'CUST-0104',
          fullName: 'Pooja Iyer',
          phone: '+91 97654 32109',
          blockNumber: 'B',
          flatNumber: '506',
          vehicleNumber: 'MH 12 CD 3456',
          makeModel: 'Kia Seltos',
          sizeCategory: 'largeCar',
          price: 1230,
          paid: false
        },
        {
          customerId: 'CUST-0105',
          fullName: 'Amit Patel',
          phone: '+91 98989 12345',
          blockNumber: 'A',
          flatNumber: '108',
          vehicleNumber: 'DL 08 EF 7890',
          makeModel: 'Honda City',
          sizeCategory: 'mediumCar',
          price: 1150,
          paid: true
        }
      ];

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      for (let i = 0; i < sampleCustomers.length; i++) {
        const item = sampleCustomers[i];
        const cust = await Customer.create({
          customerId: item.customerId,
          fullName: item.fullName,
          phone: item.phone,
          apartmentCommunity: 'Green Residency',
          blockNumber: item.blockNumber,
          flatNumber: item.flatNumber
        });

        const veh = await Vehicle.create({
          vehicleNumber: item.vehicleNumber,
          makeModel: item.makeModel,
          sizeCategory: item.sizeCategory,
          customerId: cust._id
        });

        const sub = await Subscription.create({
          customerId: cust._id,
          vehicleId: veh._id,
          planCategory: item.sizeCategory,
          monthlyPrice: item.price,
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          expiryDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          status: 'active'
        });

        const dueDate = new Date(now.getFullYear(), now.getMonth(), 5, 23, 59, 59);
        const amountPaid = item.paid ? item.price : 0;
        const balance = item.paid ? 0 : item.price;
        const billStatus = item.paid ? 'paid' : (now.getDate() > 5 ? 'overdue' : 'unpaid');

        const bill = await MonthlyBill.create({
          customerId: cust._id,
          vehicleId: veh._id,
          subscriptionId: sub._id,
          billingMonth: currentMonth,
          amountDue: item.price,
          amountPaid,
          balance,
          status: billStatus,
          dueDate
        });

        if (item.paid) {
          await Payment.create({
            customerId: cust._id,
            vehicleId: veh._id,
            billId: bill._id,
            billingMonth: currentMonth,
            amountDue: item.price,
            amountPaid: item.price,
            paymentDate: new Date(now.getFullYear(), now.getMonth(), 3, 11, 30),
            paymentMethod: 'UPI',
            transactionReference: `UPI${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            paymentStatus: 'Paid',
            notes: 'Advance monthly subscription paid via GPay'
          });
        }

        // Add demo wash for first 3 customers today
        if (i < 3) {
          const washStatus = i === 0 ? 'Completed' : (i === 1 ? 'In Progress' : 'Completed');
          await WashRecord.create({
            washRecordId: `WASH-0050${i + 1}`,
            customerId: cust._id,
            vehicleId: veh._id,
            customerName: cust.fullName,
            phone: cust.phone,
            vehicleNumber: veh.vehicleNumber,
            blockNumber: cust.blockNumber,
            flatNumber: cust.flatNumber,
            apartmentCommunity: 'Green Residency',
            arrivalDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7 + i, 30),
            status: washStatus,
            completionDateTime: washStatus === 'Completed' ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7 + i, 55) : null,
            washDate: todayKey,
            whatsAppStatus: washStatus === 'Completed' ? 'Sent via API' : 'Not Sent'
          });
        }
      }
      console.log('Sample demo business records seeded successfully!');
    }
  } catch (err) {
    console.error('Data seeding error:', err);
  }
};

module.exports = { seedInitialData };
