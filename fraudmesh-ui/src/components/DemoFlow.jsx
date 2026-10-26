import React, { useState } from 'react';
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Radio, 
  Zap, 
  Lock, 
  ArrowRight,
  Bot,
  RefreshCw,
  Hash,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import apiService from '../services/api';
import soundService from '../services/audio';

const DemoFlow = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);

  const runDemo = async () => {
    try {
      soundService.playScan();
      setRunning(true);
      setError(null);
      setResult(null);

      const data = await apiService.runDemo();
      setResult(data);
      soundService.playApproved();
    } catch (err) {
      setError(err.message || 'Error executing fraud attack simulation');
      soundService.playAlert();
    } finally {
      setRunning(false);
    }
  };

  const toggleStep = (idx) => {
    setExpandedStep(expandedStep === idx ? null : idx);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Play className="text-red-400 fill-red-400/20" size={24} />
            Coordinated Fraud Ring Attack Simulator
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            End-to-end demonstration: Ring detection, privacy-preserving signal creation, network broadcast, and automated Sentinel defense
          </p>
        </div>

        <div>
          <button
            onClick={runDemo}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs font-mono transition shadow-lg shadow-indigo-600/25"
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            <span>{running ? 'Simulating Ring Attack...' : 'Launch Live Simulation'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-xs font-mono flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
          <span>Simulation error: {error}</span>
        </div>
      )}

      {/* Progress / Running State Banner */}
      {running && (
        <div className="p-6 bg-slate-900/90 border border-indigo-500/30 rounded-2xl shadow-xl flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <RefreshCw size={20} className="animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-mono">
              Coordinated Attack Scenario in Progress
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Traversing graph clusters, generating FS-001 signal, broadcasting across 20 merchants, and verifying Sentinel OTP challenge...
            </p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result ? (
        <div className="space-y-6">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Simulation Status</span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>{result.status?.toUpperCase() || 'COMPLETED'}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Duration: {result.duration_seconds ? result.duration_seconds.toFixed(2) : '1.2'}s
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Detected Fraud Ring</span>
              <div className="text-xl font-black font-mono text-red-400 mt-1">
                {result.detected_fraud_ring?.cluster_id || 'Cluster Ring FR003'}
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Risk Score: {result.detected_fraud_ring?.risk_score || 100}/100
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Published Signal</span>
              <div className="text-xl font-black font-mono text-amber-400 mt-1">
                {result.generated_signal?.signal_id || 'FS-001'}
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Confidence: {Math.round((result.generated_signal?.confidence || 0.93) * 100)}%
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Gateway Outcome</span>
              <div className="text-xl font-black font-mono text-indigo-400 mt-1">
                {result.recommendation || 'STEP_UP / BLOCK'}
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                Merchants Defended: {result.summary?.merchants_involved || 2}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          {result.steps && result.steps.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={16} className="text-indigo-400" />
                  Forensic Execution Timeline ({result.steps.length} Steps)
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Click step to view data payload
                </span>
              </div>

              <div className="space-y-2.5">
                {result.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-800/80 rounded-xl bg-slate-950/70 overflow-hidden transition"
                  >
                    <button
                      onClick={() => toggleStep(idx)}
                      className="w-full p-3.5 text-left flex items-center justify-between hover:bg-slate-800/30 transition text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-[11px]">
                          {step.step || idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200 font-sans text-xs">
                            {step.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {step.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {step.result && (
                          <span className="hidden sm:inline px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {step.result}
                          </span>
                        )}
                        {expandedStep === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {expandedStep === idx && step.data && (
                      <div className="p-3 bg-slate-900/90 border-t border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                        <pre className="overflow-x-auto p-2.5 bg-slate-950 rounded-lg text-indigo-300">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Achievements Card */}
          {result.summary?.key_achievements && (
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                Key Simulation Achievements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                {result.summary.key_achievements.map((item, i) => (
                  <div key={i} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span>{item.replace(/\?\u0085/g, '✓')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty / Idle State */
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 via-indigo-500/20 to-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Play size={28} className="translate-x-0.5" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">
              Ready to Launch Cross-Merchant Attack Scenario
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the button above to simulate a coordinated fraud attack across Merchant A and Merchant B. The system will detect the ring, generate a zero-knowledge signal, and trigger defense in real time.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={runDemo}
              disabled={running}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold font-mono transition shadow-md shadow-indigo-600/30 inline-flex items-center gap-2"
            >
              <Play size={13} />
              <span>Launch Demo Attack</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoFlow;
