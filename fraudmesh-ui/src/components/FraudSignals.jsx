import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  Plus, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Lock, 
  RefreshCw,
  Hash,
  Sparkles,
  X,
  AlertTriangle
} from 'lucide-react';
import apiService from '../services/api';
import soundService from '../services/audio';

const FraudSignals = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // New signal form state
  const [newSignal, setNewSignal] = useState({
    publisher_id: 'MER0005',
    pattern_type: 'COORDINATED_ACTIVITY',
    signals: ['device_reuse', 'multi_account_activity', 'velocity_spike'],
    confidence: 0.95,
    matching_criteria: {
      min_device_reuse: 3,
      time_window_minutes: 30,
      subnet_match: '185.158.*.*'
    },
    device_fingerprints: ['sha256:d99f8e2...', 'sha256:a12b3c...'],
    expires_in_days: 30
  });

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getSignals(true, null, 100);
      setSignals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve signal registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      setPublishing(true);
      soundService.playScan();
      await apiService.publishSignal(newSignal);
      soundService.playApproved();
      setShowPublishModal(false);
      fetchSignals();
    } catch (err) {
      alert('Error publishing signal: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  const filteredSignals = signals.filter((sig) => {
    const matchesSearch = 
      sig.signal_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.pattern_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.publisher_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = 
      severityFilter === 'ALL' || sig.severity?.toUpperCase() === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const totalMatches = signals.reduce((sum, s) => sum + (s.match_count || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Radio className="text-amber-400" size={24} />
            Decentralized Fraud Signal Exchange
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Zero-PII merchant intelligence pool — share threat signatures without exposing customer identities
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              soundService.playClick();
              fetchSignals();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-xl text-xs font-mono transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-400' : ''} />
            <span>Refresh Feed</span>
          </button>

          <button
            onClick={() => {
              soundService.playClick();
              setShowPublishModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/30"
          >
            <Plus size={14} />
            <span>Publish Anonymized Signal</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Active Threat Signatures</div>
            <div className="text-2xl font-black font-mono text-white mt-1">{signals.length} Signals</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Radio size={18} />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Network Signal Matches</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{totalMatches} Attacks Blocked</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldAlert size={18} />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Privacy Guarantee</div>
            <div className="text-2xl font-black font-mono text-cyan-400 mt-1">100% Zero PII</div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Lock size={18} />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase">Average Match Confidence</div>
            <div className="text-2xl font-black font-mono text-purple-400 mt-1">94.8%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sparkles size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Signal ID (e.g. FS-5C7FA458), Pattern Type, or Publisher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition font-mono"
          />
        </div>

        {/* Severity Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => {
                soundService.playClick();
                setSeverityFilter(sev);
              }}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition
                ${severityFilter === sev
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                }
              `}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-xs font-mono flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
          <span>Error loading threat pool: {error}</span>
        </div>
      )}

      {/* Signals Table Card */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <RefreshCw size={24} className="animate-spin text-indigo-400 mx-auto" />
            <div className="text-xs font-mono">Synchronizing threat intelligence registry...</div>
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Radio size={32} className="text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No matching fraud signals found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Signals published by merchants or detected during attack simulations will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Signal ID</th>
                  <th className="py-3 px-4">Threat Pattern</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Publisher</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Matches</th>
                  <th className="py-3 px-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredSignals.map((sig) => (
                  <tr key={sig.signal_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-indigo-400 flex items-center gap-1.5">
                      <Hash size={13} className="text-slate-400" />
                      <span>{sig.signal_id}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      <div className="font-semibold text-xs text-white">{sig.pattern_type}</div>
                      {sig.signals && Array.isArray(sig.signals) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {sig.signals.slice(0, 3).map((s, i) => (
                            <span key={i} className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityBadge(sig.severity)}`}>
                        {sig.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full" 
                            style={{ width: `${(sig.confidence || 0.9) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold">{Math.round((sig.confidence || 0.9) * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans text-xs">
                      {sig.publisher_id || 'Network Cluster'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {sig.published_at ? new Date(sig.published_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {sig.match_count || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          soundService.playClick();
                          setSelectedSignal(sig);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 transition"
                        title="View Salted Behavioral Vectors"
                      >
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signal Details Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-indigo-400" />
                <h3 className="font-bold text-white text-base font-mono">
                  {selectedSignal.signal_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pattern:</span>
                  <span className="text-white font-bold">{selectedSignal.pattern_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Severity:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${getSeverityBadge(selectedSignal.severity)}`}>
                    {selectedSignal.severity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Published By:</span>
                  <span className="text-indigo-300">{selectedSignal.publisher_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Times Matched:</span>
                  <span className="text-emerald-400 font-bold">{selectedSignal.match_count} times</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
                  Salted Behavioral Signals (Zero-PII)
                </span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-slate-300">
                  {selectedSignal.signals && Array.isArray(selectedSignal.signals) ? (
                    selectedSignal.signals.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-indigo-400" />
                        <span>{s}</span>
                      </div>
                    ))
                  ) : (
                    <div>Coordinated velocity anomaly</div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-300 text-[11px] font-sans flex items-center gap-2">
                <Lock size={14} className="text-emerald-400 flex-shrink-0" />
                <span>Zero customer identifiers or raw credentials exist in this signal payload.</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSignal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* Publish Signal Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Radio size={18} className="text-indigo-400" />
                Publish Fraud Threat Signature
              </h3>
              <button
                onClick={() => setShowPublishModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Pattern Type
                </label>
                <select
                  value={newSignal.pattern_type}
                  onChange={(e) => setNewSignal({ ...newSignal, pattern_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="COORDINATED_ACTIVITY">COORDINATED_ACTIVITY</option>
                  <option value="CARD_TESTING">CARD_TESTING</option>
                  <option value="DEVICE_FRAUD">DEVICE_FRAUD</option>
                  <option value="VELOCITY_ANOMALY">VELOCITY_ANOMALY</option>
                  <option value="MERCHANT_COLLUSION">MERCHANT_COLLUSION</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Confidence Score (0.50 - 1.00)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1.0"
                  value={newSignal.confidence}
                  onChange={(e) => setNewSignal({ ...newSignal, confidence: parseFloat(e.target.value) || 0.9 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  Publisher ID
                </label>
                <input
                  type="text"
                  value={newSignal.publisher_id}
                  onChange={(e) => setNewSignal({ ...newSignal, publisher_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400">
                🔒 Cryptographic check: Hashes of hardware and subnet will be broadcast. Zero raw PII transmitted.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  {publishing ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={14} />}
                  <span>{publishing ? 'Publishing...' : 'Broadcast Signal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudSignals;
