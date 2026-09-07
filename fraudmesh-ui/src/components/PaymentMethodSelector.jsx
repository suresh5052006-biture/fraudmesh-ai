import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Wallet, Lock } from 'lucide-react';

const TABS = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

const formatCardNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(' ');
};

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) {
    return digits.slice(0, 2) + '/' + digits.slice(2);
  }
  return digits;
};

const getCardType = (number) => {
  const digits = number.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return null;
};

const PaymentMethodSelector = ({ method, onMethodChange, formData, onFormChange }) => {
  const [cardType, setCardType] = useState(null);

  useEffect(() => {
    if (method === 'card' && formData.cardNumber) {
      setCardType(getCardType(formData.cardNumber));
    }
  }, [formData.cardNumber, method]);

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    onFormChange({ ...formData, cardNumber: formatted });
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value);
    onFormChange({ ...formData, expiry: formatted });
  };

  const handleCVVChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    onFormChange({ ...formData, cvv: digits });
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onMethodChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                method === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Card Form */}
      {method === 'card' && (
        <div className="space-y-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="space-y-3">
            {/* Card Number */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.cardNumber || ''}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-lg text-white font-mono text-lg tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  inputMode="numeric"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {cardType && (
                    <span className="text-xs text-slate-400 font-medium">{cardType}</span>
                  )}
                  <CreditCard size={18} className="text-slate-500" />
                </div>
              </div>
            </div>

            {/* Expiry & CVV Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">
                  Expiry
                </label>
                <input
                  type="text"
                  value={formData.expiry || ''}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-lg text-white font-mono text-center focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">
                  CVV
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.cvv || ''}
                    onChange={handleCVVChange}
                    placeholder="•••"
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-lg text-white font-mono text-center tracking-widest focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    inputMode="numeric"
                    maxLength={4}
                  />
                  <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">
                Cardholder Name
              </label>
              <input
                type="text"
                value={formData.cardName || ''}
                onChange={(e) => onFormChange({ ...formData, cardName: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-lg text-white font-sans focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
          </div>

          {/* Card Preview */}
          <div className="mt-4 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-80" />
              <CreditCard size={28} className="text-slate-600" />
            </div>
            <p className="text-lg font-mono text-white tracking-widest mb-4">
              {formData.cardNumber ? formatCardNumber(formData.cardNumber.padEnd(16, '•')) : '•••• •••• •••• ••••'}
            </p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Card Holder</p>
                <p className="text-sm text-slate-300 font-medium">
                  {formData.cardName || 'YOUR NAME'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Expires</p>
                <p className="text-sm text-slate-300 font-mono">
                  {formData.expiry || 'MM/YY'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPI Form */}
      {method === 'upi' && (
        <div className="space-y-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-center py-6">
            <Smartphone size={48} className="mx-auto mb-4 text-indigo-400" />
            <h3 className="text-white font-medium mb-1">Pay with UPI</h3>
            <p className="text-sm text-slate-400 mb-4">Enter your UPI ID or scan QR code</p>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wide">
              UPI ID
            </label>
            <input
              type="text"
              value={formData.upiId || ''}
              onChange={(e) => onFormChange({ ...formData, upiId: e.target.value })}
              placeholder="yourname@upi"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock size={12} />
            <span>UPI payments are secured by your bank</span>
          </div>
        </div>
      )}

      {/* Wallet Form */}
      {method === 'wallet' && (
        <div className="space-y-4 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-center py-6">
            <Wallet size={48} className="mx-auto mb-4 text-indigo-400" />
            <h3 className="text-white font-medium mb-1">Pay with Wallet</h3>
            <p className="text-sm text-slate-400 mb-4">Select your wallet provider</p>
          </div>
          <div className="space-y-2">
            {['Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay'].map(wallet => (
              <button
                key={wallet}
                onClick={() => onFormChange({ ...formData, wallet })}
                className={`w-full p-3 rounded-lg border text-left transition ${
                  formData.wallet === wallet
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{wallet}</span>
                  {formData.wallet === wallet && (
                    <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Lock size={14} />
        <span>Transactions are protected by 256-bit SSL encryption</span>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
