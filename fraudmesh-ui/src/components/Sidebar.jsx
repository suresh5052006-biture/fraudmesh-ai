import React from 'react';
import { Shield, Volume2, VolumeX, Activity } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard',   icon: '⬡', label: 'Dashboard',             sub: 'Live Overview'        },
  { to: '/risk-check',  icon: '◈', label: 'Risk Check & Radar',    sub: '9-Signal Engine'      },
  { to: '/signals',     icon: '⚡', label: 'Signal Exchange',       sub: 'Merchant Network'     },
  { to: '/checkout',    icon: '◻', label: 'Checkout',              sub: 'Payment Sim'          },
  { to: '/agent',       icon: '◉', label: 'AI Sentinel',           sub: 'Forensic Console'     },
  { to: '/simulation',  icon: '▷', label: 'Attack Simulation',     sub: 'Demo Flow'            },
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
        transition-transform duration-300
        z-50
      `}
      style={{
        background: 'rgba(6, 10, 20, 0.97)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* ── Logo ── */}
      <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            flexShrink: 0,
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              FraudMesh
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#818cf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              AI · v1.0 MVP
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 8,
        }}>
          <span className="pulse-dot" style={{ width: 6, height: 6 }} />
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 600 }}>
            Systems Operational
          </span>
          <Activity size={11} color="#34d399" style={{ marginLeft: 'auto' }} />
        </div>
      </div>

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.05)', margin: '0.25rem 0' }} />

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.875rem' }}>
        <div style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.25rem 0.5rem', marginBottom: '0.5rem' }}>
          Navigation
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { soundService?.playClick(); setMobileMenuOpen(false); }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 10,
                textDecoration: 'none',
                border: '1px solid transparent',
                transition: 'all 0.18s ease',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                borderColor: isActive ? 'rgba(99,102,241,0.35)' : 'transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem',
                    background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3,
                      color: isActive ? '#a5b4fc' : '#cbd5e1',
                      transition: 'color 0.15s',
                    }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                      {item.sub}
                    </div>
                  </div>
                  {isActive && (
                    <div style={{
                      marginLeft: 'auto', width: 4, height: 20, borderRadius: 2,
                      background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                    }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div style={{ padding: '1rem 0.875rem 1.25rem' }}>
        <div style={{
          padding: '0.75rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          marginBottom: '0.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Zero-PII Engine</span>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 700 }}>Active</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Graph Topology</span>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#818cf8', fontWeight: 700 }}>Synced</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>9 Signals</span>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#fbbf24', fontWeight: 700 }}>Online</span>
          </div>
        </div>

        <button
          onClick={toggleSound}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
            color: soundEnabled ? '#34d399' : 'var(--text-muted)',
            fontSize: '0.75rem', fontWeight: 500, transition: 'all 0.15s',
          }}
        >
          {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          <span>{soundEnabled ? 'Audio Cues ON' : 'Audio Muted'}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
