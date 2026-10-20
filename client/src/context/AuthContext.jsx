import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('cw_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (data.success && data.user) {
          setUser(data.user);
          // fetch system settings
          const sData = await api.getSettings();
          if (sData.success) {
            setSettings(sData.settings);
          }
        } else {
          localStorage.removeItem('cw_token');
        }
      } catch (err) {
        console.error('Session verification error:', err);
        localStorage.removeItem('cw_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    const data = await api.login(identifier, password);
    if (data.success && data.token) {
      localStorage.setItem('cw_token', data.token);
      setUser(data.user);
      const sData = await api.getSettings();
      if (sData.success) {
        setSettings(sData.settings);
      }
      return data;
    }
    throw new Error(data.message || 'Authentication failed');
  };

  const logout = () => {
    localStorage.removeItem('cw_token');
    setUser(null);
  };

  const refreshSettings = async () => {
    try {
      const sData = await api.getSettings();
      if (sData.success) {
        setSettings(sData.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, settings, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
