import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  MessageSquare, Send, CheckCircle2, Clock, AlertTriangle, 
  Search, RefreshCw, ExternalLink, ShieldCheck, CheckSquare, Square
} from 'lucide-react';

export default function Reminders() {
  const [pendingList, setPendingList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'logs'

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [search, setSearch] = useState('');

  // Selected checkbox for bulk reminders
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const res = await api.getPendingReminders({ month: selectedMonth });
        if (res.success) {
          setPendingList(res.customers);
          setSelectedCustomerIds(res.customers.map(c => c.customerId)); // select all by default
        }
      } else {
        const res = await api.getReminderLogs({ month: selectedMonth });
        if (res.success) {
          setLogs(res.logs);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, activeTab]);

  const toggleSelectAll = () => {
    if (selectedCustomerIds.length === pendingList.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(pendingList.map(c => c.customerId));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedCustomerIds.includes(id)) {
      setSelectedCustomerIds(selectedCustomerIds.filter(item => item !== id));
    } else {
      setSelectedCustomerIds([...selectedCustomerIds, id]);
    }
  };

  const handleSendSingle = async (item) => {
    try {
      const res = await api.sendSingleReminder({
        customerId: item.customerId,
        vehicleNumber: item.vehicleNumber,
        phone: item.phone,
        customerName: item.customerName,
        billingMonth: item.billingMonth,
        amountDue: item.amountDue,
        message: item.reminderMessage
      });

      if (res.result?.webLink && res.result?.mode === 'manual_fallback') {
        window.open(res.result.webLink, '_blank');
      }
      alert(`Reminder processed for ${item.customerName}: ${res.message}`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendBulk = async () => {
    const selectedItems = pendingList.filter(item => selectedCustomerIds.includes(item.customerId));
    if (selectedItems.length === 0) {
      alert('Please select at least one customer to send reminders');
      return;
    }

    if (!window.confirm(`Send payment reminders to ${selectedItems.length} selected customer(s) for ${selectedMonth}?`)) {
      return;
    }

    setSendingBulk(true);
    setBulkResult(null);
    try {
      const res = await api.sendBulkReminders(selectedItems);
      setBulkResult(res);
      alert(res.message);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingBulk(false);
    }
  };

  const filteredPending = pendingList.filter(item => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (item.customerName || '').toLowerCase().includes(term) ||
      (item.phone || '').toLowerCase().includes(term) ||
      (item.vehicleNumber || '').toLowerCase().includes(term) ||
      (item.blockNumber || '').toLowerCase().includes(term) ||
      (item.flatNumber || '').toLowerCase().includes(term)
    );
  });

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
            Automated & Manual WhatsApp Payment Reminders
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px' }}>
            Target unpaid balances • Priority 1st-5th billing reminder cycle • Overdue alerts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'pending' && (
            <button
              onClick={handleSendBulk}
              disabled={sendingBulk || selectedCustomerIds.length === 0}
              className="btn-whatsapp"
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
            >
              <Send size={16} /> Send Reminders to Selected ({selectedCustomerIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.86rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'pending' ? '#0B132B' : '#E2E8F0',
            color: activeTab === 'pending' ? 'white' : '#475569'
          }}
        >
          Customers Needing Reminders ({pendingList.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.86rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'logs' ? '#0B132B' : '#E2E8F0',
            color: activeTab === 'logs' ? 'white' : '#475569'
          }}
        >
          Reminder Dispatch History
        </button>
      </div>

      {/* Content Table Card */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">
            <h3>{activeTab === 'pending' ? `Unpaid Accounts for ${selectedMonth}` : 'Sent Notification Logs'}</h3>
            <p>
              {activeTab === 'pending'
                ? 'Only customers with pending balance > ₹0 are displayed'
                : 'Recorded dispatches via official Meta Cloud API and WhatsApp Web'}
            </p>
          </div>

          <div className="table-controls">
            <div className="search-input-box">
              <Search size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search Flat, Block, Name, Phone..."
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

            <button onClick={loadData} className="btn-secondary">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {activeTab === 'pending' ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedCustomerIds.length === pendingList.length && pendingList.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Apartment & Flat</th>
                  <th>Customer Name</th>
                  <th>Vehicle Number</th>
                  <th>Pending Balance</th>
                  <th>Message Preview</th>
                  <th>Last Reminder</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      Loading pending accounts...
                    </td>
                  </tr>
                ) : filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#10B981', fontWeight: 600 }}>
                      🎉 Excellent! All active customer accounts for {selectedMonth} are fully paid.
                    </td>
                  </tr>
                ) : (
                  filteredPending.map((item) => {
                    const isChecked = selectedCustomerIds.includes(item.customerId);
                    return (
                      <tr key={item.billId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(item.customerId)}
                          />
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
                              Block {item.blockNumber}
                            </span>
                            <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.86rem' }}>
                              Flat {item.flatNumber}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600 }}>{item.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.phone}</div>
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
                            {item.vehicleNumber}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontWeight: 800, color: '#EF4444', fontSize: '0.92rem' }}>
                            ₹{item.amountDue.toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td style={{ maxWidth: '300px' }}>
                          <div style={{
                            fontSize: '0.74rem',
                            color: '#475569',
                            background: '#F8FAFC',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.reminderMessage}
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: '0.75rem', color: item.reminderCount > 0 ? '#10B981' : '#64748B' }}>
                            {item.reminderCount > 0 ? `${item.reminderCount} sent` : 'None sent yet'}
                          </span>
                        </td>

                        <td>
                          <button
                            onClick={() => handleSendSingle(item)}
                            className="btn-whatsapp"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            Send
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Dispatch Time</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Vehicle Number</th>
                  <th>Amount Pending</th>
                  <th>Channel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No reminder logs recorded for {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td>{new Date(log.sentAt).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>{log.customerName}</td>
                      <td>{log.phone}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{log.vehicleNumber}</td>
                      <td style={{ fontWeight: 700, color: '#EF4444' }}>₹{log.amountDue}</td>
                      <td><span style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>{log.channel}</span></td>
                      <td>
                        <span className={`badge ${log.status === 'Sent via API' ? 'badge-paid' : 'badge-progress'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
