import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Car, CheckCircle2, Clock, Search, Send, ExternalLink, 
  RefreshCw, Plus, AlertTriangle, X, Check, MessageSquare
} from 'lucide-react';

export default function DailyWashes() {
  const [washes, setWashes] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  
  const todayKey = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [search, setSearch] = useState('');

  // Arrival Modal
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [arrivalSearch, setArrivalSearch] = useState('');
  const [selectedCustomerForWash, setSelectedCustomerForWash] = useState(null);
  const [arrivalNotes, setArrivalNotes] = useState('');
  const [arrivalSubmitting, setArrivalSubmitting] = useState(false);
  const [arrivalError, setArrivalError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // WhatsApp Message Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewWash, setPreviewWash] = useState(null);
  const [whatsappResult, setWhatsappResult] = useState(null);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

  const loadWashes = async () => {
    try {
      setLoading(true);
      const res = await api.getDailyWashes({
        date: selectedDate,
        status: selectedStatus,
        block: selectedBlock,
        search
      });
      if (res.success) {
        setWashes(res.records);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWashes();
  }, [selectedDate, selectedStatus, selectedBlock, search]);

  // Load customer options for arrival record
  const searchCustomersForArrival = async (term) => {
    try {
      const res = await api.getCustomers({ search: term });
      if (res.success) {
        setCustomerOptions(res.customers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenArrival = () => {
    setArrivalSearch('');
    setSelectedCustomerForWash(null);
    setArrivalNotes('');
    setArrivalError('');
    setDuplicateWarning(null);
    setIsArrivalModalOpen(true);
    searchCustomersForArrival('');
  };

  const handleRecordArrival = async (force = false) => {
    if (!selectedCustomerForWash) {
      setArrivalError('Please select a registered customer/vehicle');
      return;
    }

    setArrivalSubmitting(true);
    setArrivalError('');
    try {
      await api.recordWash({
        customerId: selectedCustomerForWash._id,
        vehicleId: selectedCustomerForWash.primaryVehicle?._id,
        notes: arrivalNotes,
        forceDuplicate: force
      });
      setIsArrivalModalOpen(false);
      loadWashes();
    } catch (err) {
      if (err.isDuplicate) {
        setDuplicateWarning(err.message);
      } else {
        setArrivalError(err.message || 'Failed to record wash arrival');
      }
    } finally {
      setArrivalSubmitting(false);
    }
  };

  const handleStatusChange = async (washId, newStatus) => {
    try {
      await api.updateWashStatus(washId, newStatus);
      loadWashes();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenWhatsappPreview = (wash) => {
    setPreviewWash(wash);
    setWhatsappResult(null);
    setPreviewModalOpen(true);
  };

  const handleSendWhatsapp = async () => {
    if (!previewWash) return;
    setSendingWhatsapp(true);
    try {
      const res = await api.sendWashWhatsApp(previewWash._id);
      setWhatsappResult(res.result);
      loadWashes();

      // If manual fallback, provide direct button or open
      if (res.result?.webLink && res.result?.mode === 'manual_fallback') {
        window.open(res.result.webLink, '_blank');
        await api.markWashLinkOpened(previewWash._id);
        loadWashes();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const blocks = Array.from(new Set(washes.map(w => w.blockNumber).filter(Boolean))).sort();

  return (
    <div>
      {/* Top Operational Header */}
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
            Daily Wash Bay Operations & WhatsApp
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', marginTop: '4px' }}>
            Record arriving vehicles • Update washing status • Instant WhatsApp notification
          </p>
        </div>

        <button
          onClick={handleOpenArrival}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '0.88rem' }}
        >
          <Car size={18} /> Record Vehicle Arrival
        </button>
      </div>

      {/* Daily Wash Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #00B4D8' }}>
          <div className="stat-card-info">
            <span>Vehicles Today</span>
            <h3>{summary.totalToday || 0}</h3>
            <p>Arrived on {selectedDate}</p>
          </div>
          <div className="stat-icon cyan">
            <Car size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="stat-card-info">
            <span>Washes Completed</span>
            <h3 style={{ color: '#10B981' }}>{summary.completedToday || 0}</h3>
            <p>Finished and notified</p>
          </div>
          <div className="stat-icon emerald">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div className="stat-card-info">
            <span>Currently Washing</span>
            <h3 style={{ color: '#F59E0B' }}>{summary.inProgressToday || 0}</h3>
            <p>In progress in bay</p>
          </div>
          <div className="stat-icon amber">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Main Operations Table */}
      <div className="table-card">
        <div className="table-header-bar">
          <div className="table-title">
            <h3>Wash Activity Log</h3>
            <p>Apartment block & flat identification for every vehicle</p>
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

            <input
              type="date"
              className="select-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <select
              className="select-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Wash Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
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

            <button
              onClick={loadWashes}
              className="btn-secondary"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Wash ID</th>
                <th>Apartment & Flat</th>
                <th>Customer Name</th>
                <th>Vehicle Number</th>
                <th>Arrival Time</th>
                <th>Wash Status</th>
                <th>Completion Time</th>
                <th>WhatsApp Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    Loading daily wash records...
                  </td>
                </tr>
              ) : washes.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                    No vehicle washes recorded for {selectedDate}. Click "Record Vehicle Arrival" to begin.
                  </td>
                </tr>
              ) : (
                washes.map((w) => (
                  <tr key={w._id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0B132B' }}>{w.washRecordId}</span>
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
                          Block {w.blockNumber}
                        </span>
                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.86rem' }}>
                          Flat {w.flatNumber}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{w.apartmentCommunity}</span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{w.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{w.phone}</div>
                    </td>

                    <td>
                      <span style={{
                        background: '#EEF2F6',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.84rem'
                      }}>
                        {w.vehicleNumber}
                      </span>
                    </td>

                    <td>
                      {new Date(w.arrivalDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td>
                      <select
                        value={w.status}
                        onChange={(e) => handleStatusChange(w._id, e.target.value)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '14px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                          background: w.status === 'Completed' ? '#DEF7EC' : '#FEF3C7',
                          color: w.status === 'Completed' ? '#03543F' : '#92400E'
                        }}
                      >
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    <td>
                      {w.completionDateTime ? (
                        new Date(w.completionDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span style={{ color: '#94A3B8' }}>-</span>
                      )}
                    </td>

                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: w.whatsAppStatus === 'Sent via API' ? '#10B981' :
                               w.whatsAppStatus === 'Link Opened' ? '#00B4D8' : '#64748B'
                      }}>
                        <MessageSquare size={12} /> {w.whatsAppStatus}
                      </span>
                    </td>

                    <td>
                      {w.status === 'Completed' ? (
                        <button
                          onClick={() => handleOpenWhatsappPreview(w)}
                          className="btn-whatsapp"
                          style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                        >
                          Send WhatsApp
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(w._id, 'Completed')}
                          className="btn-emerald"
                          style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Vehicle Arrival Modal */}
      {isArrivalModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Vehicle Arrival</h3>
              <button onClick={() => setIsArrivalModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {arrivalError && (
                <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.84rem' }}>
                  {arrivalError}
                </div>
              )}

              {duplicateWarning && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 700, marginBottom: '6px' }}>
                    <AlertTriangle size={18} color="#D97706" /> Duplicate Wash Confirmation
                  </div>
                  <p style={{ fontSize: '0.82rem', marginBottom: '10px' }}>{duplicateWarning}</p>
                  <button
                    type="button"
                    onClick={() => handleRecordArrival(true)}
                    className="btn-primary"
                    style={{ background: '#D97706', fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    Confirm & Record 2nd Wash Today
                  </button>
                </div>
              )}

              <div className="form-group">
                <label>Find Customer / Vehicle (By Flat, Block, Reg #, Name)</label>
                <div className="search-input-box" style={{ width: '100%', marginBottom: '12px' }}>
                  <Search size={16} color="#64748B" />
                  <input
                    type="text"
                    placeholder="Type flat number, vehicle number or customer name..."
                    value={arrivalSearch}
                    onChange={(e) => {
                      setArrivalSearch(e.target.value);
                      searchCustomersForArrival(e.target.value);
                    }}
                  />
                </div>
              </div>

              {/* Customer selection list */}
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '16px' }}>
                {customerOptions.map((cust) => {
                  const isSelected = selectedCustomerForWash?._id === cust._id;
                  return (
                    <div
                      key={cust._id}
                      onClick={() => setSelectedCustomerForWash(cust)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        background: isSelected ? '#EFF6FF' : 'white',
                        borderLeft: isSelected ? '4px solid #00B4D8' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{cust.fullName}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            <strong style={{ color: '#0B132B' }}>Block {cust.blockNumber} - Flat {cust.flatNumber}</strong> • {cust.phone}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ background: '#EEF2F6', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem' }}>
                            {cust.primaryVehicle?.vehicleNumber || 'No Reg'}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{cust.primaryVehicle?.makeModel}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedCustomerForWash && (
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>Selected Vehicle:</span>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0B132B' }}>
                    {selectedCustomerForWash.primaryVehicle?.vehicleNumber} • Flat {selectedCustomerForWash.flatNumber}, Block {selectedCustomerForWash.blockNumber}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Arrival Notes / Instructions</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Focus on tire gloss, normal exterior wash"
                  value={arrivalNotes}
                  onChange={(e) => setArrivalNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsArrivalModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRecordArrival(false)}
                  disabled={arrivalSubmitting || !selectedCustomerForWash}
                  className="btn-primary"
                >
                  {arrivalSubmitting ? 'Recording...' : 'Check-In to Bay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Preview & Send Modal */}
      {previewModalOpen && previewWash && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '28px', height: '28px', background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <MessageSquare size={16} />
                </span>
                <h3>WhatsApp Wash Completion Notification</h3>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Recipient:</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0B132B' }}>
                  {previewWash.customerName} ({previewWash.phone})
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Block {previewWash.blockNumber}, Flat {previewWash.flatNumber} • Vehicle {previewWash.vehicleNumber}
                </div>
              </div>

              <div className="form-group">
                <label>Message Content Preview</label>
                <div style={{
                  background: '#E7FCE9',
                  border: '1px solid #BBF7D0',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '0.88rem',
                  lineHeight: '1.5',
                  color: '#064E3B'
                }}>
                  "Hello {previewWash.customerName}, your vehicle {previewWash.vehicleNumber} (Flat {previewWash.flatNumber}, Block {previewWash.blockNumber}) has been washed successfully today. Thank you for choosing our car wash service!"
                </div>
              </div>

              {whatsappResult && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                  background: whatsappResult.status === 'Sent via API' ? '#ECFDF5' : '#EFF6FF',
                  color: whatsappResult.status === 'Sent via API' ? '#047857' : '#1E40AF',
                  border: '1px solid',
                  borderColor: whatsappResult.status === 'Sent via API' ? '#A7F3D0' : '#BFDBFE'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                    Status: {whatsappResult.status} ({whatsappResult.mode})
                  </div>
                  <div>{whatsappResult.message || 'Notification processed successfully!'}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsapp}
                  disabled={sendingWhatsapp}
                  className="btn-whatsapp"
                  style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                >
                  {sendingWhatsapp ? 'Dispatching...' : 'Send WhatsApp Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
