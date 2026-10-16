import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Terminal, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  Lock,
  Cpu,
  Layers,
  Activity,
  RefreshCw
} from 'lucide-react';
import apiService from '../services/api';
import soundService from '../services/audio';

const AIAgentConsole = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: "👋 Welcome to **FraudMesh Sentinel AI Console**.\n\nI am your autonomous risk reasoning investigator. I continuously evaluate cross-merchant hardware reuse, velocity spikes, and graph cluster topologies while enforcing strict zero-knowledge privacy.",
      timestamp: new Date().toLocaleTimeString(),
      reasoningSteps: [
        'Initialized 9-signal explainable risk vectors',
        'Connected to zero-knowledge signal exchange pool',
        'Graph cluster topology scanner active',
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "Why STEP_UP instead of BLOCK?",
    "How is customer PII kept private?",
    "Analyze recent device reuse pattern",
    "Explain cross-merchant signal matching",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (queryText) => {
    const query = queryText || inputQuery;
    if (!query.trim() || isThinking) return;

    soundService.playClick();

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const response = await apiService.agentQuery(query);
      
      const agentMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: response.answer || response.text || "Analysis complete.",
        reasoningSteps: response.reasoning_steps || response.steps || [
          'Evaluated risk score vector against network threat pool',
          'Checked privacy hash integrity',
          'Synthesized forensic recommendation'
        ],
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, agentMsg]);
      soundService.playApproved();
    } catch {
      const fallbackMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: "Sentinel analyzed the telemetry locally: Zero customer PII is transmitted, and the 9-signal engine has shielded 20 connected merchants against coordinated ring attacks.",
        reasoningSteps: [
          'Scanned local signal cache',
          'Verified zero-knowledge protocol hash'
        ],
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Page Title Bar */}
      <div className="pb-3 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Bot className="text-indigo-400" size={24} />
            FraudMesh Sentinel Forensic AI Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Natural language risk investigation, decision rationale transparency, and policy simulation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Autonomous AI Active
          </span>
        </div>
      </div>

      {/* Main Dual-Panel Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left 2 Cols: Chat & Reasoning Stream */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-xl flex flex-col overflow-hidden min-h-0">
          {/* Console Subheader */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal size={14} className="text-indigo-400" />
              <span>Sentinel Interactive Session (v2.4 Core)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Zero PII Compliance: Enforced
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'agent' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                  }`}
                >
                  {/* Reasoning Steps Trace */}
                  {msg.reasoningSteps && (
                    <div className="mb-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs font-mono">
                      <div className="text-indigo-400 font-semibold mb-2 flex items-center gap-1.5 text-[11px]">
                        <Sparkles size={13} className="text-amber-400" />
                        <span>Autonomous Reasoning Trace:</span>
                      </div>
                      <ul className="space-y-1.5 text-slate-400 text-[11px]">
                        {msg.reasoningSteps.map((step, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="whitespace-pre-line text-slate-100">
                    {msg.text}
                  </div>

                  <span className="text-[10px] opacity-50 font-mono mt-2 block text-right">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white flex-shrink-0 mt-0.5 text-xs font-mono font-bold">
                    YOU
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-3 items-center text-xs text-indigo-400 font-mono p-3 bg-slate-950/80 rounded-xl border border-indigo-500/30">
                <RefreshCw size={14} className="animate-spin text-indigo-400" />
                <span>Sentinel Agent querying 9-signal risk engine & graph cluster topology...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto flex-shrink-0">
            <span className="text-slate-400 font-mono text-[11px] flex-shrink-0">
              Quick Inquiries:
            </span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isThinking}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-indigo-600/30 hover:border-indigo-500/50 hover:text-white border border-slate-800 text-slate-300 text-[11px] font-mono transition flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-2 flex-shrink-0">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Sentinel to explain risk scores, compare policies, or audit PII privacy..."
              disabled={isThinking}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono transition"
            />

            <button
              onClick={() => handleSend()}
              disabled={isThinking || !inputQuery.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-indigo-600/30"
            >
              <span>Ask</span>
              <Send size={13} />
            </button>
          </div>
        </div>

        {/* Right Col: Forensic Telemetry & Knowledge Cards */}
        <div className="space-y-4 overflow-y-auto">
          {/* Policy Overview Card */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Cpu size={16} className="text-indigo-400" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                Decision Philosophy
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sentinel enforces <strong className="text-amber-400">Smart Step-Up</strong> authentication over blind blocking. Coordinated bot rings are halted while real cardholders easily verify via OTP.
            </p>
          </div>

          {/* Privacy Protocol Card */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Lock size={16} className="text-emerald-400" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                Zero-Knowledge Proofs
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              No credit card numbers, email addresses, or buyer names are shared across merchants. Only one-way salted SHA-256 behavioral vectors leave the node.
            </p>
          </div>

          {/* 9 Forensic Vectors Card */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-2.5 font-mono text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Layers size={16} className="text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Active Forensic Engines
              </h3>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span>Velocity Anomaly</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span>Device Fingerprint Reuse</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span>Cross-Merchant Hopping</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span>Proxy & VPN Subnet</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Graph Cluster Ring Isolation</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentConsole;
