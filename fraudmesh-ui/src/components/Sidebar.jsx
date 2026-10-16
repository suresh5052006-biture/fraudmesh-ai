import React from 'react';
import { 
  Shield, 
  Volume2, 
  VolumeX, 
  Activity, 
  LayoutDashboard, 
  ShieldAlert, 
  Radio, 
  CreditCard, 
  Bot, 
  PlaySquare, 
  ExternalLink 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',             sub: 'Live Overview', badge: '15k' },
  { to: '/risk-check',  icon: ShieldAlert,     label: 'Risk Check & Radar',    sub: '9-Signal Engine', badge: 'Live' },
  { to: '/signals',     icon: Radio,           label: 'Signal Exchange',       sub: 'Threat Intelligence', badge: 'Active' },
  { to: '/checkout',    icon: CreditCard,      label: 'Checkout Simulator',    sub: 'Gateway & 3DS' },
  { to: '/agent',       icon: Bot,             label: 'AI Sentinel',           sub: 'Forensic Assistant' },
  { to: '/simulation',  icon: PlaySquare,      label: 'Attack Simulation',     sub: 'Demo Flow' },
];

function Sidebar({ mobileMenuOpen, setMobileMenuOpen, soundEnabled, toggleSound, soundService }) {
  return (
    <aside
      className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:static
        w-64 h-screen
        flex flex-col
        transition-transform duration-300 ease-in-out
        z-50
        bg-slate-950/95
        border-r border-slate-800/80
        backdrop-blur-xl
        select-none
      `}
    >
      {/* ── Brand Logo Header ── */}
      <div className="p-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0 border border-indigo-400/20">
            <Shield size={20} className="text-white drop-shadow" />
          </div>
          <div>
            <div className="font-extrabold text-base text-slate-100 tracking-tight leading-tight flex items-center gap-1.5">
              FraudMesh <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono font-semibold">AI</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Razorpay Risk Track
            </div>
          </div>
        </div>

        {/* Live Systems Status Pill */}
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-semibold text-emerald-400 tracking-wide">
              SYSTEMS ACTIVE
            </span>
          </div>
          <Activity size={13} className="text-emerald-400" />
        </div>
      </div>

      <div className="w-full h-px bg-slate-800/80 my-1" />

      {/* ── Navigation Menu ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-3 py-1.5">
          Main Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                soundService?.playClick();
                setMobileMenuOpen(false);
              }}
              className={({ isActive }) => `
                group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative
                ${isActive 
                  ? 'bg-indigo-600/15 text-white border border-indigo-500/35 shadow-sm shadow-indigo-500/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' 
                      : 'bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:border-slate-700'
                    }
                  `}>
                    <Icon size={16} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-semibold leading-tight ${isActive ? 'text-indigo-200' : 'text-slate-300'}`}>
                        {item.label}
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          isActive 
                            ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/30' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                      {item.sub}
                    </div>
                  </div>

                  {isActive && (
                    <div className="w-1.5 h-6 rounded-full bg-indigo-500 absolute right-1" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer Stats & Audio Toggle ── */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2.5">
        <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-2 text-[11px] font-mono">
          <div className="flex justify-between items-center text-slate-400">
            <span>Zero-PII Shield</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verified
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Network Cluster</span>
            <span className="text-indigo-400 font-bold">5 Rings</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Signal Protocol</span>
            <span className="text-amber-400 font-bold">SHA-256</span>
          </div>
        </div>

        <button
          onClick={toggleSound}
          className={`
            w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-colors
            ${soundEnabled 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-800'
            }
          `}
          title="Toggle UI audio effects"
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span>{soundEnabled ? 'Sound FX Enabled' : 'Sound Muted'}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
