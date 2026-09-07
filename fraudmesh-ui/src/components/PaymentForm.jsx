import React, { useState } from 'react';
import apiService from '../services/api';
import soundService from '../services/audio';
import RiskRadarGauge from './RiskRadarGauge';
import BalanceCard from './BalanceCard';

const PaymentForm = ({ accountId = 'ACC00001' }) => {
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build transaction data similar to RiskCheck
      const txnData = {
        merchant_id: 'MER0005',
        amount,
        account_id: accountId,
        device_id: 'DEV0001',
        payment_instrument_id: 'PI0001',
        customer_id: 'CUS00001',
        ip_address: '192.168.4.12',
        payment_method: paymentMethod,
      };
      // 1️⃣ Risk check
      const riskResp = await apiService.checkRisk(txnData);
      setResult(riskResp);

      // Decide based on risk band
      const { recommended_action, risk_score, signals } = riskResp;
      if (recommended_action === 'ALLOW' || recommended_action === 'STEP_UP') {
        // 2️⃣ Process payment
        const paymentPayload = {
          account_id: accountId,
          amount,
          payment_method: paymentMethod,
          risk_score,
          signals,
        };
        const payResp = await apiService.processPayment(paymentPayload);
        // Simple toast-like feedback (you can replace with your UI lib)
        alert(`Payment ${payResp.status || 'completed'}: ${payResp.message || ''}`);
      } else {
        alert(`Transaction blocked / requires review: ${recommended_action}`);
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-card">
      <h2 className="text-lg font-bold text-white mb-4">Payment Checkout</h2>
      <BalanceCard accountId={accountId} />
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Amount (USD)</label>
          <input
            type="number"
            className="payment-input"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Payment Method</label>
          <select
            className="payment-input"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="wallet">Wallet</option>
          </select>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Processing…' : 'Pay Now'}
        </button>
      </div>
      {result && (
        <div className="mt-6">
          <RiskRadarGauge riskScore={result.risk_score} signals={result.signals} />
        </div>
      )}
    </div>
  );
};

export default PaymentForm;
