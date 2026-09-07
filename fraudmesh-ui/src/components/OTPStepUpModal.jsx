import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Lock, Loader2, Send, CheckCircle } from 'lucide-react';
import soundService from '../services/audio';

const OTPStepUpModal = ({ isOpen, onVerify, onCancel, amount }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setVerified(false);
      setError('');
      setLoading(false);
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      soundService.playStepUp();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const digits = pastedData.split('');
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);
    if (digits.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code = otp.join('')) => {
    setLoading(true);
    setError('');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (code === '123456' || code.length === 6) {
      setVerified(true);
      soundService.playApproved();
      setTimeout(() => {
        onVerify();
      }, 1000);
    } else {
      setError('Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      soundService.playAlert();
    }
    setLoading(false);
  };

  const handleResend = () => {
    setCountdown(60);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-transparent to-slate-950" />
      
      <div className="relative w-full max-w-sm mx-4 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-slate-800">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            verified ? 'bg-emerald-500/20' : 'bg-amber-500/20'
          }`}>
            {verified ? (
              <CheckCircle size={32} className="text-emerald-400" />
            ) : (
              <ShieldCheck size={32} className="text-amber-400" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {verified ? 'Verified!' : 'Additional Verification'}
          </h2>
          <p className="text-sm text-slate-400">
            {verified 
              ? 'Your identity has been confirmed'
              : `A 6-digit code has been sent to your registered mobile/email`
            }
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!verified ? (
            <>
              {/* Amount Display */}
              <div className="text-center mb-6 p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Verifying transaction of</p>
                <p className="text-2xl font-bold text-amber-400">${amount?.toFixed(2)}</p>
              </div>

              {/* Risk Warning */}
              <div className="flex items-start gap-3 mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-200">
                  This transaction requires additional verification due to unusual activity patterns detected by our fraud prevention system.
                </p>
              </div>

              {/* OTP Input */}
              <div className="mb-4">
                <label className="block text-xs font-mono text-slate-400 mb-2 text-center uppercase tracking-wide">
                  Enter Verification Code
                </label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => inputRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      disabled={loading}
                      className={`w-12 h-14 text-center text-xl font-mono rounded-lg border-2 transition ${
                        error 
                          ? 'border-red-500 bg-red-500/10' 
                          : 'border-slate-700 bg-slate-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                      } text-white focus:outline-none`}
                    />
                  ))}
                </div>
                {error && (
                  <p className="text-center text-xs text-red-400 mt-2">{error}</p>
                )}
              </div>

              {/* Countdown & Resend */}
              <div className="text-center mb-6">
                {countdown > 0 ? (
                  <p className="text-xs text-slate-500">
                    Resend code in <span className="text-slate-400 font-mono">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {/* Demo hint */}
              <p className="text-center text-[10px] text-slate-600 mb-4">
                Demo: Use 123456 to verify
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerify()}
                  disabled={otp.some(d => !d) || loading}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Verify
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="animate-bounce mb-4">
                <CheckCircle size={48} className="text-emerald-400 mx-auto" />
              </div>
              <p className="text-emerald-400 font-medium">Verification Successful!</p>
              <p className="text-sm text-slate-400 mt-1">Processing your transaction...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPStepUpModal;
