import { useState } from 'react'
import Dashboard from './components/Dashboard'
import FraudSignals from './components/FraudSignals'
import RiskCheck from './components/RiskCheck'
import DemoFlow from './components/DemoFlow'
import { Menu, X } from 'lucide-react'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'signals', label: 'Fraud Signals', icon: '⚡' },
    { id: 'risk-check', label: 'Risk Check', icon: '🔍' },
    { id: 'demo', label: 'Demo', icon: '▶️' },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'signals':
        return <FraudSignals />
      case 'risk-check':
        return <RiskCheck />
      case 'demo':
        return <DemoFlow />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <div
        className={`${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static w-64 h-screen bg-slate-900 border-r border-slate-700 p-6 transition-transform z-50`}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🛡️ FraudMesh
          </h1>
          <p className="text-xs text-slate-400 mt-2">AI Fraud Detection</p>
        </div>

        <nav className="space-y-2">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id)
                setMobileMenuOpen(false)
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                currentPage === item.id
                  ? 'bg-red-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-slate-700">
          <div className="text-xs text-slate-400 space-y-2">
            <p>🟢 API: Connected</p>
            <p>🟢 Database: Ready</p>
            <p>🟢 Engine: Active</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-red-600 rounded-lg text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Page Content */}
        {renderPage()}
      </div>
    </div>
  )
}

export default App
