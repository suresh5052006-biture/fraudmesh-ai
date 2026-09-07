import React, { useState } from 'react';
import { Bot, Send, Terminal, Shield, Sparkles, CheckCircle2, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import soundService from '../services/audio';

const AIAgentConsole = ({ activeTxn = null }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: "👋 Greetings! I am **FraudMesh Sentinel**, your autonomous AI risk investigator. I continuously analyze cross-merchant device reuse, velocity spikes, and network cluster topologies to prevent fraud while zero customer PII is leaked.",
      timestamp: new Date().toLocaleTimeString(),
      reasoningSteps: [
        'Initialized 9-signal deterministic risk models',
        'Synchronized zero-knowledge signal exchange feed',
        'Graph topology analyzer ready for cluster traversal',
      ]
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const quickPrompts = [
    "Why STEP_UP instead of BLOCK?",
    "How is customer PII kept private?",
    "Analyze recent device reuse pattern",
    "Explain cross-merchant signal matching",
  ];

  const handleSend = async (queryText) => {
    const query = queryText || inputQuery;
    if (!query.trim()) return;

    soundService.playClick();
    
    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    // Simulate Agent autonomous multi-step reasoning
    setTimeout(() => {
      let responseText = '';
      let steps = [];

      const lowerQ = query.toLowerCase();

      if (lowerQ.includes('step_up') || lowerQ.includes('block')) {
        steps = [
          'Fetched risk score vector: Local (65) + Network Signal Boost (+15)',
          'Matched Signal FS-001: Device reuse across 3 merchants',
          'Evaluated false-positive impact vs fraud risk',
          'Selected STEP_UP (OTP) policy over hard decline',
        ];
        responseText = `**Forensic Analysis Rationale:**\nWhile the transaction matched pattern **FS-001** (device reuse across multiple accounts), the signal match confidence is **78%**. Automatically blocking would risk declining a legitimate user sharing a family device. \n\n**Action Chosen: STEP_UP (OTP Verification)**\nRequiring 2FA halts automated fraud bot scripts while granting legitimate cardholders a seamless recovery path!`;
      } else if (lowerQ.includes('pii') || lowerQ.includes('private') || lowerQ.includes('privacy')) {
        steps = [
          'Inspected data payloads across Merchant A and Merchant B',
          'Verified zero raw strings (emails, names, phone numbers) exposed',
          'Validated SHA-256 salted behavioral hashes (device_fingerprint + velocity_bucket)',
          'Privacy Shield Compliance: 100% Zero-Knowledge Verified',
        ];
        responseText = `**Zero-Knowledge Privacy Shield Report:**\nFraudMesh AI enforces zero PII transmission at the protocol layer. Merchants publish ONLY behavioral signals (e.g. \`high_velocity_device_hopping\`) linked with one-way salted hashes. Merchant B screens transactions locally without querying customer identity!`;
      } else if (lowerQ.includes('device') || lowerQ.includes('reuse') || lowerQ.includes('pattern')) {
        steps = [
          'Queried graph database for entity device_id = D-99',
          'Detected 14 distinct user account IDs attached to 1 hardware hash',
          'Calculated cross-merchant velocity: 22 transactions / 15 mins',
          'Cluster Risk: CRITICAL (Coordinated Ring Attack)',
        ];
        responseText = `**Device Reuse Forensic Breakdown:**\nHardware Fingerprint \`D-99\` has been linked to **14 accounts across 3 distinct merchants** in the past 2 hours. This hardware signature triggered deterministic Signal **FS-001** with high-velocity hop tags.`;
      } else {
        steps = [
          'Parsed input query against FraudMesh knowledge ontology',
          'Scanned active transaction database and network graph topology',
          'Synthesized forensic executive summary',
        ];
        responseText = `**Sentinel System Response:**\nFraudMesh AI continuously monitors network risk using 9 explainable signals. Current network status: **20 Merchants Protected**, **5 Fraud Clusters Contained**, and **0 Customer PII Shared**.`;
      }

      const agentMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: responseText,
        timestamp: new Date().toLocaleTimeString(),
        reasoningSteps: steps
      };

      setMessages(prev => [...prev, agentMsg]);
      setIsThinking(false);
      soundService.playScan();
    }, 1000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      {/* Console Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/40">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              FraudMesh Sentinel Console
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
                Autonomous AI Active
              </span>
            </h3>
            <p className="text-xs text-slate-400">Explainable AI Forensic Risk Agent & Policy Advisor</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>v2.4 Agent Core</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/60 font-sans text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'agent' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-1">
                <Bot className="w-5 h-5" />
              </div>
            )}

            <div className={`max-w-[80%] rounded-xl p-4 ${
              msg.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-slate-800/90 border border-slate-700 text-slate-200 rounded-bl-none shadow-lg'
            }`}>
              {/* Reasoning Steps Accordion for Agent */}
              {msg.reasoningSteps && (
                <div className="mb-3 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono">
                  <div className="text-indigo-400 font-semibold mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Autonomous Reasoning Trace:
                  </div>
                  <ul className="space-y-1 text-slate-400">
                    {msg.reasoningSteps.map((step, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Main Response Text */}
              <div className="prose prose-invert text-xs md:text-sm leading-relaxed whitespace-pre-line">
                {msg.text}
              </div>

              <span className="text-[10px] opacity-50 font-mono mt-2 block text-right">
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white flex-shrink-0 mt-1 font-bold text-xs">
                YOU
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 items-center text-xs text-indigo-400 font-mono p-3 bg-slate-900/80 rounded-lg border border-indigo-500/30 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            Sentinel Agent analyzing risk signals & graph topology...
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-slate-400 font-mono flex-shrink-0">Ask Sentinel:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white border border-slate-700 text-slate-300 flex-shrink-0 transition text-[11px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask FraudMesh Sentinel about risk signals, decisions, or privacy..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isThinking}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition font-semibold text-sm flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          Ask
        </button>
      </form>
    </div>
  );
};

export default AIAgentConsole;
