import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Car, CheckCircle, Clock, Users, IndianRupee, AlertCircle, 
  TrendingUp, Calendar, ArrowUpRight, Plus, RefreshCw, Send, ShieldAlert
} from 'lucide-react';

export default function Dashboard({ setActivePage, onOpenQuickAction }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('month'); // today, week, month

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
        <RefreshCw size={36} className="spin-icon" style={{ margin: '0 auto 16px', display: 'block' }} />
        <p>Loading real-time business statistics from database...</p>
      </div>
    );
  }

  const { stats, charts } = data || { stats: {}, charts: {} };
  const today = stats?.today || {};
  const customers = stats?.customers || {};
  const monthly = stats?.monthly || {};

  return (
    <div>
      {/* Top Banner with Quick Actions */}
      <div style={{
        background: 'linear-gradient(135deg, #0B132B 0%, #152244 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        color: 'white',
        marginBottom: '28px',
        boxShadow: '0 10px 25px rgba(11, 19, 43, 0.15)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div>
          <span style={{
            fontSize: '0.78rem',
            color: '#00B4D8',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Daily Operational Command Center
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>
            Society Car Wash Dashboard
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#94A3B8', marginTop: '4px' }}>
            Real-time monthly prepaid subscription billing & daily washing track
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => onOpenQuickAction('wash')}
            style={{
              background: '#00B4D8',
              color: '#0B132B',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Car size={18} /> Record Car Wash
          </button>

          <button
            onClick={() => onOpenQuickAction('customer')}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} /> Add Customer
          </button>

          <button
            onClick={() => onOpenQuickAction('payment')}
            style={{
              background: '#10B981',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <IndianRupee size={18} /> Record Payment
          </button>

          <button
            onClick={() => setActivePage('reminders')}
            style={{
              background: '#F59E0B',
              color: '#0B132B',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '10px 16px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={18} /> Send Reminders
          </button>
        </div>
      </div>

      {/* Section 1: Today's Statistics */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#00B4D8" /> Today's Operations
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-info">
              <span>Cars Washed Today</span>
              <h3>{today.totalWashed || 0}</h3>
              <p>Vehicles serviced today</p>
            </div>
            <div className="stat-icon navy">
              <Car size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-info">
              <span>Completed Washes</span>
              <h3 style={{ color: '#10B981' }}>{today.completed || 0}</h3>
              <p>Washed & WhatsApp notified</p>
            </div>
            <div className="stat-icon emerald">
              <CheckCircle size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-info">
              <span>Pending / In-Progress</span>
              <h3 style={{ color: '#F59E0B' }}>{today.pending || 0}</h3>
              <p>Currently in washing bay</p>
            </div>
            <div className="stat-icon amber">
              <Clock size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-info">
              <span>Payments Received Today</span>
              <h3 style={{ color: '#10B981' }}>₹{(today.paymentsReceived || 0).toLocaleString('en-IN')}</h3>
              <p>Actual collected today</p>
            </div>
            <div className="stat-icon emerald">
              <IndianRupee size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Monthly Financial Overview */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#10B981" /> Current Month Financial Performance ({data?.currentMonth})
          </h3>
          <span style={{ fontSize: '0.76rem', color: '#475569', background: '#E2E8F0', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
            Strict Cash-in Accounting
          </span>
        </div>

        <div className="stats-grid">
          <div className="stat-card" style={{ borderLeft: '4px solid #10B981' }}>
            <div className="stat-card-info">
              <span>Actual Income Received</span>
              <h3 style={{ color: '#10B981' }}>₹{(monthly.incomeReceived || 0).toLocaleString('en-IN')}</h3>
              <p>Real payments recorded in bank/cash</p>
            </div>
            <div className="stat-icon emerald">
              <IndianRupee size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-info">
              <span>Expected Subscription Income</span>
              <h3>₹{(monthly.expectedIncome || 0).toLocaleString('en-IN')}</h3>
              <p>Total monthly bills issued</p>
            </div>
            <div className="stat-icon navy">
              <ArrowUpRight size={22} />
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
            <div className="stat-card-info">
              <span>Outstanding Unpaid Amount</span>
              <h3 style={{ color: '#EF4444' }}>₹{(monthly.outstandingBalance || 0).toLocaleString('en-IN')}</h3>
              <p>{monthly.unpaidCustomers || 0} customer(s) pending payment</p>
            </div>
            <div className="stat-icon rose">
              <AlertCircle size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-info">
              <span>Active Subscriptions</span>
              <h3 style={{ color: '#0284C7' }}>{customers.activeSubscriptions || 0}</h3>
              <p>{customers.totalRegistered || 0} total registered vehicles</p>
            </div>
            <div className="stat-icon cyan">
              <Users size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Visual Breakdown & Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Daily Activity Chart Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
            Daily Car Wash Activity (Past 7 Days)
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '20px' }}>
            Completed vehicle washes
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '160px', padding: '10px 0' }}>
            {(charts?.dailyWashes || []).map((item, idx) => {
              const maxVal = Math.max(...(charts?.dailyWashes || []).map(d => d.completed), 5);
              const heightPct = Math.max(15, (item.completed / maxVal) * 100);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0B132B', marginBottom: '6px' }}>
                    {item.completed}
                  </span>
                  <div style={{
                    width: '32px',
                    height: `${heightPct}%`,
                    background: 'linear-gradient(180deg, #00B4D8 0%, #0077B6 100%)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.3s'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '8px', fontWeight: 600 }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscription by Vehicle Size */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
            Vehicle Size & Subscription Pricing
          </h4>
          <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '16px' }}>
            Registered active vehicles across apartment blocks
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(charts?.vehicleDistribution || []).map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, color: '#1E293B' }}>{cat.name}</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{cat.count} vehicles</span>
                </div>
                <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (cat.count / Math.max(1, customers.totalRegistered || 1)) * 100)}%`,
                    height: '100%',
                    background: cat.color,
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Paid vs Unpaid Ratio:</span>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#10B981' }}>
              {monthly.paidCustomers || 0} Paid • {monthly.unpaidCustomers || 0} Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
