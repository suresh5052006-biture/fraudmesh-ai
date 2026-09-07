import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import FraudSignals from './components/FraudSignals'
import RiskCheck from './components/RiskCheck'
import DemoFlow from './components/DemoFlow'
import AIAgentConsole from './components/AIAgentConsole'
import CheckoutPage from './components/CheckoutPage'
import soundService from './services/audio'
import { Menu, X, Shield } from 'lucide-react'
import Sidebar from './components/Sidebar';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const nextState = soundService.toggleSound();
    setSoundEnabled(nextState);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        soundService={soundService}
      />

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 40,
          }}
        />
      )}

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Mobile top bar */}
        <div
          className="lg:hidden"
          style={{
            padding: '0.875rem 1.25rem',
            background: 'rgba(6,10,20,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              FraudMesh AI
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '0.375rem', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Scrollable page content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route path="/"            element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/risk-check"  element={<RiskCheck />} />
            <Route path="/signals"     element={<FraudSignals />} />
            <Route path="/checkout"    element={<CheckoutPage />} />
            <Route path="/agent"       element={<AIAgentConsole />} />
            <Route path="/simulation"  element={<DemoFlow />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
