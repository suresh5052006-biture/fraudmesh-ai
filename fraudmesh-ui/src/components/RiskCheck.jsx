import React, { useState } from 'react';
import { 
  Search, 
  Loader2, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import apiService from '../services/api';
import RiskRadarGauge from './RiskRadarGauge';
import soundService from '../services/audio';

const SCENARIO_PRESETS = [
  {
    id: 'safe',
    label: '🟢 Safe Consumer',
    desc: 'Low amount ($45), known device, zero fraud hops',
    data: {
      merchant_id: 'MER0005',
      amount: 45.00,
      account_id: 'ACC00001',
      device_id: 'DEV0001',
      payment_instrument_id: 'PI0001',
      customer_id: 'CUS00001',
      ip_address: '192.168.4.12'
    }
  },
  {
    id: 'velocity',
    label: '🟡 Velocity / Step-Up',
    desc: 'Moderate amount ($650), multiple devices, triggers OTP',
    data: {
      merchant_id: 'MER0012',
      amount: 650.00,
      account_id: 'ACC01405',
      device_id: 'DEV1399',
      payment_instrument_id: 'PI0076',
      customer_id: 'CUS00394',
      ip_address: '185.158.102.103'
    }
  },
  {
    id: 'ring',
    label: '🔴 Fraud Ring (FR003)',
    desc: 'High amount ($3,486), device D-99 reuse, auto-decline',
    data: {
      merchant_id: 'MER0016',
      amount: 3486.32,
      account_id: 'ACC03538',
      device_id: 'DEV0026',
      payment_instrument_id: 'PI0062',
      customer_id: 'CUS02708',
      ip_address: '184.184.188.3'
    }
  }
];

const RiskCheck = () => {
  const [formData, setFormData] = useState(SCENARIO_PRESETS[1].data);
  const [activePreset, setActivePreset] = useState('velocity');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyPreset = (preset) => {
    soundService.playClick();
    setActivePreset(preset.id);
    setFormData(preset.data);
    setResult(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
    setActivePreset(null);
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
      setError(err.message || 'Error communicating with risk scoring service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Search className="text-indigo-400" size={24} />
            Real-Time 9-Signal Risk Engine & Radar
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Evaluate inbound transactions against 9 explainable fraud signals and cross-merchant intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            Engine v1.0 Live
          </span>
        </div>
      </div>

      {/* Preset Scenarios Selector Strip */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            Quick Scenario Presets:
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Click to load real test vectors from database
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SCENARIO_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`
                p-3 rounded-xl border text-left transition-all duration-150
                ${activePreset === p.id 
                  ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-500/10' 
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }
              `}
            >
              <div className="font-semibold text-xs text-white mb-0.5">{p.label}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Parameters Form (Left) vs Radar Gauge (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transaction Parameters Form */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Transaction Parameters
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Inputs</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-slate-400 text-[11px] mb-1">
                  Merchant ID
                </label>
                <input
                  type="text"
                  name="merchant_id"
                  value={formData.merchant_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-400 text-[11px] mb-1">
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-400 text-[11px] mb-1">
                  Account ID
                </label>
                <input
                  type="text"
                  name="account_id"
                  value={formData.account_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-400 text-[11px] mb-1">
                  Device Hardware Fingerprint
                </label>
                <input
                  type="text"
                  name="device_id"
                  value={formData.device_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-400 text-[11px] mb-1">
                  Payment Instrument Hash
                </label>
                <input
                  type="text"
                  name="payment_instrument_id"
                  value={formData.payment_instrument_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-400 text-[11px] mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  name="ip_address"
                  value={formData.ip_address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full mt-4 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-xs font-mono"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{loading ? 'Evaluating Vectors...' : 'Execute 9-Signal Risk Analysis'}</span>
          </button>
        </div>

        {/* Right 2 Cols: Radar & Decision Spectrum */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <RiskRadarGauge
            riskScore={result ? result.risk_score : null}
            signals={result ? result.signals : []}
            isEvaluated={Boolean(result)}
          />

          {/* Zero-Knowledge Privacy Verification Shield Card */}
          <div className="p-5 bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Zero-Knowledge Privacy Shield Verification
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                100% Zero PII Transmitted
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When screening against network signals, FraudMesh AI matches salted cryptographic hashes of hardware signatures and velocity buckets. No card numbers, customer names, or emails ever leave your local database server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskCheck;
