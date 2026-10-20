const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('cw_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  async login(identifier, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to authenticate');
    return data;
  },

  // Dashboard Stats
  async getDashboardStats() {
    const res = await fetch(`${API_URL}/reports/dashboard-stats`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load dashboard data');
    return data;
  },

  // Customers
  async getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/customers?${query}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load customers');
    return data;
  },

  async getCustomerDetails(id) {
    const res = await fetch(`${API_URL}/customers/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load customer profile');
    return data;
  },

  async createCustomer(payload) {
    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to register customer');
    return data;
  },

  async updateCustomer(id, payload) {
    const res = await fetch(`${API_URL}/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update customer');
    return data;
  },

  async deleteCustomer(id) {
    const res = await fetch(`${API_URL}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to archive customer');
    return data;
  },

  // Payments & Bills
  async getBills(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/payments/bills?${query}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load bills');
    return data;
  },

  async recordPayment(payload) {
    const res = await fetch(`${API_URL}/payments/record`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to record payment');
    return data;
  },

  async getPaymentHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/payments/history?${query}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load payments history');
    return data;
  },

  async generateMonthBills(billingMonth) {
    const res = await fetch(`${API_URL}/payments/generate-month-bills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ billingMonth })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to generate bills');
    return data;
  },

  // Daily Washes
  async getDailyWashes(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/washes?${query}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load washes');
    return data;
  },

  async recordWash(payload) {
    const res = await fetch(`${API_URL}/washes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  async updateWashStatus(id, status) {
    const res = await fetch(`${API_URL}/washes/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update wash status');
    return data;
  },

  async sendWashWhatsApp(id) {
    const res = await fetch(`${API_URL}/washes/${id}/send-whatsapp`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send WhatsApp message');
    return data;
  },

  async markWashLinkOpened(id) {
    const res = await fetch(`${API_URL}/washes/${id}/mark-link-opened`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Reminders
  async getPendingReminders(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/reminders/pending?${query}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load reminders');
    return data;
  },

  async sendSingleReminder(payload) {
    const res = await fetch(`${API_URL}/reminders/send-single`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send reminder');
    return data;
  },

  async sendBulkReminders(reminders) {
    const res = await fetch(`${API_URL}/reminders/send-bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reminders })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send bulk reminders');
    return data;
  },

  async getReminderLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/reminders/logs?${query}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load logs');
    return data;
  },

  // Settings
  async getSettings() {
    const res = await fetch(`${API_URL}/settings`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load settings');
    return data;
  },

  async updateSettings(payload) {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save settings');
    return data;
  },

  // Export CSV
  getExportUrl(type, month) {
    const token = localStorage.getItem('cw_token');
    return `${API_URL}/reports/export-csv?type=${type}&month=${month || ''}&token=${token}`;
  }
};
