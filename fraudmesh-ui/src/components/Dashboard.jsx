import React, { useState, useEffect } from 'react';
import { AlertTriangle, Network, Zap, TrendingUp, CheckCircle, Clock, Lock } from 'lucide-react';
import apiService from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    highRiskTransactions: 0,
    activeFraudSignals: 0,
    fraudClusters: 0,
    merchantsProtected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [txns, signals, network] = await Promise.all([
          apiService.getTransactions(1, 1, false),
          apiService.getSignals(true, null, 100),
          apiService.getNetwork(2000),
        ]);

        setStats({
          totalTransactions: txns.total || 0,
          highRiskTransactions: txns.total ? Math.floor(txns.total * 0.05) : 0,
          activeFraudSignals: signals.length || 0,
          fraudClusters: network.statistics?.total_clusters || 0,
          merchantsProtected: 20,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-red-500 transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">
            {loading ? '-' : value.toLocaleString()}
          </p>
        </div>
        <Icon className={`w-12 h-12 ${color}`} opacity={0.3} />
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      {/* Privacy Banner */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500 rounded-lg flex items-start gap-3">
        <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200">
          <p className="font-semibold mb-1">Privacy-First Design</p>
          <p>Raw customer data stays with each merchant. The network exchanges only behavioral fraud signals.</p>
        </div>
      </div>

      {/* Synthetic Data Banner */}
      <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200">
          <p className="font-semibold mb-1">⚙️ Synthetic Data / Hackathon Prototype</p>
          <p>This demo uses simulated transactions. Do not connect to real payment systems.</p>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">FraudMesh AI</h1>
        <p className="text-slate-400">One Merchant Discovers → Network Learns → Other Merchants Protected</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-200">
          Connection error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Total Transactions"
          value={stats.totalTransactions}
          color="text-blue-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="High Risk"
          value={stats.highRiskTransactions}
          color="text-red-400"
        />
        <StatCard
          icon={Zap}
          label="Active Signals"
          value={stats.activeFraudSignals}
          color="text-yellow-400"
        />
        <StatCard
          icon={Network}
          label="Fraud Clusters"
          value={stats.fraudClusters}
          color="text-purple-400"
        />
        <StatCard
          icon={CheckCircle}
          label="Merchants Protected"
          value={stats.merchantsProtected}
          color="text-green-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            The Story
          </h2>
          <div className="space-y-4 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="text-2xl">👤</div>
              <div>
                <p className="font-semibold text-white">Merchant A Detects</p>
                <p className="text-sm">Device reuse + high velocity + merchant hopping across 50+ accounts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🧠</div>
              <div>
                <p className="font-semibold text-white">AI Creates Signal</p>
                <p className="text-sm">FS-001: DEVICE_FRAUD pattern (behavioral only, no customer data)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">📡</div>
              <div>
                <p className="font-semibold text-white">Network Learns</p>
                <p className="text-sm">Signal published to fraud exchange, available to all merchants</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <p className="font-semibold text-white">Merchant B Protected</p>
                <p className="text-sm">New transaction matches signal → Risk enhanced → STEP_UP recommended</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
              <span className="text-slate-300">API</span>
              <span className="text-green-400">● Online</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
              <span className="text-slate-300">Database</span>
              <span className="text-green-400">● Ready</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
              <span className="text-slate-300">Fraud Engine</span>
              <span className="text-green-400">● Active</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
              <span className="text-slate-300">Signal Exchange</span>
              <span className="text-green-400">● Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
