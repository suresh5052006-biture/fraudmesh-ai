import React, { useState } from 'react';
import { Search, Loader2, AlertTriangle, ShieldCheck, Sparkles, Bot, Lock } from 'lucide-react';
import apiService from '../services/api';
import RiskRadarGauge from './RiskRadarGauge';
import soundService from '../services/audio';

const RiskCheck = () => {
  const [formData, setFormData] = useState({
    merchant_id: 'MER0005',
    amount: 500,
    account_id: 'ACC00001',
    device_id: 'DEV0001',
    payment_instrument_id: 'PI0001',
    customer_id: 'CUS00001',
    ip_address: '192.168.4.12'
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCheck = async () => {
    try {
      soundService.playScan();
      setLoading(true);
      setError(null);
      const data = await apiService.checkRisk(formData);
      setResult(data);

      if (data.recommended_action === 'BLOCK') soundService.playAlert();
      else if (data.recommended_action === 'STEP_UP') soundService.playStepUp();
      else soundService.playApproved();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-950 min-h-screen text-slate-100 font-sans space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-white mb-1 flex items-center gap-2">
          <Search className="w-7 h-7 text-indigo-400" />
          Real-Time Risk Engine & Radar
        </h1>
        <p className="text-sm text-slate-400">Evaluate transactions against 9 explainable signals and network intelligence</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Transaction Parameters</h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-mono text-slate-400 mb-1">Merchant ID</label>
              <input
                type="text"
                name="merchant_id"
                value={formData.merchant_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Amount ($ USD)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Account ID</label>
              <input
                type="text"
                name="account_id"
                value={formData.account_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Device ID Fingerprint</label>
              <input
                type="text"
                name="device_id"
                value={formData.device_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Payment Instrument Hash</label>
              <input
                type="text"
                name="payment_instrument_id"
                value={formData.payment_instrument_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">IP Address</label>
              <input
                type="text"
                name="ip_address"
                value={formData.ip_address}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full mt-4 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Evaluate 9-Signal Risk
          </button>
        </div>

        {/* Right 2 Cols: Radar & Decision Spectrum */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-200 text-sm">
              Error evaluating transaction: {error}
            </div>
          )}

          <RiskRadarGauge
            riskScore={result ? result.risk_score : 72}
            signals={result ? result.signals : [
              { signal_type: 'device_reuse', score_contribution: 35 },
              { signal_type: 'merchant_hopping', score_contribution: 25 },
              { signal_type: 'velocity_spike', score_contribution: 20 },
            ]}
          />

          {/* Privacy Shield Inspector Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Zero-Knowledge Privacy Shield Verification
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                100% Zero PII Shared
              </span>
            </div>

            <p className="text-xs text-slate-300">
              When screening against network signals, FraudMesh AI matches salted cryptographic hashes of hardware signatures and velocity buckets. No card numbers, customer names, or emails ever leave your local database server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskCheck;
