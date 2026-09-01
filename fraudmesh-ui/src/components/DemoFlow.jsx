import React, { useState, useEffect } from 'react';
import { Play, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import apiService from '../services/api';

const DemoFlow = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Merchant A Detects Suspicious Activity',
    'AI Fraud Engine Analyzes Pattern',
    'System Creates Fraud Signal FS-001',
    'Signal Published to Exchange',
    'Merchant B Receives Signal',
    'New Transaction Matches Signal',
    'Risk Score Enhanced with Network Intelligence',
    'AI Investigator Analyzes Transaction',
    'System Recommends Smart Action',
  ];

  const runDemo = async () => {
    try {
      setRunning(true);
      setError(null);
      setResult(null);
      setCurrentStep(0);

      // Simulate progress through steps
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Run actual demo
      const data = await apiService.runDemo();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-8 bg-primary min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Play className="w-8 h-8" />
          Fraud Attack Simulation
        </h1>
        <p className="text-slate-400">Demonstrate end-to-end fraud detection and merchant protection</p>
      </div>

      <button
        onClick={runDemo}
        disabled={running}
        className="mb-8 px-6 py-3 bg-accent hover:bg-red-600 disabled:bg-slate-700 text-white rounded-lg transition font-bold text-lg flex items-center gap-2"
      >
        {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
        Run Fraud Attack Simulation
      </button>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-200">
          Error: {error}
        </div>
      )}

      {/* Demo Flow Visualization */}
      <div className="mb-8 bg-secondary rounded-lg p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6">Demo Flow</h2>
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-4 p-4 rounded-lg transition ${
                idx < currentStep
                  ? 'bg-green-500/10 border border-green-500'
                  : idx === currentStep && running
                  ? 'bg-blue-500/10 border border-blue-500 animate-pulse'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <div className="flex-shrink-0">
                {idx < currentStep ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : idx === currentStep && running ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-600" />
                )}
              </div>
              <span className="text-slate-300">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-secondary rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">✅ Simulation Complete</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 rounded p-4">
              <p className="text-slate-400 text-sm mb-2">Status</p>
              <p className="text-lg font-bold text-green-400">{result.status}</p>
            </div>
            <div className="bg-slate-800 rounded p-4">
              <p className="text-slate-400 text-sm mb-2">Duration</p>
              <p className="text-lg font-bold text-blue-400">{result.duration_seconds}s</p>
            </div>
          </div>

          {result.detected_fraud_ring && (
            <div className="bg-slate-800 rounded p-4 mb-6">
              <h3 className="font-bold text-white mb-3">Detected Fraud Ring</h3>
              <p className="text-slate-300">Cluster: {result.detected_fraud_ring.cluster_id}</p>
              <p className="text-slate-300">Risk Score: {result.detected_fraud_ring.risk_score}/100</p>
              <p className="text-slate-300">Accounts: {result.detected_fraud_ring.accounts}</p>
            </div>
          )}

          {result.generated_signal && (
            <div className="bg-slate-800 rounded p-4 mb-6">
              <h3 className="font-bold text-white mb-3">Generated Signal</h3>
              <p className="text-slate-300">Signal ID: {result.generated_signal.signal_id}</p>
              <p className="text-slate-300">Pattern: {result.generated_signal.pattern_type}</p>
              <p className="text-slate-300">Severity: {result.generated_signal.severity}</p>
            </div>
          )}

          <div className="bg-slate-800 rounded p-4">
            <h3 className="font-bold text-white mb-3">Key Achievements</h3>
            <ul className="space-y-2">
              {result.summary?.key_achievements?.map((achievement, idx) => (
                <li key={idx} className="text-slate-300 text-sm">{achievement}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoFlow;
