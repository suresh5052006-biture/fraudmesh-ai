import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const apiService = {
  // Health check
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Transactions
  getTransactions: async (page = 1, pageSize = 50, fraudOnly = false) => {
    const response = await api.get('/transactions', {
      params: { page, page_size: pageSize, fraud_only: fraudOnly },
    });
    return response.data;
  },

  // Risk check
  checkRisk: async (transactionData) => {
    const response = await api.post('/risk/check', transactionData);
    return response.data;
  },

  // Network analysis
  getNetwork: async (limit = 5000) => {
    const response = await api.get('/network', { params: { limit } });
    return response.data;
  },

  // Signals
  getSignals: async (activeOnly = true, minSeverity = null, limit = 100) => {
    const response = await api.get('/signals', {
      params: { active_only: activeOnly, min_severity: minSeverity, limit },
    });
    return response.data;
  },

  publishSignal: async (signalData) => {
    const response = await api.post('/signals/publish', signalData);
    return response.data;
  },

  matchSignals: async (transactionData) => {
    const response = await api.post('/signals/match', transactionData);
    return response.data;
  },

  // Investigation
  investigate: async (transactionId) => {
    const response = await api.post(`/investigate/${transactionId}`);
    return response.data;
  },

  // Demo
  runDemo: async () => {
    const response = await api.post('/demo/run');
    return response.data;
  },
};

export default apiService;
