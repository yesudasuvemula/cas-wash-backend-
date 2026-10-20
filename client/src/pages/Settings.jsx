import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Save, Shield, Smartphone, IndianRupee, MapPin, Check } from 'lucide-react';

export default function Settings() {
  const { settings, refreshSettings } = useAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    tagline: '',
    contactNumber: '',
    email: '',
    apartmentCommunity: 'Green Residency',
    billingDueDayStart: 1,
    billingDueDayEnd: 5,
    pricing: {
      smallCar: 1000,
      mediumCar: 1150,
      largeCar: 1230,
      extraLargeCar: 1350
    },
    whatsAppPhoneNumberId: '',
    whatsAppAccessToken: '',
    whatsAppBusinessAccountId: '',
    upiId: 'elitecarwash@upi',
    upiName: 'Elite Car Wash & Care'
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        businessName: settings.businessName || 'Elite Car Wash & Care',
        tagline: settings.tagline || 'Premium Daily Care & Society Subscriptions',
        contactNumber: settings.contactNumber || '+91 98765 43210',
        email: settings.email || 'contact@elitecarwash.com',
        apartmentCommunity: settings.apartmentCommunity || 'Green Residency',
        billingDueDayStart: settings.billingDueDayStart || 1,
        billingDueDayEnd: settings.billingDueDayEnd || 5,
        pricing: {
          smallCar: settings.categoryPricing?.smallCar?.price || 1000,
          mediumCar: settings.categoryPricing?.mediumCar?.price || 1150,
          largeCar: settings.categoryPricing?.largeCar?.price || 1230,
          extraLargeCar: settings.categoryPricing?.extraLargeCar?.price || 1350
        },
        whatsAppPhoneNumberId: settings.whatsAppConfig?.phoneNumberId || '',
        whatsAppAccessToken: settings.whatsAppConfig?.accessToken || '',
        whatsAppBusinessAccountId: settings.whatsAppConfig?.businessAccountId || '',
        upiId: settings.upiId || 'elitecarwash@upi',
        upiName: settings.upiName || 'Elite Car Wash & Care'
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.updateSettings({
        businessName: formData.businessName,
        tagline: formData.tagline,
        contactNumber: formData.contactNumber,
        email: formData.email,
        apartmentCommunity: formData.apartmentCommunity,
        billingDueDayStart: Number(formData.billingDueDayStart),
        billingDueDayEnd: Number(formData.billingDueDayEnd),
        categoryPricing: {
          smallCar: { label: 'Small Car', price: Number(formData.pricing.smallCar) },
          mediumCar: { label: 'Medium Car', price: Number(formData.pricing.mediumCar) },
          largeCar: { label: 'Large Car', price: Number(formData.pricing.largeCar) },
          extraLargeCar: { label: 'Extra Large Car', price: Number(formData.pricing.extraLargeCar) }
        },
        upiId: formData.upiId,
        upiName: formData.upiName,
        whatsAppConfig: {
          phoneNumberId: formData.whatsAppPhoneNumberId,
          accessToken: formData.whatsAppAccessToken,
          businessAccountId: formData.whatsAppBusinessAccountId
        }
      });
      await refreshSettings();
      setSuccessMsg('System configuration and subscription pricing updated successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px' }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px 28px',
        border: '1px solid #E2E8F0',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B132B' }}>
          Business & Society Configuration
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px' }}>
          Configure apartment community, monthly pricing matrix, and official WhatsApp Business Cloud API.
        </p>
      </div>

      {successMsg && (
        <div style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Card 1: Society & Business Details */}
        <div className="table-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#00B4D8" /> Apartment Community & Branding
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label>Business Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Apartment / Community Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.apartmentCommunity}
                onChange={(e) => setFormData({ ...formData, apartmentCommunity: e.target.value })}
                placeholder="e.g. Green Residency"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Owner Contact Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Owner Support Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Vehicle Pricing Matrix */}
        <div className="table-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IndianRupee size={20} color="#10B981" /> Monthly Subscription Pricing Matrix
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '16px' }}>
            Normal monthly daily car washing. Applied when new customers are registered.
          </p>

          <div className="grid-2">
            <div className="form-group">
              <label>Small Car (₹ / Month)</label>
              <input
                type="number"
                className="form-control"
                value={formData.pricing.smallCar}
                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, smallCar: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label>Medium Car (₹ / Month)</label>
              <input
                type="number"
                className="form-control"
                value={formData.pricing.mediumCar}
                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, mediumCar: e.target.value } })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Large Car (₹ / Month)</label>
              <input
                type="number"
                className="form-control"
                value={formData.pricing.largeCar}
                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, largeCar: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label>Extra Large Car (₹ / Month)</label>
              <input
                type="number"
                className="form-control"
                value={formData.pricing.extraLargeCar}
                onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, extraLargeCar: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* Card 3: WhatsApp Cloud API Integration */}
        <div className="table-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={20} color="#25D366" /> WhatsApp Business Cloud API Configuration
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '16px' }}>
            Optional. When configured, messages are dispatched automatically in the background via Meta Cloud API. Otherwise, system seamlessly uses pre-filled WhatsApp Web manual links.
          </p>

          <div className="form-group">
            <label>WhatsApp Phone Number ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 104523998812345"
              value={formData.whatsAppPhoneNumberId}
              onChange={(e) => setFormData({ ...formData, whatsAppPhoneNumberId: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Meta Cloud API Permanent Access Token</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter Meta Cloud access token"
              value={formData.whatsAppAccessToken}
              onChange={(e) => setFormData({ ...formData, whatsAppAccessToken: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
          style={{ padding: '12px 28px', fontSize: '0.95rem' }}
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
