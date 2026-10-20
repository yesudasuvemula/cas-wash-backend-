const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Subscription = require('../models/Subscription');
const MonthlyBill = require('../models/MonthlyBill');
const Payment = require('../models/Payment');
const WashRecord = require('../models/WashRecord');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');

// Helper to get price by category
const getPriceForCategory = (categoryPricing, category) => {
  if (categoryPricing && categoryPricing[category]) {
    return categoryPricing[category].price;
  }
  const defaults = {
    smallCar: 1000,
    mediumCar: 1150,
    largeCar: 1230,
    extraLargeCar: 1350
  };
  return defaults[category] || 1150;
};

// @route   GET /api/customers
// @desc    Get all customers with filter, search, vehicles, and subscriptions
router.get('/', protect, async (req, res) => {
  try {
    const { search, block, status, category } = req.query;
    let query = { isActive: true };

    if (block && block !== 'all') {
      query.blockNumber = block.toUpperCase();
    }

    let customers = await Customer.find(query).sort({ createdAt: -1 });

    // Fetch vehicles and subscriptions for each customer
    const customerIds = customers.map(c => c._id);
    const vehicles = await Vehicle.find({ customerId: { $in: customerIds }, isActive: true });
    const subscriptions = await Subscription.find({ customerId: { $in: customerIds } });
    const washes = await WashRecord.find({ customerId: { $in: customerIds } }).sort({ arrivalDateTime: -1 });
    
    // Get current month string
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentBills = await MonthlyBill.find({
      customerId: { $in: customerIds },
      billingMonth: currentMonth
    });

    let results = customers.map(cust => {
      const custVehicles = vehicles.filter(v => v.customerId.toString() === cust._id.toString());
      const custSubs = subscriptions.filter(s => s.customerId.toString() === cust._id.toString());
      const custWashes = washes.filter(w => w.customerId.toString() === cust._id.toString());
      const custBills = currentBills.filter(b => b.customerId.toString() === cust._id.toString());

      const primaryVehicle = custVehicles[0] || null;
      const primarySub = custSubs[0] || null;
      const primaryBill = custBills[0] || null;

      // Determine current payment status
      let paymentStatus = 'Unpaid';
      if (primaryBill) {
        if (primaryBill.status === 'paid') paymentStatus = 'Paid';
        else if (primaryBill.status === 'partially_paid') paymentStatus = 'Partially Paid';
        else if (primaryBill.status === 'overdue') paymentStatus = 'Overdue';
        else paymentStatus = 'Unpaid';
      }

      // Last wash date
      const lastWash = custWashes[0] ? custWashes[0].arrivalDateTime : null;
      const totalWashes = custWashes.length;

      return {
        _id: cust._id,
        customerId: cust.customerId,
        fullName: cust.fullName,
        phone: cust.phone,
        apartmentCommunity: cust.apartmentCommunity,
        blockNumber: cust.blockNumber,
        flatNumber: cust.flatNumber,
        notes: cust.notes,
        createdAt: cust.createdAt,
        vehicles: custVehicles,
        primaryVehicle,
        subscription: primarySub,
        subscriptionStatus: primarySub ? primarySub.status : 'inactive',
        subscriptionPrice: primarySub ? primarySub.monthlyPrice : (primaryVehicle ? getPriceForCategory(null, primaryVehicle.sizeCategory) : 0),
        subscriptionStartDate: primarySub ? primarySub.startDate : null,
        subscriptionExpiryDate: primarySub ? primarySub.expiryDate : null,
        currentBillingMonth: currentMonth,
        paymentStatus,
        lastWashDate: lastWash,
        totalWashesRecorded: totalWashes
      };
    });

    // Apply text search across customer name, phone, vehicle reg, block, flat
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      results = results.filter(c => {
        const nameMatch = (c.fullName || '').toLowerCase().includes(term);
        const phoneMatch = (c.phone || '').toLowerCase().includes(term);
        const blockMatch = (c.blockNumber || '').toLowerCase().includes(term);
        const flatMatch = (c.flatNumber || '').toLowerCase().includes(term);
        const vehicleMatch = c.vehicles.some(v => (v.vehicleNumber || '').toLowerCase().includes(term) || (v.makeModel || '').toLowerCase().includes(term));
        const custIdMatch = (c.customerId || '').toLowerCase().includes(term);
        return nameMatch || phoneMatch || blockMatch || flatMatch || vehicleMatch || custIdMatch;
      });
    }

    // Filter by payment status if provided
    if (status && status !== 'all') {
      results = results.filter(c => c.paymentStatus.toLowerCase() === status.toLowerCase());
    }

    // Filter by vehicle category if provided
    if (category && category !== 'all') {
      results = results.filter(c => c.primaryVehicle && c.primaryVehicle.sizeCategory === category);
    }

    res.json({ success: true, count: results.length, customers: results });
  } catch (error) {
    console.error('Customer fetch error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer profile with full vehicle, wash & payment history
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const vehicles = await Vehicle.find({ customerId: customer._id });
    const subscriptions = await Subscription.find({ customerId: customer._id });
    const payments = await Payment.find({ customerId: customer._id }).sort({ paymentDate: -1 });
    const bills = await MonthlyBill.find({ customerId: customer._id }).sort({ billingMonth: -1 });
    const washes = await WashRecord.find({ customerId: customer._id }).sort({ arrivalDateTime: -1 });

    res.json({
      success: true,
      customer,
      vehicles,
      subscriptions,
      payments,
      bills,
      washes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/customers
// @desc    Add new customer + primary vehicle + auto create subscription & current monthly bill
router.post('/', protect, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      apartmentCommunity,
      blockNumber,
      flatNumber,
      vehicleNumber,
      makeModel,
      sizeCategory,
      notes,
      customPrice,
      startDate
    } = req.body;

    if (!fullName || !phone || !vehicleNumber || !makeModel || !blockNumber || !flatNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Customer Name, Phone, Block, Flat Number, Vehicle Number, and Make/Model'
      });
    }

    const cleanVehicleNumber = vehicleNumber.trim().toUpperCase();

    // Check duplicate vehicle registration
    const existingVehicle = await Vehicle.findOne({ vehicleNumber: cleanVehicleNumber, isActive: true });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: `Vehicle number ${cleanVehicleNumber} is already registered to another active profile!`
      });
    }

    // Fetch business settings for pricing
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});

    const category = sizeCategory || 'mediumCar';
    const finalMonthlyPrice = customPrice !== undefined && customPrice !== '' ? Number(customPrice) : getPriceForCategory(settings.categoryPricing, category);

    // Generate unique readable Customer ID
    const count = await Customer.countDocuments();
    const customerId = `CUST-${String(count + 101).padStart(4, '0')}`;

    // 1. Create Customer
    const customer = await Customer.create({
      customerId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      apartmentCommunity: apartmentCommunity || settings.apartmentCommunity || 'Green Residency',
      blockNumber: blockNumber.trim().toUpperCase(),
      flatNumber: flatNumber.trim(),
      notes: notes || ''
    });

    // 2. Create Vehicle
    const vehicle = await Vehicle.create({
      vehicleNumber: cleanVehicleNumber,
      makeModel: makeModel.trim(),
      sizeCategory: category,
      customerId: customer._id
    });

    // 3. Create Subscription
    const start = startDate ? new Date(startDate) : new Date();
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + 1);

    const subscription = await Subscription.create({
      customerId: customer._id,
      vehicleId: vehicle._id,
      planCategory: category,
      monthlyPrice: finalMonthlyPrice,
      startDate: start,
      expiryDate: expiry,
      status: 'active'
    });

    // 4. Create Current Monthly Billing Record
    const billingMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const dueDate = new Date(start.getFullYear(), start.getMonth(), settings.billingDueDayEnd || 5, 23, 59, 59);

    const bill = await MonthlyBill.create({
      customerId: customer._id,
      vehicleId: vehicle._id,
      subscriptionId: subscription._id,
      billingMonth,
      amountDue: finalMonthlyPrice,
      amountPaid: 0,
      balance: finalMonthlyPrice,
      status: 'unpaid',
      dueDate
    });

    res.status(201).json({
      success: true,
      message: 'Customer and vehicle registered successfully with subscription!',
      customer,
      vehicle,
      subscription,
      bill
    });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer and primary vehicle details
router.put('/:id', protect, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      apartmentCommunity,
      blockNumber,
      flatNumber,
      notes,
      vehicleNumber,
      makeModel,
      sizeCategory,
      customPrice
    } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (fullName) customer.fullName = fullName.trim();
    if (phone) customer.phone = phone.trim();
    if (apartmentCommunity) customer.apartmentCommunity = apartmentCommunity;
    if (blockNumber) customer.blockNumber = blockNumber.trim().toUpperCase();
    if (flatNumber) customer.flatNumber = flatNumber.trim();
    if (notes !== undefined) customer.notes = notes;
    await customer.save();

    // Update primary vehicle if provided
    let vehicle = await Vehicle.findOne({ customerId: customer._id });
    if (vehicle) {
      if (vehicleNumber) {
        const cleanNumber = vehicleNumber.trim().toUpperCase();
        // Check uniqueness if changed
        if (cleanNumber !== vehicle.vehicleNumber) {
          const exists = await Vehicle.findOne({ vehicleNumber: cleanNumber, _id: { $ne: vehicle._id } });
          if (exists) {
            return res.status(400).json({ success: false, message: `Vehicle number ${cleanNumber} is already used` });
          }
          vehicle.vehicleNumber = cleanNumber;
        }
      }
      if (makeModel) vehicle.makeModel = makeModel.trim();
      if (sizeCategory) vehicle.sizeCategory = sizeCategory;
      await vehicle.save();

      // Update active subscription pricing if sizeCategory changed
      if (sizeCategory || customPrice !== undefined) {
        let settings = await Settings.findOne();
        const price = customPrice !== undefined && customPrice !== '' ? Number(customPrice) : getPriceForCategory(settings?.categoryPricing, sizeCategory || vehicle.sizeCategory);
        await Subscription.updateMany(
          { customerId: customer._id, vehicleId: vehicle._id, status: 'active' },
          { planCategory: vehicle.sizeCategory, monthlyPrice: price }
        );
      }
    }

    res.json({
      success: true,
      message: 'Customer profile updated successfully',
      customer,
      vehicle
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Soft delete / deactivate customer
router.delete('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.isActive = false;
    await customer.save();

    await Vehicle.updateMany({ customerId: customer._id }, { isActive: false });
    await Subscription.updateMany({ customerId: customer._id }, { status: 'cancelled' });

    res.json({ success: true, message: 'Customer and vehicles successfully archived' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
