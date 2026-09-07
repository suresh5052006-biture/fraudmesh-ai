import React, { useEffect, useState } from 'react';
import { Shield, Scan, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import soundService from '../services/audio';

const SCAN_STEPS = [
  { id: 'velocity', label: 'Velocity Check', status: 'pending' },
  { id: 'device', label: 'Device Fingerprint', status: 'pending' },
  { id: 'network', label: 'Network Analysis', status: 'pending' },
  { id: 'merchant', label: 'Merchant Risk', status: 'pending' },
  { id: 'behavior', label: 'Behavioral Analysis', status: 'pending' },
  { id: 'signals', label: 'Signal Matching', status: 'pending' },
  { id: 'ml', label: 'ML Scoring', status: 'pending' },
  { id: 'final', label: 'Final Verdict', status: 'pending' },
];

const FraudGateOverlay = ({ isVisible, onComplete, riskResult }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [steps, setSteps] = useState(SCAN_STEPS.map(s => ({ ...s })));
  const [verdict, setVerdict] = useState(null);
  const [riskScore, setRiskScore] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(-1);
      setSteps(SCAN_STEPS.map(s => ({ ...s, status: 'pending' })));
      setVerdict(null);
      setRiskScore(0);
      return;
    }

    soundService.playScan();
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < SCAN_STEPS.length) {
        setSteps(prev => prev.map((s, i) => {
          if (i < stepIndex) return { ...s, status: 'done' };
          if (i === stepIndex) return { ...s, status: 'active' };
          return { ...s, status: 'pending' };
        }));
        setCurrentStep(stepIndex);
        setProgress(((stepIndex + 1) / SCAN_STEPS.length) * 100);
        stepIndex++;
      } else {
        clearInterval(interval);
        const finalScore = riskResult?.risk_score || 0;
        const action = riskResult?.recommended_action || 'ALLOW';
        setRiskScore(finalScore);
        
        if (action === 'BLOCK') {
          setVerdict('blocked');
          soundService.playAlert();
        } else if (action === 'STEP_UP') {
          setVerdict('stepup');
          soundService.playStepUp();
        } else {
          setVerdict('cleared');
          soundService.playApproved();
        }

        setTimeout(() => {
          onComplete?.({ verdict, riskScore: finalScore, action });
        }, 1500);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getVerdictIcon = () => {
    switch (verdict) {
      case 'cleared':
        return <CheckCircle size={48} className="text-emerald-400" />;
      case 'stepup':
        return <AlertTriangle size={48} className="text-amber-400" />;
      case 'blocked':
        return <XCircle size={48} className="text-red-400" />;
      default:
        return <Shield size={48} className="text-indigo-400 animate-pulse" />;
    }
  };

  const getVerdictColor = () => {
    switch (verdict) {
      case 'cleared': return 'text-emerald-400';
      case 'stepup': return 'text-amber-400';
      case 'blocked': return 'text-red-400';
      default: return 'text-indigo-400';
    }
  };

  const getVerdictText = () => {
    switch (verdict) {
      case 'cleared': return 'Transaction Cleared';
      case 'stepup': return 'Step-Up Verification Required';
      case 'blocked': return 'Transaction Blocked';
      default: return 'Scanning...';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-transparent to-cyan-950/30" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Scanning Circle */}
        <div className="relative mx-auto mb-8" style={{ width: 180, height: 180 }}>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <div
            className="absolute inset-2 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"
            style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
          />
          <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-purple-400 animate-spin" style={{ animationDuration: '2s' }} />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {verdict ? getVerdictIcon() : <Scan size={40} className="text-indigo-400 animate-pulse" />}
              {verdict && (
                <p className={`mt-2 font-bold ${getVerdictColor()}`}>
                  {riskScore}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-1">
            FraudGate Scanning
          </h2>
          <p className={`text-sm ${verdict ? getVerdictColor() : 'text-slate-400'}`}>
            {getVerdictText()}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">
            {verdict ? 'Processing complete' : `${Math.round(progress)}% complete`}
          </p>
        </div>

        {/* Scan Steps */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-2">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  step.status === 'done'
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : step.status === 'active'
                    ? 'bg-indigo-500/10 border border-indigo-500/50 animate-pulse'
                    : 'bg-slate-800/50 border border-slate-700/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {step.status === 'done' ? (
                    <CheckCircle size={14} className="text-emerald-400" />
                  ) : step.status === 'active' ? (
                    <Loader2 size={14} className="text-indigo-400 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600" />
                  )}
                </div>
                <span className={`text-xs truncate ${
                  step.status === 'done' ? 'text-emerald-400' : 
                  step.status === 'active' ? 'text-indigo-300' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors (if any) */}
        {riskResult?.signals && riskResult.signals.length > 0 && verdict && (
          <div className="mt-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-2 font-medium">Risk Signals Detected:</p>
            <div className="flex flex-wrap gap-1">
              {riskResult.signals.slice(0, 3).map((signal, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-300 rounded border border-red-500/30"
                >
                  {signal.signal_type?.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudGateOverlay;
