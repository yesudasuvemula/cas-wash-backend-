import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import DailyWashes from './pages/DailyWashes';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B132B',
        color: 'white'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          border: '3px solid rgba(0, 180, 216, 0.2)',
          borderTopColor: '#00B4D8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Elite Car Wash & Care</h3>
        <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px' }}>Verifying secure owner session...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Enforce owner authentication - show login page if not authenticated
  if (!user) {
    return <Login />;
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            setActivePage={setActivePage}
            onOpenQuickAction={(action) => {
              if (action === 'customer') setActivePage('customers');
              else if (action === 'payment') setActivePage('payments');
              else if (action === 'wash') setActivePage('washes');
            }}
          />
        );
      case 'customers':
        return <Customers />;
      case 'payments':
        return <Payments />;
      case 'washes':
        return <DailyWashes />;
      case 'reminders':
        return <Reminders />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Topbar
          activePage={activePage}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="page-body">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
