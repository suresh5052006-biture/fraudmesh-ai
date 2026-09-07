import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ShieldCheck, ShieldAlert, AlertTriangle, Lock } from 'lucide-react';

const RiskRadarGauge = ({ riskScore = 72, signals = [] }) => {
  // Map signals to 9 radar dimensions
  const signalDimensions = [
    { key: 'velocity', name: 'Velocity Spike', default: 20 },
    { key: 'device', name: 'Device Reuse', default: 25 },
    { key: 'ip_proxy', name: 'IP / Proxy Risk', default: 15 },
    { key: 'card_hopping', name: 'Card Hopping', default: 10 },
    { key: 'merchant_hopping', name: 'Mch Hopping', default: 30 },
    { key: 'amount', name: 'Amt Anomaly', default: 15 },
    { key: 'geo', name: 'Geo Mismatch', default: 10 },
    { key: 'behavioral', name: 'Behavior Dev', default: 20 },
    { key: 'network', name: 'Network Cluster', default: 35 },
  ];

  const radarData = signalDimensions.map(dim => {
    const matchedSignal = signals.find(s => 
      s.signal_type?.toLowerCase().includes(dim.key) || 
      s.description?.toLowerCase().includes(dim.key)
    );
    const value = matchedSignal ? Math.min(100, Math.max(30, matchedSignal.score_contribution * 2.5)) : dim.default;
    return {
      subject: dim.name,
      value: Math.round(value),
      fullMark: 100,
    };
  });

  const getDecisionBand = (score) => {
    if (score < 50) return { action: 'ALLOW', color: 'emerald', text: 'Low Risk — Process Payment', icon: ShieldCheck, desc: 'Normal customer behavior pattern.' };
    if (score < 70) return { action: 'STEP_UP', color: 'amber', text: 'Moderate Risk — Trigger OTP / 2FA', icon: ShieldAlert, desc: 'Behavioral anomalies require 2FA verification.' };
    if (score < 85) return { action: 'REVIEW', color: 'purple', text: 'High Risk — Route to Analyst Queue', icon: AlertTriangle, desc: 'Multiple fraud signals present; hold for manual check.' };
    return { action: 'BLOCK', color: 'red', text: 'Critical Risk — Auto Decline', icon: Lock, desc: 'High confidence cross-merchant fraud match.' };
  };

  const currentDecision = getDecisionBand(riskScore);
  const ActionIcon = currentDecision.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
      {/* Left: 9-Signal Risk Radar */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            9-Signal Forensic Radar
          </h3>
          <span className="text-xs text-slate-400 font-mono">9 Signal Engines Active</span>
        </div>

        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
              <Radar
                name="Risk Signal"
                dataKey="value"
                stroke="#6366f1"
                fill="#818cf8"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Decision Spectrum Gauge */}
      <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Decision & Action Spectrum</h3>
            <span className="text-xs font-mono text-slate-400">Score Range: 0 - 100</span>
          </div>

          {/* Large Score Indicator */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-5xl font-extrabold text-white tracking-tight">{riskScore}</span>
            <span className="text-slate-400 text-sm font-mono">/ 100 Risk Score</span>
          </div>

          {/* Spectrum Bar */}
          <div className="relative mb-6">
            <div className="h-4 w-full rounded-full flex overflow-hidden p-0.5 bg-slate-950 border border-slate-800">
              <div className="w-[50%] bg-gradient-to-r from-emerald-500 to-emerald-400" title="ALLOW (0-49)" />
              <div className="w-[20%] bg-gradient-to-r from-amber-500 to-amber-400" title="STEP_UP (50-69)" />
              <div className="w-[15%] bg-gradient-to-r from-purple-500 to-purple-400" title="REVIEW (70-84)" />
              <div className="w-[15%] bg-gradient-to-r from-red-500 to-red-600" title="BLOCK (85-100)" />
            </div>

            {/* Score Pointer Needle */}
            <div
              className="absolute -top-2 transition-all duration-500 transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${Math.min(100, Math.max(0, riskScore))}%` }}
            >
              <div className="w-4 h-4 bg-white border-2 border-indigo-600 rounded-full shadow-lg" />
              <div className="w-0.5 h-3 bg-white" />
            </div>

            {/* Labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
              <span className="text-emerald-400">0 ALLOW</span>
              <span className="text-amber-400">50 STEP_UP</span>
              <span className="text-purple-400">70 REVIEW</span>
              <span className="text-red-400">85 BLOCK 100</span>
            </div>
          </div>

          {/* Recommended Action Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              currentDecision.color === 'emerald'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                : currentDecision.color === 'amber'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                : currentDecision.color === 'purple'
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-200'
                : 'bg-red-500/10 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <ActionIcon className="w-6 h-6 flex-shrink-0" />
              <div>
                <span className="text-xs uppercase font-mono tracking-wider opacity-75">Recommended Outcome</span>
                <h4 className="text-lg font-bold tracking-wide">{currentDecision.action}</h4>
              </div>
            </div>
            <p className="text-xs opacity-90">{currentDecision.text}</p>
            <p className="text-[11px] mt-1 opacity-75 italic">{currentDecision.desc}</p>
          </div>
        </div>

        {/* Intelligence Note */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          💡 <span className="font-semibold text-slate-300">Smart Recommendation Engine:</span> Uses network intelligence boost to avoid over-blocking legitimate customers while triggering OTP friction for suspicious patterns.
        </div>
      </div>
    </div>
  );
};

export default RiskRadarGauge;
