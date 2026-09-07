import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, RefreshCw, Layers, ShieldAlert, Info } from 'lucide-react';

const FraudNetworkGraph = ({ networkData, height = '450px' }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (!containerRef.current) return;

    // Convert networkData (nodes & edges) into Cytoscape elements
    const elements = [];

    const nodes = networkData?.nodes || [
      { id: 'acc_101', type: 'ACCOUNT', label: 'Acc: User 101', risk: 'HIGH' },
      { id: 'acc_102', type: 'ACCOUNT', label: 'Acc: User 102', risk: 'HIGH' },
      { id: 'acc_103', type: 'ACCOUNT', label: 'Acc: User 103', risk: 'MEDIUM' },
      { id: 'dev_d99', type: 'DEVICE', label: 'Dev: iPhone 14 (D-99)', risk: 'CRITICAL' },
      { id: 'ip_192', type: 'IP', label: 'IP: 192.168.4.12', risk: 'HIGH' },
      { id: 'mch_tech', type: 'MERCHANT', label: 'Merchant: ElectroHQ', risk: 'LOW' },
      { id: 'mch_pay', type: 'MERCHANT', label: 'Merchant: QuickPay', risk: 'LOW' },
    ];

    const edges = networkData?.edges || [
      { source: 'acc_101', target: 'dev_d99', label: 'USED_DEVICE' },
      { source: 'acc_102', target: 'dev_d99', label: 'REUSED_DEVICE' },
      { source: 'acc_103', target: 'dev_d99', label: 'REUSED_DEVICE' },
      { source: 'acc_101', target: 'ip_192', label: 'CONNECT_IP' },
      { source: 'acc_102', target: 'ip_192', label: 'CONNECT_IP' },
      { source: 'acc_101', target: 'mch_tech', label: 'TRANS_MCH_A' },
      { source: 'acc_102', target: 'mch_pay', label: 'TRANS_MCH_B' },
    ];

    nodes.forEach(n => {
      if (filterType !== 'ALL' && n.type !== filterType) return;
      
      let nodeColor = '#3b82f6'; // account blue
      if (n.type === 'DEVICE') nodeColor = '#ef4444'; // device red
      if (n.type === 'IP') nodeColor = '#f59e0b'; // ip amber
      if (n.type === 'MERCHANT') nodeColor = '#10b981'; // merchant green

      elements.push({
        data: {
          id: n.id,
          label: n.label || n.id,
          type: n.type,
          risk: n.risk || 'LOW',
          color: nodeColor,
        },
      });
    });

    // Build a set of node IDs that are actually included after filtering
    const nodeIdSet = new Set();
    nodes.forEach(n => {
      if (filterType !== 'ALL' && n.type !== filterType) return;
      nodeIdSet.add(n.id);
    });

    // Add edges only if both source and target nodes exist in the filtered set
    edges.forEach((e, idx) => {
      if (!nodeIdSet.has(e.source) || !nodeIdSet.has(e.target)) {
        // Skip edge with missing node to avoid Cytoscape errors
        return;
      }
      elements.push({
        data: {
          id: `e_${idx}`,
          source: e.source,
          target: e.target,
          label: e.label || 'LINKED',
        },
      });
    });

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '11px',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'width': 36,
            'height': 36,
            'border-width': 2,
            'border-color': '#ffffff',
            'transition-property': 'background-color, border-width, width, height',
            'transition-duration': '0.2s',
          },
        },
        {
          selector: 'node[type = "DEVICE"]',
          style: {
            'shape': 'hexagon',
            'border-color': '#f87171',
            'border-width': 3,
          },
        },
        {
          selector: 'node[type = "IP"]',
          style: {
            'shape': 'diamond',
          },
        },
        {
          selector: 'node[type = "MERCHANT"]',
          style: {
            'shape': 'rectangle',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#475569',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#475569',
            'opacity': 0.7,
          },
        },
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#fbbf24',
            'width': 44,
            'height': 44,
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        padding: 30,
        nodeRepulsion: 8000,
        idealEdgeLength: 60,
      },
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode(node.data());
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [networkData, filterType]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleResetLayout = () => cyRef.current?.layout({ name: 'cose', animate: true }).run();

  return (
    <div className="relative bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-sm">Interactive Fraud Ring Graph Topology</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
            {networkData?.nodes?.length || 7} Nodes
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          {['ALL', 'ACCOUNT', 'DEVICE', 'IP', 'MERCHANT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded transition ${
                filterType === type
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetLayout}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Re-layout Graph"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graph Canvas Container */}
      <div ref={containerRef} style={{ height }} className="w-full bg-slate-950/60 cursor-grab active:cursor-grabbing" />

      {/* Node Legend Bar */}
      <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-lg p-2 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span className="text-slate-300">Account</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-red-500 rotate-45 inline-block" />
          <span className="text-slate-300">Device</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-amber-500 rotate-45 inline-block" />
          <span className="text-slate-300">IP Addr</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 bg-emerald-500 inline-block" />
          <span className="text-slate-300">Merchant</span>
        </div>
      </div>

      {/* Node Detail Drawer */}
      {selectedNode && (
        <div className="absolute top-16 right-4 w-72 bg-slate-900/95 backdrop-blur border border-indigo-500/40 rounded-xl p-4 shadow-xl z-20 animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {selectedNode.type}
              </span>
              <h4 className="text-sm font-bold text-white mt-1 break-all">{selectedNode.label}</h4>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-800 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Node ID:</span>
              <span className="text-slate-200 font-mono">{selectedNode.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Calculated Risk:</span>
              <span
                className={`font-bold ${
                  selectedNode.risk === 'CRITICAL' || selectedNode.risk === 'HIGH'
                    ? 'text-red-400'
                    : selectedNode.risk === 'MEDIUM'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {selectedNode.risk}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Topology Status:</span>
              <span className="text-indigo-300 font-semibold">Shared Cluster Active</span>
            </div>
          </div>

          <div className="mt-3 p-2 bg-slate-800/80 rounded border border-slate-700 text-[11px] text-slate-300 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>Entities with device/IP overlap across multiple merchants trigger multi-account signal flags.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraudNetworkGraph;
