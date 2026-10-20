const axios = require('axios');
const Settings = require('../models/Settings');

/**
 * Format phone number to international E.164 without '+' or spaces
 * Defaulting to India +91 if 10 digits
 */
const formatPhoneNumber = (phone) => {
  let cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Send WhatsApp text message via Meta Cloud API or return manual web link fallback
 */
const sendWhatsAppMessage = async ({ toPhone, messageText }) => {
  const settings = await Settings.findOne();
  const formattedPhone = formatPhoneNumber(toPhone);
  const encodedText = encodeURIComponent(messageText);
  const webLink = `https://wa.me/${formattedPhone}?text=${encodedText}`;

  const hasApiConfigured = settings &&
    settings.whatsAppConfig &&
    settings.whatsAppConfig.phoneNumberId &&
    settings.whatsAppConfig.accessToken;

  if (!hasApiConfigured) {
    return {
      success: true,
      mode: 'manual_fallback',
      status: 'Link Opened',
      webLink,
      message: 'WhatsApp Cloud API credentials not configured. Use manual WhatsApp Web/App launcher.'
    };
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${settings.whatsAppConfig.phoneNumberId}/messages`;
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { preview_url: false, body: messageText }
      },
      {
        headers: {
          Authorization: `Bearer ${settings.whatsAppConfig.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return {
      success: true,
      mode: 'cloud_api',
      status: 'Sent via API',
      data: response.data,
      webLink
    };
  } catch (error) {
    console.error('WhatsApp API Error:', error.response?.data || error.message);
    return {
      success: false,
      mode: 'fallback_error',
      status: 'Failed',
      error: error.response?.data?.error?.message || error.message,
      webLink,
      message: 'Failed to send via Meta Cloud API. Manual WhatsApp link is available.'
    };
  }
};

module.exports = {
  formatPhoneNumber,
  sendWhatsAppMessage
};
