import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Set to false when backend is running, or it auto-detects
let MOCK_MODE = false;

const checkBackendConnection = async () => {
  try {
    await api.get('/health');
    return false;
  } catch {
    return true;
  }
};

const initMockMode = async () => {
  MOCK_MODE = await checkBackendConnection();
  console.log(MOCK_MODE ? 'Using MOCK API' : 'Using REAL backend API');
};

initMockMode();

const MOCK_DATA = {
  balance: { balance: 12500.00, account_id: 'ACC00001', currency: 'USD' },
  
  transactions: {
    total: 15420,
    transactions: [
      { id: 'TXN001', amount: 249.99, merchant_id: 'Apple Store', timestamp: '2024-01-15T10:30:00', risk_score: 15, recommended_action: 'ALLOW', status: 'completed', payment_method: 'card', signals: [] },
      { id: 'TXN002', amount: 89.50, merchant_id: 'Amazon', timestamp: '2024-01-14T14:22:00', risk_score: 22, recommended_action: 'ALLOW', status: 'completed', payment_method: 'upi', signals: [] },
      { id: 'TXN003', amount: 1250.00, merchant_id: 'Electronics Hub', timestamp: '2024-01-13T09:15:00', risk_score: 68, recommended_action: 'STEP_UP', status: 'completed', payment_method: 'card', signals: [{ signal_type: 'high_value_transaction', score_contribution: 25 }, { signal_type: 'new_merchant', score_contribution: 15 }] },
      { id: 'TXN004', amount: 45.00, merchant_id: 'Dark Store', timestamp: '2024-01-12T23:45:00', risk_score: 85, recommended_action: 'BLOCK', status: 'blocked', payment_method: 'wallet', signals: [{ signal_type: 'velocity_spike', score_contribution: 30 }, { signal_type: 'unusual_time', score_contribution: 20 }, { signal_type: 'new_device', score_contribution: 15 }] },
      { id: 'TXN005', amount: 599.00, merchant_id: 'Best Buy', timestamp: '2024-01-11T16:30:00', risk_score: 28, recommended_action: 'ALLOW', status: 'completed', payment_method: 'card', signals: [] },
    ]
  },

  signals: [
    { id: 'FS-001', signal_type: 'DEVICE_FRAUD', severity: 'critical', matched_count: 152, first_seen: '2024-01-01', description: 'Device fingerprint matches known fraud patterns' },
    { id: 'FS-002', signal_type: 'VELOCITY_SPIKE', severity: 'high', matched_count: 89, first_seen: '2024-01-03', description: 'Abnormal transaction velocity detected' },
    { id: 'FS-003', signal_type: 'IP_PROXY', severity: 'medium', matched_count: 234, first_seen: '2024-01-05', description: 'Transaction from known proxy/VPN IP' },
  ],

  network: {
    statistics: { total_clusters: 5, total_nodes: 1200 },
    nodes: [
      { id: 'TXN001', type: 'transaction', risk: 15, amount: 249.99 },
      { id: 'ACC001', type: 'account', risk: 10 },
      { id: 'DEV001', type: 'device', risk: 5 },
      { id: 'IP001', type: 'ip', risk: 20 },
    ],
    edges: []
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateRiskResponse = (amount, paymentMethod) => {
  const baseRisk = Math.random() * 40;
  const amountRisk = amount > 1000 ? 20 : amount > 500 ? 10 : 0;
  const methodRisk = paymentMethod === 'wallet' ? 15 : paymentMethod === 'upi' ? 5 : 0;
  const totalRisk = Math.min(100, baseRisk + amountRisk + methodRisk);

  let action = 'ALLOW';
  if (totalRisk >= 70) action = 'BLOCK';
  else if (totalRisk >= 50) action = 'STEP_UP';

  const signals = [];
  if (totalRisk >= 70) {
    signals.push({ signal_type: 'velocity_spike', score_contribution: 25, description: 'High transaction velocity detected' });
    signals.push({ signal_type: 'new_device', score_contribution: 20, description: 'Unrecognized device fingerprint' });
    signals.push({ signal_type: 'unusual_time', score_contribution: 15, description: 'Transaction at unusual hour' });
  } else if (totalRisk >= 50) {
    signals.push({ signal_type: 'high_value_transaction', score_contribution: 20, description: 'Amount above typical threshold' });
    signals.push({ signal_type: 'new_merchant', score_contribution: 10, description: 'First transaction with this merchant' });
  }

  return {
    risk_score: Math.round(totalRisk),
    risk_level: totalRisk < 30 ? 'Low' : totalRisk < 60 ? 'Medium' : totalRisk < 80 ? 'High' : 'Critical',
    recommended_action: action,
    signals,
    decision: action === 'ALLOW' ? 'Direct Gateway Approval' : action === 'STEP_UP' ? 'Require 3DS / OTP Challenge' : 'Auto-Decline Transaction'
  };
};

export const apiService = {
  getHealth: async () => {
    if (MOCK_MODE) {
      return { status: 'ok', service: 'FraudMesh AI Mock' };
    }
    const response = await api.get('/health');
    return response.data;
  },

  getTransactions: async (page = 1, pageSize = 50, fraudOnly = false) => {
    if (MOCK_MODE) {
      await delay(300);
      return MOCK_DATA.transactions;
    }
    const response = await api.get('/transactions', {
      params: { page, page_size: pageSize, fraud_only: fraudOnly },
    });
    return response.data;
  },

  checkRisk: async (transactionData) => {
    if (MOCK_MODE) {
      await delay(1500 + Math.random() * 1000);
      return generateRiskResponse(transactionData.amount, transactionData.payment_method);
    }
    const response = await api.post('/risk/check', transactionData);
    return response.data;
  },

  getNetwork: async (limit = 5000) => {
    if (MOCK_MODE) {
      await delay(500);
      return MOCK_DATA.network;
    }
    const response = await api.get('/network', { params: { limit } });
    return response.data;
  },

  getSignals: async (activeOnly = true, minSeverity = null, limit = 100) => {
    if (MOCK_MODE) {
      await delay(300);
      return MOCK_DATA.signals;
    }
    const response = await api.get('/signals', {
      params: { active_only: activeOnly, min_severity: minSeverity, limit },
    });
    return response.data;
  },

  publishSignal: async (signalData) => {
    if (MOCK_MODE) {
      await delay(500);
      return { id: 'FS-' + Date.now(), ...signalData, created_at: new Date().toISOString() };
    }
    const response = await api.post('/signals/publish', signalData);
    return response.data;
  },

  matchSignals: async (transactionData) => {
    if (MOCK_MODE) {
      await delay(400);
      return { matches: [], count: 0 };
    }
    const response = await api.post('/signals/match', transactionData);
    return response.data;
  },

  investigate: async (transactionId) => {
    if (MOCK_MODE) {
      await delay(800);
      return {
        transaction_id: transactionId,
        findings: ['Device fingerprint matches known fraud patterns', 'IP address from VPN'],
        recommendation: 'BLOCK'
      };
    }
    const response = await api.post(`/investigate/${transactionId}`);
    return response.data;
  },

  agentQuery: async (queryText) => {
    if (MOCK_MODE) {
      await delay(1000);
      return {
        answer: `Based on the fraud network analysis, ${queryText}. The system has identified several risk patterns including velocity spikes and device reuse.`,
        steps: ['Analyzed transaction patterns', 'Cross-referenced fraud signals', 'Computed risk scores']
      };
    }
    try {
      const response = await api.post('/agent/query', { query: queryText });
      return response.data;
    } catch (e) {
      return { answer: "AI Agent response synthesized locally.", steps: ["Local fallback active"] };
    }
  },

  runDemo: async () => {
    if (MOCK_MODE) {
      await delay(2000);
      return { status: 'completed', transactions_processed: 150 };
    }
    const response = await api.post('/demo/run');
    return response.data;
  },

  getBalance: async (accountId) => {
    if (MOCK_MODE) {
      await delay(200);
      return { ...MOCK_DATA.balance, account_id: accountId };
    }
    const response = await api.get(`/balance?account_id=${accountId}`);
    return response.data;
  },

  processPayment: async (payload) => {
    if (MOCK_MODE) {
      await delay(1000);
      return {
        status: 'completed',
        message: 'Payment processed successfully',
        transaction_id: payload.transaction_id || 'TXN' + Date.now(),
        timestamp: new Date().toISOString()
      };
    }
    const response = await api.post('/payment', payload);
    return response.data;
  },
};

export default apiService;
