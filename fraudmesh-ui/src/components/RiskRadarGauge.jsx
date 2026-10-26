import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Lock, 
  Activity, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const SIGNAL_ENGINES = [
  { key: 'velocity',           name: 'Velocity Spike',   desc: 'Transaction frequency anomaly within time window' },
  { key: 'device',             name: 'Device Reuse',     desc: 'Hardware fingerprint attached to multiple accounts' },
  { key: 'ip_proxy',           name: 'IP / Proxy Risk',  desc: 'High-risk subnet, VPN exit node, or TOR relay' },
  { key: 'card_hopping',       name: 'Card Hopping',     desc: 'Rapid card cycling or payment instrument reuse' },
  { key: 'merchant_hopping',   name: 'Mch Hopping',      desc: 'Rapid cross-merchant checkout pattern' },
  { key: 'amount',             name: 'Amt Anomaly',      desc: 'Significant deviation from customer baseline spend' },
  { key: 'geo',                name: 'Geo Mismatch',     desc: 'Improbable geographical distance velocity' },
  { key: 'behavioral',         name: 'Behavior Dev',     desc: 'Client-side typing/session behavioral deviation' },
  { key: 'network',            name: 'Network Cluster',  desc: 'Salted hash match in merchant threat pool' },
];

const RiskRadarGauge = ({ riskScore = null, signals = [], isEvaluated = false }) => {
  const displayScore = isEvaluated && riskScore !== null ? riskScore : 0;

  const radarData = SIGNAL_ENGINES.map((dim) => {
    if (!isEvaluated) {
      return { subject: dim.name, value: 10, fullMark: 100 };
    }

    const matchedSignal = signals.find((s) =>
      s.signal_type?.toLowerCase().includes(dim.key) ||
      s.description?.toLowerCase().includes(dim.key)
    );

    const val = matchedSignal
      ? Math.min(100, Math.max(30, (matchedSignal.score_contribution || 20) * 2.5))
      : 15;

    return {
      subject: dim.name,
      value: Math.round(val),
      fullMark: 100,
    };
  });

  const getDecisionBand = (score) => {
    if (!isEvaluated) {
      return {
        action: 'STANDBY',
        color: 'slate',
        text: 'Ready for Transaction Analysis',
        icon: Activity,
        desc: 'Select a preset or enter parameters to evaluate risk.',
      };
    }
    if (score < 50) {
      return {
        action: 'ALLOW',
        color: 'emerald',
        text: 'Low Risk — Direct Gateway Approval',
        icon: ShieldCheck,
        desc: 'Consistent with normal cardholder purchase behavior.',
      };
    }
    if (score < 70) {
      return {
        action: 'STEP_UP',
        color: 'amber',
        text: 'Moderate Risk — Trigger 3DS / OTP Challenge',
        icon: ShieldAlert,
        desc: 'Friction applied to stop bot scripts while safeguarding legitimate buyers.',
      };
    }
    if (score < 85) {
      return {
        action: 'REVIEW',
        color: 'purple',
        text: 'High Risk — Route to Risk Analyst Queue',
        icon: AlertTriangle,
        desc: 'Multiple coordinated signals detected. Manual verification recommended.',
      };
    }
    return {
      action: 'BLOCK',
      color: 'red',
      text: 'Critical Threat — Auto-Decline Pre-Auth',
      icon: Lock,
      desc: 'High confidence cross-merchant fraud ring match. Declined immediately.',
    };
  };

  const currentDecision = getDecisionBand(displayScore);
  const ActionIcon = currentDecision.icon;

  return (
    <div className="space-y-6">
      {/* Top Card: Radar & Decision Spectrum */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: 9-Signal Forensic Radar */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isEvaluated ? 'bg-indigo-400 animate-ping' : 'bg-slate-600'}`} />
              9-Signal Forensic Radar
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {isEvaluated ? `${signals.length} Signals Fired` : 'Awaiting Input'}
            </span>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
                <Radar
                  name="Risk Signal"
                  dataKey="value"
                  stroke={isEvaluated ? '#6366f1' : '#475569'}
                  fill={isEvaluated ? '#818cf8' : '#334155'}
                  fillOpacity={isEvaluated ? 0.45 : 0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Score & Spectrum */}
        <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-6 lg:pt-0 lg:pl-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Composite Risk Assessment
              </span>
              <span className="text-[11px] font-mono text-slate-400">Score Range: 0 - 100</span>
            </div>

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-5xl font-black font-mono text-white tracking-tight">
                {isEvaluated ? displayScore : '--'}
              </span>
              <span className="text-slate-400 text-xs font-mono">
                {isEvaluated ? '/ 100 Risk Index' : 'Awaiting Execution'}
              </span>
            </div>

            {/* Decision Spectrum Bar */}
            <div className="relative mb-6">
              <div className="h-3 w-full rounded-full flex overflow-hidden p-0.5 bg-slate-950 border border-slate-800">
                <div className="w-[50%] bg-emerald-500" title="ALLOW (0-49)" />
                <div className="w-[20%] bg-amber-500" title="STEP_UP (50-69)" />
                <div className="w-[15%] bg-purple-500" title="REVIEW (70-84)" />
                <div className="w-[15%] bg-red-500" title="BLOCK (85-100)" />
              </div>

              {/* Needle Indicator */}
              {isEvaluated && (
                <div
                  className="absolute -top-1.5 transition-all duration-500 transform -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${Math.min(100, Math.max(0, displayScore))}%` }}
                >
                  <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-lg" />
                  <div className="w-0.5 h-2.5 bg-white" />
                </div>
              )}

              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
                <span className="text-emerald-400 font-semibold">0 ALLOW</span>
                <span className="text-amber-400 font-semibold">50 STEP_UP</span>
                <span className="text-purple-400 font-semibold">70 REVIEW</span>
                <span className="text-red-400 font-semibold">85 BLOCK</span>
              </div>
            </div>

            {/* Recommended Action Box */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                currentDecision.color === 'emerald'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : currentDecision.color === 'amber'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : currentDecision.color === 'purple'
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                  : currentDecision.color === 'red'
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3 mb-1.5">
                <ActionIcon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">
                    Recommended Gateway Verdict
                  </span>
                  <h4 className="text-base font-bold tracking-wide font-mono">
                    {currentDecision.action}
                  </h4>
                </div>
              </div>
              <p className="text-xs opacity-90">{currentDecision.text}</p>
              <p className="text-[11px] mt-1 opacity-70 italic">{currentDecision.desc}</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info size={13} className="text-indigo-400 flex-shrink-0" />
            <span>FraudMesh AI uses network intelligence to avoid over-blocking legitimate customers.</span>
          </div>
        </div>
      </div>

      {/* 9-Signal Forensic Breakdown Table */}
      {isEvaluated && signals.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              Detected Risk Signals & Evidence Breakdown
            </h4>
            <span className="text-xs font-mono text-slate-400">
              {signals.length} Triggered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80">
                  <th className="py-2 px-3">Signal Type</th>
                  <th className="py-2 px-3">Forensic Description</th>
                  <th className="py-2 px-3 text-right">Score Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {signals.map((sig, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-indigo-300">
                      {sig.signal_type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">
                      {sig.description}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                      +{sig.score_contribution} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskRadarGauge;
