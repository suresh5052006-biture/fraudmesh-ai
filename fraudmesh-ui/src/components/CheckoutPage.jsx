import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, Shield, ChevronRight, XCircle } from 'lucide-react';
import ProductStorefront from './ProductStorefront';
import PaymentMethodSelector from './PaymentMethodSelector';
import FraudGateOverlay from './FraudGateOverlay';
import OTPStepUpModal from './OTPStepUpModal';
import BlockScreen from './BlockScreen';
import PaymentSuccess from './PaymentSuccess';
import TransactionHistory from './TransactionHistory';
import BalanceCard from './BalanceCard';
import apiService from '../services/api';

const STEPS = {
  STORE: 'store',
  PAYMENT: 'payment',
}

const CheckoutPage = () => {
  const [step, setStep] = useState(STEPS.STORE);
  const [cart, setCart] = useState([]);
  const [accountId] = useState('ACC00001');
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
    upiId: '',
    wallet: ''
  });

  const [showFraudGate, setShowFraudGate] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [riskResult, setRiskResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [blockReason, setBlockReason] = useState('DEFAULT');
  const [riskError, setRiskError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentAttemptId, setPaymentAttemptId] = useState(null);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalWithTax = Math.round(cartTotal * 1.08 * 100) / 100;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setStep(STEPS.PAYMENT);
  };

  const handlePayment = async () => {
    if (cart.length === 0 || processing) return;

    setProcessing(true);
    setRiskError(null);
    setPaymentError(null);
    // Generated once per attempt so the OTP step and the receipt reference the
    // same id the backend records.
    setPaymentAttemptId(`TXN${Date.now().toString()}${Math.floor(Math.random() * 1000)}`);

    let risk;
    try {
      const txnData = {
        merchant_id: 'MER0005',
        amount: totalWithTax,
        account_id: accountId,
        device_id: 'DEV0001',
        payment_instrument_id: 'PI0001',
        customer_id: 'CUS00001',
        ip_address: '192.168.4.12',
        payment_method: paymentMethod,
        cart_items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
      };

      const result = await apiService.checkRisk(txnData);
      risk = result;
    } catch (e) {
      // Fail closed: without a server verdict the payment must not proceed.
      setShowFraudGate(false);
      setProcessing(false);
      setRiskError('Unable to reach FraudMesh AI risk service. Payment blocked.');
      return;
    }

    setRiskResult(risk);
    setShowFraudGate(true);
  };

  const handleFraudGateComplete = ({ verdict, riskScore, action }) => {
    setShowFraudGate(false);

    if (action === 'BLOCK') {
      const highRiskSignal = riskResult?.signals?.[0]?.signal_type || 'FRAUD_PATTERN';
      setBlockReason(highRiskSignal.toUpperCase().replace(/ /g, '_'));
      setShowBlock(true);
    } else if (action === 'STEP_UP') {
      setShowOTP(true);
    } else {
      processPayment();
    }
  };

  const processPayment = async () => {
    if (submitting) return;
    setSubmitting(true);
    setPaymentError(null);

    try {
      const paymentPayload = {
        account_id: accountId,
        amount: totalWithTax,
        payment_method: paymentMethod,
        transaction_id: paymentAttemptId,
      };

      const result = await apiService.processPayment(paymentPayload);
      setPaymentResult(result);
      setProcessing(false);
      setShowSuccess(true);
    } catch (e) {
      // A declined or failed payment must never render the success screen.
      setProcessing(false);
      setPaymentError(e?.response?.data?.detail || 'Payment could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOTPVerified = () => {
    setShowOTP(false);
    processPayment();
  };

  const handleOTPCancel = () => {
    setShowOTP(false);
    setProcessing(false);
  };

  const handleTryAgain = () => {
    setShowBlock(false);
    setProcessing(false);
  };

  const handleBackToStore = () => {
    setShowBlock(false);
    setStep(STEPS.STORE);
    setProcessing(false);
  };

  const handleSuccessContinue = () => {
    setShowSuccess(false);
    setCart([]);
    setStep(STEPS.STORE);
    setProcessing(false);
    setPaymentForm({
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardName: '',
      upiId: '',
      wallet: ''
    });
  };

  const getRiskLevel = (score) => {
    if (score <= 30) return 'Low';
    if (score <= 60) return 'Medium';
    if (score <= 80) return 'High';
    return 'Critical';
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {step === STEPS.PAYMENT && (
              <button
                onClick={() => setStep(STEPS.STORE)}
                className="p-2 hover:bg-slate-800 rounded-lg transition"
              >
                <ArrowLeft size={20} className="text-slate-400" />
              </button>
            )}
            <div>
              <h1 className="page-title">
                {step === STEPS.STORE ? (
                  <>
                    <ShoppingBag size={24} className="text-indigo-400" />
                    Store
                  </>
                ) : (
                  <>
                    <Shield size={24} className="text-indigo-400" />
                    Secure Checkout
                  </>
                )}
              </h1>
              <p className="page-subtitle">
                {step === STEPS.STORE 
                  ? 'Browse products and add to cart'
                  : `Paying for ${cartCount} item${cartCount > 1 ? 's' : ''} - $${totalWithTax.toFixed(2)}`
                }
              </p>
            </div>
          </div>

          {step === STEPS.STORE && cartCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-full">
              <span className="text-xs text-indigo-300">{cartCount} items</span>
              <ChevronRight size={14} className="text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300">${cartTotal.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Store View */}
        {step === STEPS.STORE && (
          <>
            <ProductStorefront
              onCheckout={handleCheckout}
              cart={cart}
              setCart={setCart}
            />
            
            {cart.length > 0 && (
              <div className="mt-8">
                <h2 className="section-title flex items-center gap-2">
                  <Shield size={16} className="text-indigo-400" />
                  Recent Transactions
                </h2>
                <TransactionHistory accountId={accountId} compact />
              </div>
            )}
          </>
        )}

        {/* Payment View */}
        {step === STEPS.PAYMENT && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <h3 className="font-semibold text-white mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm text-white font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax (8%)</span>
                    <span className="text-white">${(cartTotal * 0.08).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-700">
                    <span className="text-white">Total</span>
                    <span className="text-emerald-400">${totalWithTax.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <PaymentMethodSelector
                  method={paymentMethod}
                  onMethodChange={setPaymentMethod}
                  formData={paymentForm}
                  onFormChange={setPaymentForm}
                />
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <Shield size={18} />
                {processing ? 'Processing...' : `Pay $${totalWithTax.toFixed(2)}`}
              </button>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <BalanceCard accountId={accountId} />
              
              {/* FraudMesh Info */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-emerald-400" />
                  <h3 className="font-semibold text-white">Fraud Protection</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Your payment is protected by FraudMesh AI which analyzes 8+ risk signals in real-time.
                </p>
                <div className="space-y-2">
                  {riskError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-800 bg-red-950/60 px-3 py-2 text-xs text-red-200">
                      <XCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                      <span>{riskError}</span>
                    </div>
                  )}
                  {['Velocity Check', 'Device Fingerprint', 'Network Analysis', 'Behavioral Analysis', 'Merchant Risk'].map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <span className="text-slate-400">{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      <FraudGateOverlay
        isVisible={showFraudGate}
        onComplete={handleFraudGateComplete}
        riskResult={riskResult}
      />

      <OTPStepUpModal
        isOpen={showOTP}
        onVerify={handleOTPVerified}
        onCancel={handleOTPCancel}
        amount={totalWithTax}
      />

      <BlockScreen
        isVisible={showBlock}
        onTryAgain={handleTryAgain}
        onContactSupport={() => {}}
        onBackToStore={handleBackToStore}
        reason={blockReason}
        riskScore={riskResult?.risk_score}
      />

      <PaymentSuccess
        isVisible={showSuccess}
        onContinue={handleSuccessContinue}
        transactionDetails={{
          amount: paymentResult?.amount ?? totalWithTax,
          riskScore: paymentResult?.risk_score ?? riskResult?.risk_score ?? 0,
          riskLevel: getRiskLevel(paymentResult?.risk_score ?? riskResult?.risk_score ?? 0),
          paymentMethod,
          merchant: 'FraudMesh Store',
          transactionId: paymentResult?.transaction_id ?? paymentAttemptId,
          timestamp: paymentResult?.timestamp ?? new Date().toISOString()
        }}
      />

      {paymentError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/90 px-4 py-3 text-sm text-red-200">
            <XCircle size={16} className="text-red-400" />
            {paymentError}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
