import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('yesudasu');
  const [password, setPassword] = useState('yesudasu7778');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, #101E3E 0%, #080D1A 90%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Glow Elements */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 180, 216, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '24px',
        padding: '40px 36px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #0B132B 0%, #00B4D8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 10px 25px rgba(0, 180, 216, 0.3)'
          }}>
            <Sparkles size={32} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0B132B', marginBottom: '6px' }}>
            Elite Car Wash & Care
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748B' }}>
            Owner-Only Access • Society Subscriptions
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.84rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#475569',
              marginBottom: '8px'
            }}>
              Owner Username or Email
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1.5px solid #E2E8F0',
              borderRadius: '10px',
              padding: '0 14px',
              background: '#F8FAFC'
            }}>
              <User size={18} color="#94A3B8" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or email"
                required
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '12px 10px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#0F172A'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#475569'
              }}>
                Owner Password
              </label>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1.5px solid #E2E8F0',
              borderRadius: '10px',
              padding: '0 14px',
              background: '#F8FAFC'
            }}>
              <Lock size={18} color="#94A3B8" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your owner password"
                required
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '12px 10px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#0F172A'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0B132B 0%, #1C2541 100%)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 20px rgba(11, 19, 43, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? 'Authenticating Owner...' : 'Sign In as Owner'}
          </button>
        </form>

        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center',
          color: '#64748B',
          fontSize: '0.78rem'
        }}>
          <ShieldCheck size={16} color="#10B981" />
          <span>Restricted Portal • Encrypted Database Sessions</span>
        </div>
      </div>
    </div>
  );
}
