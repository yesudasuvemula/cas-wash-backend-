import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  IndianRupee, Search, Filter, Calendar, CheckCircle2, AlertCircle, 
  Clock, Plus, RefreshCw, FileText, Download, ArrowUpRight, X,
  QrCode, Banknote, Send, Check
} from 'lucide-react';

export default function Payments() {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [search, setSearch] = useState('');

  // Payment Recording Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [activeBill, setActiveBill] = useState(null);
  const [paymentType, setPaymentType] = useState('online'); // 'cash' or 'online'
  const [payAmount, setPayAmount] = useState('');
  const [txRef, setTxRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState('');
  const [receiptSuccess, setReceiptSuccess] = useState(null);

  // History Tab toggle
  const [viewTab, setViewTab] = useState('bills'); // 'bills' or 'history'
  const [historyList, setHistoryList] = useState([]);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.success) setSettings(res.settings);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBills = async () => {
    try {
      setLoading(true);
      const res = await api.getBills({
        month: selectedMonth,
        status: selectedStatus,
        block: selectedBlock,
        search
      });
      if (res.success) {
        setBills(res.bills);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getPaymentHistory({ month: selectedMonth });
      if (res.success) {
        setHistoryList(res.payments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (viewTab === 'bills') {
      loadBills();
    } else {
      loadHistory();
    }
  }, [selectedMonth, selectedStatus, selectedBlock, search, viewTab]);

  const handleOpenPay = (bill) => {
    setActiveBill(bill);
    setPaymentType('online');
    setPayAmount(bill.balance || bill.amountDue);
    setTxRef('');
    setPayNotes('Monthly car wash subscription fee');
    setPayError('');
    setReceiptSuccess(null);
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setPayError('');
    setPaySubmitting(true);
    setReceiptSuccess(null);
    try {
      const res = await api.recordPayment({
        customerId: activeBill.customerId,
        vehicleId: activeBill.vehicleId,
        billId: activeBill._id,
        billingMonth: activeBill.billingMonth,
        amountPaid: Number(payAmount),
        paymentMethod: paymentType === 'cash' ? 'Cash' : 'UPI',
        transactionReference: paymentType === 'cash' ? 'CASH-COLLECTED' : txRef,
        notes: payNotes
      });
      setReceiptSuccess(res);
      loadBills();

      if (res.receiptResult?.webLink && res.receiptResult?.mode === 'manual_fallback') {
        window.open(res.receiptResult.webLink, '_blank');
      }
    } catch (err) {
      setPayError(err.message || 'Failed to record payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleExportCSV = (type) => {
    window.open(api.getExportUrl(type, selectedMonth), '_blank');
  };

  const handleGenerateBills = async () => {
    if (window.confirm(`Ensure all active vehicle subscriptions have monthly bills for ${selectedMonth}?`)) {
      try {
        const res = await api.generateMonthBills(selectedMonth);
        alert(res.message);
        loadBills();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const blocks = Array.from(new Set(bills.map(b => b.blockNumber).filter(Boolean))).sort();

  // Generate UPI QR Code URL for dynamic amount and payee name
  const upiId = settings?.upiId || 'elitecarwash@upi';
  const upiPayee = encodeURIComponent(settings?.businessName || 'Elite Car Wash');
  const upiAmount = Number(payAmount) || 0;
  const upiUri = `upi://pay?pa=${upiId}&pn=${upiPayee}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(`Wash Fee Flat ${activeBill?.flatNumber || ''}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;

  return (
    <div>
      {/* Top Banner Header */}
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
            Monthly Prepaid Subscriptions & Payments
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px' }}>
            Monthly advance collection (Due 1st - 5th) • Cash & Online UPI QR Scanner with Auto WhatsApp Receipt
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleExportCSV(viewTab === 'bills' ? 'customers' : 'payments')}
            className="btn-secondary"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={handleGenerateBills}
            className="btn-primary"
          >
            <Plus size={16} /> Issue Monthly Bills ({selectedMonth})
          </button>
        </div>
      </div>

      {/* Financial Summary Cards for Billing Month */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #00B4D8' }}>
          <div className="stat-card-info">
            <span>Expected Subscription Income</span>
            <h3>₹{(summary.totalExpected || 0).toLocaleString('en-IN')}</h3>
            <p>Bills issued for {selectedMonth}</p>
          </div>
          <div className="stat-icon cyan">
            <ArrowUpRight size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="stat-card-info">
            <span>Total Collected Amount</span>
            <h3 style={{ color: '#10B981' }}>₹{(summary.totalCollected || 0).toLocaleString('en-IN')}</h3>
            <p>{summary.paidCount || 0} customer(s) fully paid</p>
          </div>
          <div className="stat-icon emerald">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
          <div className="stat-card-info">
            <span>Outstanding Balance</span>
            <h3 style={{ color: '#EF4444' }}>₹{(summary.totalOutstanding || 0).toLocaleString('en-IN')}</h3>
            <p>{summary.overdueCount || 0} account(s) overdue after 5th</p>
          </div>
          <div className="stat-icon rose">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setViewTab('bills')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.86rem',
            border: 'none',
            cursor: 'pointer',
            background: viewTab === 'bills' ? '#0B132B' : '#E2E8F0',
            color: viewTab === 'bills' ? 'white' : '#475569'
          }}
        >
          Active Monthly Bills ({bills.length})
        </button>
        <button
          onClick={() => setViewTab('history')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.86rem',
            border: 'none',
            cursor: 'pointer',
            background: viewTab === 'history' ? '#0B132B' : '#E2E8F0',
            color: viewTab === 'history' ? 'white' : '#475569'
          }}
        >
          Payment Transactions Log
        </button>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">
            <h3>{viewTab === 'bills' ? `Billing Status for ${selectedMonth}` : 'Recorded Payment Receipts'}</h3>
            <p>{viewTab === 'bills' ? 'Subscriptions due between 1st & 5th' : 'Real-time verified cash and UPI payments'}</p>
          </div>

          <div className="table-controls">
            <div className="search-input-box">
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search Flat, Block, Vehicle, Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <input
              type="month"
              className="select-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />

            {viewTab === 'bills' && (
              <>
                <select
                  className="select-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid (1st-5th)</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue (After 5th)</option>
                </select>

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
              </>
            )}

            <button
              onClick={() => viewTab === 'bills' ? loadBills() : loadHistory()}
              className="btn-secondary"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {viewTab === 'bills' ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Apartment Details</th>
                  <th>Customer Name</th>
                  <th>Vehicle Number</th>
                  <th>Monthly Due</th>
                  <th>Amount Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      Loading billing records...
                    </td>
                  </tr>
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No bills found for {selectedMonth}. Click "Issue Monthly Bills" to generate bills.
                    </td>
                  </tr>
                ) : (
                  bills.map((b) => (
                    <tr key={b._id}>
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
                            Block {b.blockNumber}
                          </span>
                          <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.86rem' }}>
                            Flat {b.flatNumber}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{b.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{b.phone}</div>
                      </td>

                      <td>
                        <span style={{
                          background: '#EEF2F6',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.82rem'
                        }}>
                          {b.vehicleNumber}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700 }}>₹{(b.amountDue || 0).toLocaleString('en-IN')}</span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: '#10B981' }}>
                          ₹{(b.amountPaid || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: b.balance > 0 ? '#EF4444' : '#10B981' }}>
                          ₹{(b.balance || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${
                          b.status === 'paid' ? 'badge-paid' :
                          b.status === 'partially_paid' ? 'badge-partially-paid' :
                          b.status === 'overdue' ? 'badge-overdue' : 'badge-unpaid'
                        }`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td>
                        {b.balance > 0 ? (
                          <button
                            onClick={() => handleOpenPay(b)}
                            className="btn-emerald"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            <IndianRupee size={14} /> Record Pay
                          </button>
                        ) : (
                          <span style={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 700 }}>
                            ✓ Fully Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Flat / Block</th>
                  <th>Vehicle Number</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Reference / Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No payment transactions recorded for this filter.
                    </td>
                  </tr>
                ) : (
                  historyList.map((p) => (
                    <tr key={p._id}>
                      <td>{new Date(p.paymentDate).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>{p.customerId?.fullName || 'N/A'}</td>
                      <td>Block {p.customerId?.blockNumber || '-'}, Flat {p.customerId?.flatNumber || '-'}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.vehicleId?.vehicleNumber || '-'}</td>
                      <td>
                        <span style={{ fontWeight: 800, color: '#10B981', fontSize: '0.92rem' }}>
                          ₹{(p.amountPaid || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td><span style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>{p.paymentMethod}</span></td>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.transactionReference || '-'}</div>
                        {p.notes && <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{p.notes}</div>}
                      </td>
                      <td><span className="badge badge-paid">{p.paymentStatus}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal with Online Scanner & Cash mode + Auto WhatsApp Receipt */}
      {isPayModalOpen && activeBill && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#DEF7EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#03543F' }}>
                  <IndianRupee size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>Record Customer Payment</h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    {activeBill.customerName} • Block {activeBill.blockNumber}, Flat {activeBill.flatNumber}
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
                      <Send size={15} /> WhatsApp Auto-Receipt Dispatched to {activeBill.phone}:
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
                <form onSubmit={handlePaySubmit}>
                  {/* Bill Details Summary */}
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{activeBill.customerName}</span>
                      <span style={{ fontWeight: 700, color: '#00B4D8' }}>Block {activeBill.blockNumber} - Flat {activeBill.flatNumber}</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '10px' }}>
                      Vehicle: {activeBill.vehicleNumber} ({activeBill.makeModel}) • Billing Month: {activeBill.billingMonth}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Total Monthly Due</div>
                        <div style={{ fontWeight: 700 }}>₹{activeBill.amountDue}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Already Paid</div>
                        <div style={{ fontWeight: 700, color: '#10B981' }}>₹{activeBill.amountPaid}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Remaining Balance</div>
                        <div style={{ fontWeight: 800, color: '#EF4444' }}>₹{activeBill.balance}</div>
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
                      <label>Amount Received Now (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={activeBill.balance}
                        className="form-control"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Enter paid amount"
                      />
                    </div>

                    <div className="form-group">
                      <label>{paymentType === 'cash' ? 'Receipt Memo' : 'UTR / Transaction Ref'}</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={paymentType === 'cash' ? 'e.g. Received in cash' : 'e.g. UPI1234567890'}
                        value={txRef}
                        onChange={(e) => setTxRef(e.target.value)}
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
                      An automated digital receipt will be dispatched immediately to customer WhatsApp: <strong>{activeBill.phone}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
    </div>
  );
}
