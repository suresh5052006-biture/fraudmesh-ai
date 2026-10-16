import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import FraudSignals from './components/FraudSignals';
import RiskCheck from './components/RiskCheck';
import DemoFlow from './components/DemoFlow';
import AIAgentConsole from './components/AIAgentConsole';
import CheckoutPage from './components/CheckoutPage';
import soundService from './services/audio';
import apiService from './services/api';
import { Menu, X, Shield, Activity, ShieldCheck, Zap, Bot, Bell } from 'lucide-react';
import Sidebar from './components/Sidebar';

const ROUTE_META = {
  '/dashboard':  { title: 'Executive Risk Dashboard', subtitle: 'Live transaction telemetry & graph cluster topology' },
  '/risk-check': { title: '9-Signal Forensic Risk Radar', subtitle: 'Deterministic score calculation with explainable vectors' },
  '/signals':    { title: 'Privacy-Preserving Signal Exchange', subtitle: 'Zero-PII decentralized cross-merchant intelligence pool' },
  '/checkout':   { title: 'Merchant Gateway Checkout Simulator', subtitle: 'End-user payment flow with automatic 3DS / OTP step-up' },
  '/agent':      { title: 'FraudMesh Sentinel AI Investigator', subtitle: 'Autonomous forensic reasoning & risk policy advisor' },
  '/simulation': { title: 'End-to-End Fraud Attack Simulator', subtitle: 'Live coordinated ring attack detection demonstration' },
};

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');
  const location = useLocation();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await apiService.getHealth();
        setBackendStatus(res?.service ? 'connected' : 'mock');
      } catch {
        setBackendStatus('mock');
      }
    };
    checkStatus();
  }, []);

  const toggleSound = () => {
    const nextState = soundService.toggleSound();
    setSoundEnabled(nextState);
  };

  const currentMeta = ROUTE_META[location.pathname] || {
    title: 'FraudMesh AI',
    subtitle: 'Decentralized Fraud Signal Exchange',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#060a14] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        soundService={soundService}
      />

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                  {currentMeta.title}
                </h1>
              </div>
              <p className="hidden sm:block text-xs text-slate-400 truncate">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Status Pill & Quick Action Links */}
          <div className="flex items-center gap-2.5">
            {/* Backend Connectivity Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>{backendStatus === 'connected' ? 'Live API Connected' : 'Mock Shield Active'}</span>
            </div>

            {/* Merchant ID Tag */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[11px] font-mono text-indigo-300">
              <ShieldCheck size={12} className="text-indigo-400" />
              <span>Merchant: MER0005 (Active)</span>
            </div>

            {/* Quick Action Button to Sentinel */}
            <Link
              to="/agent"
              onClick={() => soundService.playClick()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-sm shadow-indigo-600/30"
            >
              <Bot size={14} />
              <span className="hidden sm:inline">Ask AI Sentinel</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Page Canvas */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#060a14] via-[#080e1e] to-[#060a14] relative">
          <Routes>
            <Route path="/"            element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/risk-check"  element={<RiskCheck />} />
            <Route path="/signals"     element={<FraudSignals />} />
            <Route path="/checkout"    element={<CheckoutPage />} />
            <Route path="/agent"       element={<AIAgentConsole />} />
            <Route path="/simulation"  element={<DemoFlow />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
