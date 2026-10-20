import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Users, Plus, Search, Filter, Car, Phone, MapPin, 
  CheckCircle, AlertCircle, Trash2, Edit3, Eye, RefreshCw, X, FileText,
  IndianRupee, QrCode, Banknote, Send, Check
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);

  // Quick Payment Modal from Directory
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState(null);
  const [paymentType, setPaymentType] = useState('online'); // 'cash' or 'online'
  const [payAmount, setPayAmount] = useState('');
  const [txReference, setTxReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState('');
  const [receiptSuccess, setReceiptSuccess] = useState(null);

  // Business settings for UPI QR Code
  const [settings, setSettings] = useState(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    apartmentCommunity: 'Green Residency',
    blockNumber: '',
    flatNumber: '',
    vehicleNumber: '',
    makeModel: '',
    sizeCategory: 'mediumCar',
    customPrice: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.success) setSettings(res.settings);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({
        search,
        block: selectedBlock,
        status: selectedStatus,
        category: selectedCategory
      });
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [search, selectedBlock, selectedStatus, selectedCategory]);

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      phone: '+91 ',
      apartmentCommunity: settings?.apartmentCommunity || 'Green Residency',
      blockNumber: '',
      flatNumber: '',
      vehicleNumber: '',
      makeModel: '',
      sizeCategory: 'mediumCar',
      customPrice: '',
      notes: ''
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setSelectedCustomer(cust);
    setFormData({
      fullName: cust.fullName,
      phone: cust.phone,
      apartmentCommunity: cust.apartmentCommunity,
      blockNumber: cust.blockNumber,
      flatNumber: cust.flatNumber,
      vehicleNumber: cust.primaryVehicle?.vehicleNumber || '',
      makeModel: cust.primaryVehicle?.makeModel || '',
      sizeCategory: cust.primaryVehicle?.sizeCategory || 'mediumCar',
      customPrice: cust.subscriptionPrice || '',
      notes: cust.notes || ''
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenView = async (cust) => {
    setSelectedCustomer(cust);
    setIsViewModalOpen(true);
    try {
      const res = await api.getCustomerDetails(cust._id);
      if (res.success) {
        setCustomerDetails(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Collect Payment Modal directly from Directory
  const handleOpenCollectPayment = (cust) => {
    setPayingCustomer(cust);
    setPaymentType('online');
    setPayAmount(cust.subscriptionPrice || 1150);
    setTxReference('');
    setPayNotes('Prepaid monthly car wash subscription');
    setPayError('');
    setReceiptSuccess(null);
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!payingCustomer) return;
    setPaySubmitting(true);
    setPayError('');
    setReceiptSuccess(null);

    try {
      const res = await api.recordPayment({
        customerId: payingCustomer._id,
        vehicleId: payingCustomer.primaryVehicle?._id,
        billingMonth: payingCustomer.currentBillingMonth,
        amountPaid: Number(payAmount),
        paymentMethod: paymentType === 'cash' ? 'Cash' : 'UPI',
        transactionReference: paymentType === 'cash' ? 'CASH-COLLECTED' : txReference,
        notes: payNotes
      });

      setReceiptSuccess(res);
      loadCustomers();

      // If WhatsApp link fallback was returned, open immediately
      if (res.receiptResult?.webLink && res.receiptResult?.mode === 'manual_fallback') {
        window.open(res.receiptResult.webLink, '_blank');
      }
    } catch (err) {
      setPayError(err.message || 'Failed to record payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);
    try {
      await api.createCustomer(formData);
      setIsAddModalOpen(false);
      loadCustomers();
    } catch (err) {
      setFormError(err.message || 'Failed to create customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);
    try {
      await api.updateCustomer(selectedCustomer._id, formData);
      setIsEditModalOpen(false);
      loadCustomers();
    } catch (err) {
      setFormError(err.message || 'Failed to update customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (cust) => {
    if (window.confirm(`Are you sure you want to deactivate ${cust.fullName} (${cust.primaryVehicle?.vehicleNumber})?`)) {
      try {
        await api.deleteCustomer(cust._id);
        loadCustomers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Extract unique blocks for filter
  const blocks = Array.from(new Set(customers.map(c => c.blockNumber).filter(Boolean))).sort();

  // Generate UPI QR Code URL for dynamic amount and payee name
  const upiId = settings?.upiId || 'elitecarwash@upi';
  const upiPayee = encodeURIComponent(settings?.businessName || 'Elite Car Wash');
  const upiAmount = Number(payAmount) || 0;
  const upiUri = `upi://pay?pa=${upiId}&pn=${upiPayee}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(`Wash Fee Flat ${payingCustomer?.flatNumber || ''}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

  return (
    <div>
      {/* Top Header Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px 28px',
        border: '1px solid #E2E8F0',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0B132B' }}>
            Customers & Society Vehicles
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px' }}>
            Searchable by apartment block, flat number, owner name, phone number, and vehicle registration.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.88rem' }}
        >
          <Plus size={18} /> Register New Customer
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="table-card" style={{ marginBottom: '24px' }}>
        <div className="table-header-bar">
          <div className="table-title">
            <h3>Registered Community Directory</h3>
            <p>Showing {customers.length} vehicle(s) under monthly subscription</p>
          </div>

          <div className="table-controls">
            <div className="search-input-box">
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search Flat, Block, Reg #, Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="select-filter"
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
            >
              <option value="all">All Blocks</option>
              {blocks.map(b => (
                <option key={b} value={b}>Block {b}</option>
              ))}
            </select>

            <select
              className="select-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              className="select-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="smallCar">Small Car (₹1,000)</option>
              <option value="mediumCar">Medium Car (₹1,150)</option>
              <option value="largeCar">Large Car (₹1,230)</option>
              <option value="extraLargeCar">Extra Large (₹1,350)</option>
            </select>

            <button
              onClick={loadCustomers}
              className="btn-secondary"
              title="Refresh list"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Apartment & Flat</th>
                <th>Owner Details</th>
                <th>Vehicle Number</th>
                <th>Model / Category</th>
                <th>Monthly Fee</th>
                <th>Payment Status</th>
                <th>Collect Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    Loading customer profiles...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    No matching customer or vehicle found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0B132B' }}>{c.customerId}</span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          background: '#0B132B',
                          color: '#00B4D8',
                          fontWeight: 800,
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontSize: '0.74rem'
                        }}>
                          Block {c.blockNumber}
                        </span>
                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>
                          Flat {c.flatNumber}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{c.apartmentCommunity}</span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{c.fullName}</div>
                      <div style={{ fontSize: '0.76rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} /> {c.phone}
                      </div>
                    </td>

                    <td>
                      <span style={{
                        background: '#EEF2F6',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        color: '#0B132B',
                        letterSpacing: '0.5px'
                      }}>
                        {c.primaryVehicle?.vehicleNumber || 'No Vehicle'}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{c.primaryVehicle?.makeModel || '-'}</div>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'capitalize' }}>
                        {c.primaryVehicle?.sizeCategory?.replace('Car', ' Car') || '-'}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#0B132B' }}>
                        ₹{(c.subscriptionPrice || 0).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}> /mo</span>
                    </td>

                    <td>
                      <span className={`badge ${
                        c.paymentStatus === 'Paid' ? 'badge-paid' :
                        c.paymentStatus === 'Partially Paid' ? 'badge-partially-paid' :
                        c.paymentStatus === 'Overdue' ? 'badge-overdue' : 'badge-unpaid'
                      }`}>
                        {c.paymentStatus}
                      </span>
                    </td>

                    {/* Pay Button Option in Directory */}
                    <td>
                      <button
                        onClick={() => handleOpenCollectPayment(c)}
                        style={{
                          background: c.paymentStatus === 'Paid' ? '#ECFDF5' : 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                          color: c.paymentStatus === 'Paid' ? '#065F46' : 'white',
                          border: c.paymentStatus === 'Paid' ? '1px solid #A7F3D0' : 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: c.paymentStatus === 'Paid' ? 'none' : '0 2px 6px rgba(16, 185, 129, 0.25)'
                        }}
                      >
                        {c.paymentStatus === 'Paid' ? (
                          <>
                            <Check size={13} color="#059669" /> Renew / Pay
                          </>
                        ) : (
                          <>
                            <IndianRupee size={13} /> Collect Pay
                          </>
                        )}
                      </button>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenView(c)}
                          title="View Profile"
                          style={{ background: '#F1F5F9', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                          style={{ background: '#F1F5F9', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#2563EB' }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          title="Archive Customer"
                          style={{ background: '#FEF2F2', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal (Cash Option & Online UPI Scanner + Auto WhatsApp Receipt) */}
      {isPayModalOpen && payingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DEF7EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#03543F' }}>
                  <IndianRupee size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Collect Customer Payment</h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    {payingCustomer.fullName} • Flat {payingCustomer.flatNumber}, Block {payingCustomer.blockNumber}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {payError && (
                <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.84rem' }}>
                  {payError}
                </div>
              )}

              {receiptSuccess ? (
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Check size={32} />
                  </div>

                  <h3 style={{ fontSize: '1.2rem', color: '#065F46', fontWeight: 800 }}>Payment Recorded Successfully!</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '6px' }}>
                    Receipt of ₹{payAmount} has been generated.
                  </p>

                  <div style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'left',
                    margin: '20px 0',
                    fontSize: '0.82rem',
                    lineHeight: '1.5',
                    color: '#166534'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Send size={15} /> WhatsApp Auto-Receipt Dispatched to {payingCustomer.phone}:
                    </div>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: '0.8rem' }}>
                      {receiptSuccess.receiptMessage}
                    </pre>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {receiptSuccess.receiptResult?.webLink && (
                      <a
                        href={receiptSuccess.receiptResult.webLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-whatsapp"
                        style={{ padding: '9px 18px' }}
                      >
                        <Send size={15} /> Open in WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsPayModalOpen(false)}
                      className="btn-primary"
                      style={{ padding: '9px 20px' }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProcessPayment}>
                  {/* Vehicle & Fee Information Banner */}
                  <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Vehicle:</span>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0B132B' }}>
                          {payingCustomer.primaryVehicle?.vehicleNumber} ({payingCustomer.primaryVehicle?.makeModel})
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Monthly Price:</span>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10B981' }}>
                          ₹{(payingCustomer.subscriptionPrice || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Mode Selection: Cash vs Online Scanner */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
                      Select Payment Mode *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div
                        onClick={() => setPaymentType('online')}
                        style={{
                          border: paymentType === 'online' ? '2px solid #00B4D8' : '1.5px solid #E2E8F0',
                          background: paymentType === 'online' ? '#F0F9FF' : 'white',
                          borderRadius: '12px',
                          padding: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: paymentType === 'online' ? '#00B4D8' : '#F1F5F9',
                          color: paymentType === 'online' ? 'white' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <QrCode size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0B132B' }}>Online / UPI</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Show Live QR Scanner</div>
                        </div>
                      </div>

                      <div
                        onClick={() => setPaymentType('cash')}
                        style={{
                          border: paymentType === 'cash' ? '2px solid #10B981' : '1.5px solid #E2E8F0',
                          background: paymentType === 'cash' ? '#ECFDF5' : 'white',
                          borderRadius: '12px',
                          padding: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: paymentType === 'cash' ? '#10B981' : '#F1F5F9',
                          color: paymentType === 'cash' ? 'white' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Banknote size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0B132B' }}>Cash Payment</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Direct Cash Receipt</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* If Online, Display Interactive QR Scanner */}
                  {paymentType === 'online' && (
                    <div style={{
                      background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2F6 100%)',
                      border: '1.5px dashed #00B4D8',
                      borderRadius: '16px',
                      padding: '20px',
                      textAlign: 'center',
                      marginBottom: '20px'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#0B132B',
                        color: '#00B4D8',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        marginBottom: '12px'
                      }}>
                        <QrCode size={13} /> Scan & Pay via GPay / PhonePe / Paytm / BHIM
                      </span>

                      <div style={{
                        width: '180px',
                        height: '180px',
                        margin: '0 auto 10px',
                        background: 'white',
                        padding: '10px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={qrCodeUrl}
                          alt="UPI Payment QR Code"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>

                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0B132B' }}>
                        Scan to Pay: ₹{Number(payAmount || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        UPI ID: <strong style={{ color: '#0077B6' }}>{upiId}</strong> ({settings?.businessName || 'Elite Car Wash'})
                      </div>
                    </div>
                  )}

                  {/* Cash Notice */}
                  {paymentType === 'cash' && (
                    <div style={{
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Banknote size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#065F46' }}>Cash Collection Mode</div>
                        <div style={{ fontSize: '0.74rem', color: '#047857' }}>
                          Physical cash received from customer. System will generate and auto-send the official payment receipt to WhatsApp.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid-2">
                    <div className="form-group">
                      <label>Amount Collected (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="form-control"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>{paymentType === 'cash' ? 'Receipt Memo' : 'UTR / Transaction Ref'}</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={paymentType === 'cash' ? 'e.g. Received in hand' : 'e.g. UPI-1234567890'}
                        value={txReference}
                        onChange={(e) => setTxReference(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Payment Notes</label>
                    <input
                      type="text"
                      className="form-control"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                    />
                  </div>

                  {/* Auto WhatsApp Alert Info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    color: '#15803D',
                    marginBottom: '20px'
                  }}>
                    <Send size={14} />
                    <span>
                      An automated digital receipt will be dispatched immediately to customer WhatsApp: <strong>{payingCustomer.phone}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsPayModalOpen(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={paySubmitting}
                      className="btn-emerald"
                      style={{ padding: '10px 22px', fontSize: '0.88rem' }}
                    >
                      {paySubmitting ? 'Recording & Sending Receipt...' : `Confirm ${paymentType === 'cash' ? 'Cash' : 'Online'} Pay & Send Receipt`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Customer & Vehicle</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="modal-body">
              {formError && (
                <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.84rem' }}>
                  {formError}
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label>Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Ravi Kumar"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#0B132B', marginBottom: '10px' }}>
                  Apartment / Society Details
                </h4>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Block (Name or Letter) *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. B or Tower 2"
                      value={formData.blockNumber}
                      onChange={(e) => setFormData({ ...formData, blockNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Flat Number *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. 204"
                      value={formData.flatNumber}
                      onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#0B132B', marginBottom: '10px' }}>
                  Vehicle & Monthly Subscription
                </h4>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Vehicle Reg Number *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. AP 16 XX 1234"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Make & Model *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Hyundai Creta"
                      value={formData.makeModel}
                      onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Size Category</label>
                    <select
                      className="form-control"
                      value={formData.sizeCategory}
                      onChange={(e) => setFormData({ ...formData, sizeCategory: e.target.value })}
                    >
                      <option value="smallCar">Small Car (₹1,000/mo)</option>
                      <option value="mediumCar">Medium Car (₹1,150/mo)</option>
                      <option value="largeCar">Large Car (₹1,230/mo)</option>
                      <option value="extraLargeCar">Extra Large (₹1,350/mo)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Custom Price Override (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Leave empty for default"
                      value={formData.customPrice}
                      onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary"
                >
                  {formSubmitting ? 'Registering...' : 'Save & Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Customer & Vehicle Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body">
              {formError && (
                <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.84rem' }}>
                  {formError}
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label>Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Block Number</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.blockNumber}
                    onChange={(e) => setFormData({ ...formData, blockNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Flat Number</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.flatNumber}
                    onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Vehicle Reg Number</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label>Make & Model</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.makeModel}
                    onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Size Category</label>
                <select
                  className="form-control"
                  value={formData.sizeCategory}
                  onChange={(e) => setFormData({ ...formData, sizeCategory: e.target.value })}
                >
                  <option value="smallCar">Small Car (₹1,000/mo)</option>
                  <option value="mediumCar">Medium Car (₹1,150/mo)</option>
                  <option value="largeCar">Large Car (₹1,230/mo)</option>
                  <option value="extraLargeCar">Extra Large (₹1,350/mo)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary"
                >
                  {formSubmitting ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Full Profile Modal */}
      {isViewModalOpen && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3>{selectedCustomer.fullName}</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {selectedCustomer.customerId} • Block {selectedCustomer.blockNumber}, Flat {selectedCustomer.flatNumber}
                </p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Vehicle Badge Banner */}
              <div style={{ background: '#0B132B', color: 'white', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#00B4D8', textTransform: 'uppercase', fontWeight: 700 }}>Primary Vehicle</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                    {selectedCustomer.primaryVehicle?.vehicleNumber}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                    {selectedCustomer.primaryVehicle?.makeModel} ({selectedCustomer.primaryVehicle?.sizeCategory})
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Monthly Subscription</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981' }}>
                    ₹{(selectedCustomer.subscriptionPrice || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Tabs for Wash History & Payment History */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                Recent Wash History
              </h4>
              <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                {customerDetails?.washes?.length > 0 ? (
                  <table style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th>WhatsApp Notification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDetails.washes.slice(0, 5).map(w => (
                        <tr key={w._id}>
                          <td>{new Date(w.arrivalDateTime).toLocaleString('en-IN')}</td>
                          <td><span className={`badge ${w.status === 'Completed' ? 'badge-completed' : 'badge-progress'}`}>{w.status}</span></td>
                          <td>{w.whatsAppStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>No washes recorded yet</div>
                )}
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                Payment History
              </h4>
              <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                {customerDetails?.payments?.length > 0 ? (
                  <table style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Month</th>
                        <th>Amount Paid</th>
                        <th>Method</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDetails.payments.slice(0, 5).map(p => (
                        <tr key={p._id}>
                          <td>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                          <td>{p.billingMonth}</td>
                          <td style={{ fontWeight: 700, color: '#10B981' }}>₹{p.amountPaid}</td>
                          <td>{p.paymentMethod}</td>
                          <td style={{ fontFamily: 'monospace' }}>{p.transactionReference || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>No payment records found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
