import React, { useState, useEffect } from 'react';
import { Clock, ArrowUpRight, ArrowDownRight, ChevronDown, Filter, RefreshCw } from 'lucide-react';
import apiService from '../services/api';

const getRiskBadge = (score) => {
  if (score <= 30) return { label: 'Low', class: 'badge-emerald' };
  if (score <= 60) return { label: 'Medium', class: 'badge-amber' };
  if (score <= 80) return { label: 'High', class: 'badge-orange' };
  return { label: 'Critical', class: 'badge-red' };
};

const getActionBadge = (action) => {
  switch (action) {
    case 'ALLOW': return { label: 'Approved', class: 'badge-emerald' };
    case 'STEP_UP': return { label: 'Verified', class: 'badge-amber' };
    case 'BLOCK': return { label: 'Blocked', class: 'badge-red' };
    default: return { label: action, class: 'badge-indigo' };
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const TransactionHistory = ({ accountId = 'ACC00001', compact = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, [accountId]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTransactions(1, 20, false);
      if (data.transactions) {
        setTransactions(data.transactions.map(t => ({
          id: t.id || t.transaction_id,
          amount: t.amount,
          merchant: t.merchant_id || 'Merchant',
          date: t.timestamp || new Date().toISOString(),
          riskScore: t.risk_score || Math.floor(Math.random() * 100),
          action: t.recommended_action || 'ALLOW',
          status: t.status || 'completed',
          paymentMethod: t.payment_method || 'card',
          signals: t.signals || []
        })));
      }
    } catch (e) {
      setTransactions(DEMO_TRANSACTIONS);
    }
    setLoading(false);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'fraud') return t.action === 'BLOCK';
    if (filter === 'verified') return t.action === 'STEP_UP';
    if (filter === 'approved') return t.action === 'ALLOW';
    return true;
  });

  const displayTransactions = compact ? filteredTransactions.slice(0, 5) : filteredTransactions;

  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-indigo-400" />
          <h3 className="font-semibold text-white">Transaction History</h3>
          <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">
            {filteredTransactions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="verified">Verified</option>
            <option value="fraud">Blocked</option>
          </select>
          <button
            onClick={loadTransactions}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="fm-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Risk Score</th>
              <th>Status</th>
              {!compact && <th></th>}
            </tr>
          </thead>
          <tbody>
            {displayTransactions.map((txn) => {
              const riskBadge = getRiskBadge(txn.riskScore);
              const actionBadge = getActionBadge(txn.action);
              
              return (
                <React.Fragment key={txn.id}>
                  <tr className="cursor-pointer" onClick={() => setExpanded(expanded === txn.id ? null : txn.id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          txn.action === 'ALLOW' ? 'bg-emerald-500/20' :
                          txn.action === 'STEP_UP' ? 'bg-amber-500/20' : 'bg-red-500/20'
                        }`}>
                          {txn.action === 'ALLOW' ? (
                            <ArrowUpRight size={14} className="text-emerald-400" />
                          ) : txn.action === 'STEP_UP' ? (
                            <ArrowUpRight size={14} className="text-amber-400" />
                          ) : (
                            <ArrowDownRight size={14} className="text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{txn.merchant}</p>
                          <p className="text-xs text-slate-500 capitalize">{txn.paymentMethod}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-white">{formatDate(txn.date)}</p>
                        <p className="text-xs text-slate-500">{formatTime(txn.date)}</p>
                      </div>
                    </td>
                    <td className="text-white font-medium">
                      ${txn.amount?.toFixed(2)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              txn.riskScore <= 30 ? 'bg-emerald-400' :
                              txn.riskScore <= 60 ? 'bg-amber-400' :
                              txn.riskScore <= 80 ? 'bg-orange-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${txn.riskScore}%` }}
                          />
                        </div>
                        <span className={`badge ${riskBadge.class}`}>
                          {txn.riskScore}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${actionBadge.class}`}>
                        {actionBadge.label}
                      </span>
                    </td>
                    {!compact && (
                      <td>
                        <button className="p-1 hover:bg-slate-800 rounded text-slate-400">
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${expanded === txn.id ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </td>
                    )}
                  </tr>
                  {expanded === txn.id && !compact && txn.signals.length > 0 && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <div className="px-4 pb-4 bg-slate-800/50">
                          <p className="text-xs text-slate-400 mb-2 pt-2">Risk Signals:</p>
                          <div className="flex flex-wrap gap-1">
                            {txn.signals.map((signal, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-1 bg-red-500/20 text-red-300 rounded border border-red-500/30"
                              >
                                {signal.signal_type?.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <Clock size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No transactions found</p>
        </div>
      )}
    </div>
  );
};

const DEMO_TRANSACTIONS = [
  { id: 'TXN001', amount: 249.99, merchant: 'Apple Store', date: '2024-01-15T10:30:00', riskScore: 15, action: 'ALLOW', status: 'completed', paymentMethod: 'card', signals: [] },
  { id: 'TXN002', amount: 89.50, merchant: 'Amazon', date: '2024-01-14T14:22:00', riskScore: 22, action: 'ALLOW', status: 'completed', paymentMethod: 'upi', signals: [] },
  { id: 'TXN003', amount: 1250.00, merchant: 'Electronics Hub', date: '2024-01-13T09:15:00', riskScore: 68, action: 'STEP_UP', status: 'completed', paymentMethod: 'card', signals: [{ signal_type: 'high_value_transaction' }, { signal_type: 'new_merchant' }] },
  { id: 'TXN004', amount: 45.00, merchant: 'Dark Store', date: '2024-01-12T23:45:00', riskScore: 85, action: 'BLOCK', status: 'blocked', paymentMethod: 'wallet', signals: [{ signal_type: 'velocity_spike' }, { signal_type: 'unusual_time' }, { signal_type: 'new_device' }] },
  { id: 'TXN005', amount: 599.00, merchant: 'Best Buy', date: '2024-01-11T16:30:00', riskScore: 28, action: 'ALLOW', status: 'completed', paymentMethod: 'card', signals: [] },
];

export default TransactionHistory;
