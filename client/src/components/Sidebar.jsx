import React from 'react';
import { 
  LayoutDashboard, Users, CreditCard, Sparkles, 
  Send, Settings as SettingsIcon, LogOut, ShieldCheck, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activePage, setActivePage, isOpen, onClose }) {
  const { user, logout, settings } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers & Cars', icon: Users },
    { id: 'payments', label: 'Payments & Bills', icon: CreditCard },
    { id: 'washes', label: 'Daily Washes & WhatsApp', icon: Sparkles },
    { id: 'reminders', label: 'Payment Reminders', icon: Send },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <Sparkles size={24} />
        </div>
        <div className="brand-info">
          <h2>{settings?.businessName || 'Elite Car Wash'}</h2>
          <span>Owner Portal</span>
        </div>
      </div>

      {/* Apartment Community Active Chip */}
      <div className="society-tag">
        <div className="society-dot" />
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <strong style={{ color: '#00B4D8' }}>Active:</strong> {settings?.apartmentCommunity || 'Green Residency'}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                if (onClose) onClose();
              }}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={19} color={isActive ? '#00B4D8' : '#94A3B8'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <div className="owner-chip">
          <div className="owner-avatar">
            {user?.fullName ? user.fullName[0] : 'O'}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>
              {user?.fullName || 'Owner'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Verified Owner
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#EF4444',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
