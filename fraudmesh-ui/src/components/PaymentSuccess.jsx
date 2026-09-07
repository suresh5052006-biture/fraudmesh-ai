import React, { useEffect, useState } from 'react';
import { CheckCircle, Shield, FileText, ShoppingBag, Printer, Share2, ArrowRight, Sparkles } from 'lucide-react';
import soundService from '../services/audio';

const PaymentSuccess = ({ isVisible, onContinue, transactionDetails }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (isVisible) {
      soundService.playApproved();
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const {
    amount = 0,
    riskScore = 0,
    riskLevel = 'Low',
    paymentMethod = 'card',
    merchant = 'Store',
    transactionId = 'TXN' + Date.now().toString().slice(-8),
    timestamp = new Date().toISOString()
  } = transactionDetails || {};

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-auto py-8">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#22d3ee'][Math.floor(Math.random() * 5)],
                animationDuration: `${2 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative w-full max-w-lg mx-4">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden">
          {/* Success Header */}
          <div className="p-8 text-center bg-gradient-to-b from-emerald-950/50 to-transparent">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <CheckCircle size={40} className="text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-slate-400">
              Your transaction has been completed securely
            </p>

            {/* Amount */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Amount Paid</p>
              <p className="text-4xl font-bold text-emerald-400">
                ${amount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Fraud Clearance Summary */}
          <div className="p-6 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-emerald-400" />
              <h3 className="font-semibold text-white">FraudMesh AI Clearance</h3>
              <span className="ml-auto text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      style={{ width: `${100 - riskScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{riskScore}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Risk Level</p>
                <p className="text-sm font-bold text-emerald-400">{riskLevel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-4">
              <Sparkles size={16} className="text-emerald-400" />
              <div>
                <p className="text-xs text-emerald-300 font-medium">All 8 FraudMesh Signals Passed</p>
                <p className="text-[10px] text-emerald-400/70">No suspicious patterns detected</p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="p-6 border-t border-slate-800 bg-slate-800/30">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-slate-400" />
              <h3 className="font-semibold text-white">Transaction Details</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID</span>
                <span className="text-slate-300 font-mono">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant</span>
                <span className="text-slate-300">{merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="text-slate-300 capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time</span>
                <span className="text-slate-300">{formatDate(timestamp)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-slate-800 flex gap-3">
            <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition flex items-center justify-center gap-2">
              <Printer size={16} />
              Print Receipt
            </button>
            <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition flex items-center justify-center gap-2">
              <Share2 size={16} />
              Share
            </button>
          </div>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={onContinue}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              Continue Shopping
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
              <Shield size={12} />
              <span>Secured by FraudMesh AI</span>
              <span>•</span>
              <span>256-bit SSL Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
