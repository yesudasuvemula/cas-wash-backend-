import React from 'react';
import { Menu, Calendar, ShieldCheck, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ activePage, onToggleSidebar }) {
  const { user, settings } = useAuth();

  const getPageMeta = () => {
    switch (activePage) {
      case 'dashboard':
        return { title: 'Executive Overview', subtitle: 'Live business metrics & daily revenue records' };
      case 'customers':
        return { title: 'Customers & Society Cars', subtitle: 'Vehicle registry with flat & block categorization' };
      case 'payments':
        return { title: 'Payments & Subscriptions', subtitle: 'Prepaid 1st-5th billing cycles and verified cash/UPI' };
      case 'washes':
        return { title: 'Daily Wash Bay & WhatsApp', subtitle: 'Check-in arrivals, progress status & completion alerts' };
      case 'reminders':
        return { title: 'Monthly Payment Reminders', subtitle: 'WhatsApp notification dispatch for overdue balances' };
      case 'settings':
        return { title: 'System Settings', subtitle: 'Pricing tiers, apartment society name & API setup' };
      default:
        return { title: 'Car Wash Management', subtitle: 'Society Subscription Operations' };
    }
  };

  const meta = getPageMeta();
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            padding: '4px'
          }}
          className="menu-button"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-title">
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="date-pill">
          <Calendar size={14} color="#00B4D8" />
          <span>{todayFormatted} (IST)</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          padding: '6px 12px',
          borderRadius: '30px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
            {user?.username || 'Owner'}
          </span>
        </div>
      </div>
    </header>
  );
}
