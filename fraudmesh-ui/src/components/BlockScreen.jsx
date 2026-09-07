import React from 'react';
import { XCircle, ShieldX, AlertOctagon, RefreshCw, Mail, ArrowLeft } from 'lucide-react';

const BLOCK_REASONS = {
  'VELOCITY_EXCEEDED': {
    title: 'Velocity Limit Exceeded',
    description: 'This transaction was blocked because it exceeds the maximum number of transactions allowed within a short time period.',
    icon: AlertOctagon
  },
  'HIGH_RISK_MERCHANT': {
    title: 'High-Risk Merchant',
    description: 'This transaction was blocked due to elevated risk signals from the merchant category or merchant history.',
    icon: ShieldX
  },
  'DEVICE_MISMATCH': {
    title: 'Device Mismatch Detected',
    description: 'This transaction was blocked because the device fingerprint does not match your usual devices.',
    icon: XCircle
  },
  'NETWORK_ANOMALY': {
    title: 'Network Anomaly Detected',
    description: 'This transaction was blocked due to suspicious network patterns or VPN/proxy usage.',
    icon: AlertOctagon
  },
  'AMOUNT_THRESHOLD': {
    title: 'Amount Threshold Exceeded',
    description: 'This transaction exceeds your daily transaction limit. Please contact support for assistance.',
    icon: ShieldX
  },
  'FRAUD_PATTERN': {
    title: 'Fraud Pattern Match',
    description: 'This transaction matches known fraud patterns in our system and has been blocked for your protection.',
    icon: XCircle
  },
  'DEFAULT': {
    title: 'Transaction Blocked',
    description: 'This transaction was blocked by our fraud prevention system. Please try a different payment method or contact support.',
    icon: XCircle
  }
};

const BlockScreen = ({ isVisible, onTryAgain, onContactSupport, onBackToStore, reason, riskScore }) => {
  if (!isVisible) return null;

  const blockInfo = BLOCK_REASONS[reason] || BLOCK_REASONS['DEFAULT'];
  const Icon = blockInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/50 via-transparent to-slate-950" />
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-400/20 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md mx-4 text-center">
        {/* Block Icon */}
        <div className="relative mx-auto mb-8" style={{ width: 160, height: 160 }}>
          <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-red-500/15" />
          <div className="absolute inset-8 rounded-full bg-red-500/20 border-2 border-red-500/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/30">
              <Icon size={40} className="text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">
          Transaction Blocked
        </h1>
        <p className="text-slate-400 mb-2">
          {blockInfo.title}
        </p>
        {riskScore && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full mb-6">
            <span className="text-xs text-red-300 font-mono">Risk Score:</span>
            <span className="text-sm font-bold text-red-400">{riskScore}</span>
          </div>
        )}

        {/* Reason Card */}
        <div className="bg-slate-900/80 border border-red-500/30 rounded-xl p-5 mb-8 text-left">
          <div className="flex items-start gap-3">
            <AlertOctagon size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Why was this blocked?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {blockInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Fraud Protection Info */}
        <div className="flex items-center justify-center gap-2 mb-8 text-xs text-slate-500">
          <ShieldX size={14} className="text-slate-600" />
          <span>Protected by FraudMesh AI</span>
          <span>•</span>
          <span>No charges were made</span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onTryAgain}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Try Different Payment Method
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onContactSupport}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              Contact Support
            </button>
            <button
              onClick={onBackToStore}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Store
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-slate-600">
          If you believe this was a mistake, please contact our support team with your transaction details.
        </p>
      </div>
    </div>
  );
};

export default BlockScreen;
