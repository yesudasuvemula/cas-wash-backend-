const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');

// Get settings
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    // Mask sensitive access token when sending to frontend
    const sanitized = settings.toObject();
    if (sanitized.whatsAppConfig && sanitized.whatsAppConfig.accessToken) {
      sanitized.whatsAppConfig.accessToken = '********' + sanitized.whatsAppConfig.accessToken.slice(-4);
      sanitized.whatsAppConfig.isConfigured = true;
    }

    res.json({ success: true, settings: sanitized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update settings
router.put('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const {
      businessName,
      tagline,
      contactNumber,
      email,
      currency,
      timezone,
      dateFormat,
      apartmentCommunity,
      categoryPricing,
      billingDueDayStart,
      billingDueDayEnd,
      upiId,
      upiName,
      whatsAppConfig
    } = req.body;

    if (businessName) settings.businessName = businessName;
    if (tagline) settings.tagline = tagline;
    if (contactNumber) settings.contactNumber = contactNumber;
    if (email) settings.email = email;
    if (currency) settings.currency = currency;
    if (timezone) settings.timezone = timezone;
    if (dateFormat) settings.dateFormat = dateFormat;
    if (apartmentCommunity) settings.apartmentCommunity = apartmentCommunity;
    if (categoryPricing) settings.categoryPricing = categoryPricing;
    if (billingDueDayStart !== undefined) settings.billingDueDayStart = billingDueDayStart;
    if (billingDueDayEnd !== undefined) settings.billingDueDayEnd = billingDueDayEnd;
    if (upiId !== undefined) settings.upiId = upiId;
    if (upiName !== undefined) settings.upiName = upiName;

    if (whatsAppConfig) {
      if (whatsAppConfig.phoneNumberId) {
        settings.whatsAppConfig.phoneNumberId = whatsAppConfig.phoneNumberId;
      }
      if (whatsAppConfig.accessToken && !whatsAppConfig.accessToken.startsWith('********')) {
        settings.whatsAppConfig.accessToken = whatsAppConfig.accessToken;
      }
      if (whatsAppConfig.businessAccountId) {
        settings.whatsAppConfig.businessAccountId = whatsAppConfig.businessAccountId;
      }
      settings.whatsAppConfig.isConfigured = !!(settings.whatsAppConfig.phoneNumberId && settings.whatsAppConfig.accessToken);
    }

    await settings.save();

    const sanitized = settings.toObject();
    if (sanitized.whatsAppConfig && sanitized.whatsAppConfig.accessToken) {
      sanitized.whatsAppConfig.accessToken = '********' + sanitized.whatsAppConfig.accessToken.slice(-4);
    }

    res.json({ success: true, message: 'Settings saved successfully', settings: sanitized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
