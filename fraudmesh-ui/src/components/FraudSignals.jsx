import React, { useState, useEffect } from 'react';
import { AlertTriangle, Network, Zap, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import apiService from '../services/api';

const FraudSignals = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSignals(true, null, 100);
        setSignals(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500';
      case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500';
    }
  };

  return (
    <div className="p-8 bg-primary min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Zap className="w-8 h-8 text-yellow-400" />
          Fraud Signals
        </h1>
        <p className="text-slate-400">Published fraud signals from merchant network</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-200">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-400">Loading signals...</div>
      ) : signals.length === 0 ? (
        <div className="text-center text-slate-400">No active signals</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="text-left py-3 px-4 text-slate-300">Signal ID</th>
                <th className="text-left py-3 px-4 text-slate-300">Pattern Type</th>
                <th className="text-left py-3 px-4 text-slate-300">Severity</th>
                <th className="text-left py-3 px-4 text-slate-300">Confidence</th>
                <th className="text-left py-3 px-4 text-slate-300">Published</th>
                <th className="text-left py-3 px-4 text-slate-300">Matches</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => (
                <tr key={signal.signal_id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono text-accent">{signal.signal_id}</td>
                  <td className="py-3 px-4 text-slate-300">{signal.pattern_type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded border ${getSeverityColor(signal.severity)}`}>
                      {signal.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{(signal.confidence * 100).toFixed(0)}%</td>
                  <td className="py-3 px-4 text-slate-400 text-xs">{new Date(signal.published_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-slate-300">{signal.match_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FraudSignals;
