import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import apiService from '../services/api';

const RiskCheck = () => {
  const [formData, setFormData] = useState({
    merchant_id: 'MER0005',
    amount: 500,
    account_id: 'ACC00001',
    device_id: 'DEV0001',
    payment_instrument_id: 'PI0001',
    customer_id: 'CUS00001',
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };

  const handleCheck = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.checkRisk(formData);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="p-8 bg-primary min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Search className="w-8 h-8" />
          Live Risk Check
        </h1>
        <p className="text-slate-400">Check fraud risk for any transaction</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-secondary rounded-lg p-6 border border-slate-700 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Merchant ID</label>
              <input
                type="text"
                name="merchant_id"
                value={formData.merchant_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Amount ($)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Account ID</label>
              <input
                type="text"
                name="account_id"
                value={formData.account_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Device ID</label>
              <input
                type="text"
                name="device_id"
                value={formData.device_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Payment Instrument</label>
              <input
                type="text"
                name="payment_instrument_id"
                value={formData.payment_instrument_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Customer ID</label>
              <input
                type="text"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full mt-6 px-4 py-3 bg-accent hover:bg-red-600 disabled:bg-slate-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check Transaction
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-200 mb-6">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="bg-secondary rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Risk Assessment Result</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800 rounded p-4">
                <p className="text-slate-400 text-sm mb-2">Risk Score</p>
                <p className={`text-3xl font-bold ${getRiskColor(result.risk_score)}`}>
                  {result.risk_score}/100
                </p>
              </div>
              <div className="bg-slate-800 rounded p-4">
                <p className="text-slate-400 text-sm mb-2">Risk Level</p>
                <p className="text-2xl font-bold text-white">{result.risk_level}</p>
              </div>
            </div>

            {/* Risk Spectrum & Decision Bar */}
            <div className="bg-slate-800 rounded p-5 mb-6 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <p className="text-slate-300 font-semibold text-sm">Decision Spectrum</p>
                <span className="text-xs font-mono px-2 py-1 bg-slate-900 text-accent rounded font-bold">
                  Verdict: {result.recommended_action}
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="relative my-6">
                <div className="h-4 w-full rounded-full flex overflow-hidden border border-slate-900 bg-slate-900">
                  <div className="w-[50%] bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                    ALLOW (&lt;50)
                  </div>
                  <div className="w-[20%] bg-yellow-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                    STEP_UP (50-69)
                  </div>
                  <div className="w-[15%] bg-orange-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                    REVIEW (70-84)
                  </div>
                  <div className="w-[15%] bg-red-600 flex items-center justify-center text-[10px] font-bold text-white">
                    BLOCK (85+)
                  </div>
                </div>

                {/* Score Marker Pin */}
                <div
                  className="absolute -top-3 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500"
                  style={{ left: `${Math.min(Math.max(result.risk_score, 0), 100)}%` }}
                >
                  <div className="bg-white text-slate-950 text-xs font-extrabold px-2 py-0.5 rounded shadow-lg border border-slate-300 font-mono">
                    {result.risk_score}
                  </div>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white"></div>
                </div>
              </div>

              {/* Threshold Ticks */}
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>0</span>
                <span>50</span>
                <span>70</span>
                <span>85</span>
                <span>100</span>
              </div>
            </div>

            <div className="bg-slate-800 rounded p-4 mb-6 flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-sm">Recommended Action</p>
                <p className="text-xl font-bold text-accent">{result.recommended_action}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">
                  {result.recommended_action === 'ALLOW' && '✅ Direct Gateway Approval'}
                  {result.recommended_action === 'STEP_UP' && '🔐 Require 3DS / OTP Challenge'}
                  {result.recommended_action === 'REVIEW' && '🔍 Route to Manual Risk Analyst'}
                  {result.recommended_action === 'BLOCK' && '🚫 Auto-Decline Transaction'}
                </span>
              </div>
            </div>

            {result.signals && result.signals.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Detected Signals</h3>
                <div className="space-y-2">
                  {result.signals.map((signal, idx) => (
                    <div key={idx} className="bg-slate-800 rounded p-3 flex justify-between items-start">
                      <div>
                        <p className="text-slate-300 font-medium">{signal.signal_type}</p>
                        <p className="text-slate-500 text-sm">{signal.description}</p>
                      </div>
                      <span className="text-yellow-400 font-bold">+{signal.score_contribution.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskCheck;
