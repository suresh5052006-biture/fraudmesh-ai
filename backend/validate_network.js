/**
 * FraudMesh AI - Fraud Network Validation
 * Tests graph-based fraud cluster detection
 */

const fs = require('fs');

// Load the dataset
const dataset = JSON.parse(fs.readFileSync('./fraudmesh_dataset.json', 'utf8'));

console.log("=".repeat(70));
console.log("FraudMesh AI - Fraud Network Graph Validation");
console.log("=".repeat(70));

// Build nodes and edges from transactions
function buildNetwork(transactions) {
  const nodes = new Map();
  const edges = [];
  const nodeRisks = new Map();

  // Helper to add node
  function addNode(id, type, risk = 0, extra = {}) {
    if (!nodes.has(id)) {
      nodes.set(id, { id, type, risk, ...extra });
    }
    return nodes.get(id);
  }

  // Helper to add edge
  function addEdge(source, target, relationship) {
    const key = `${source}-${target}-${relationship}`;
    if (!edges.find(e => `${e.source}-${e.target}-${e.relationship}` === key)) {
      edges.push({ source, target, relationship });
    }
  }

  // Build network from transactions
  for (const txn of transactions) {
    // Add transaction node
    addNode(txn.transaction_id, 'transaction', txn.is_fraudulent ? 100 : 0, {
      amount: txn.amount,
      status: txn.status,
      is_fraudulent: txn.is_fraudulent
    });

    // Add account node
    if (txn.account_id) {
      addNode(txn.account_id, 'account');
      addEdge(txn.transaction_id, txn.account_id, 'account_txn');
    }

    // Add device node
    if (txn.device_id) {
      addNode(txn.device_id, 'device');
      addEdge(txn.transaction_id, txn.device_id, 'uses_device');
    }

    // Add IP node
    if (txn.ip_address) {
      addNode(txn.ip_address, 'ip');
      addEdge(txn.transaction_id, txn.ip_address, 'from_ip');
    }

    // Add merchant node
    if (txn.merchant_id) {
      addNode(txn.merchant_id, 'merchant');
      addEdge(txn.transaction_id, txn.merchant_id, 'merchant_txn');
    }

    // Add payment instrument node
    if (txn.payment_instrument_id) {
      addNode(txn.payment_instrument_id, 'payment_instrument');
      addEdge(txn.transaction_id, txn.payment_instrument_id, 'pays_with');
    }

    // Add customer node
    if (txn.customer_id) {
      addNode(txn.customer_id, 'customer');
    }
  }

  return { nodes: Array.from(nodes.values()), edges };
}

// Calculate entity risk
function calculateEntityRisk(entityId, entityType, dataset) {
  let risk = 0;

  if (entityType === 'device') {
    const device = dataset.devices.find(d => d.device_id === entityId);
    if (device) {
      if (device.is_rooted) risk += 30;
      if (device.is_emulator) risk += 40;
    }
    const fraudTxns = dataset.transactions.filter(t => t.device_id === entityId && t.is_fraudulent);
    risk += Math.min(50, fraudTxns.length * 5);
  } else if (entityType === 'ip') {
    const ip = dataset.ip_addresses.find(ip => ip.ip_address === entityId);
    if (ip) {
      risk = ip.risk_score || 0;
      if (ip.is_vpn) risk += 15;
      if (ip.is_proxy) risk += 20;
      if (ip.is_datacenter) risk += 10;
    }
    const fraudTxns = dataset.transactions.filter(t => t.ip_address === entityId && t.is_fraudulent);
    risk += Math.min(30, fraudTxns.length * 3);
  } else if (entityType === 'account') {
    const txns = dataset.transactions.filter(t => t.account_id === entityId);
    const fraudTxns = txns.filter(t => t.is_fraudulent);
    if (txns.length > 0) {
      risk = Math.min(100, Math.floor((fraudTxns.length / txns.length) * 100) + fraudTxns.length * 10);
    }
  } else if (entityType === 'merchant') {
    const merchant = dataset.merchants.find(m => m.merchant_id === entityId);
    if (merchant) {
      if (merchant.risk_level === 'high') risk = 70;
      else if (merchant.risk_level === 'medium') risk = 40;
      else risk = 10;
    }
  } else if (entityType === 'payment_instrument') {
    const fraudTxns = dataset.transactions.filter(t => t.payment_instrument_id === entityId && t.is_fraudulent);
    risk = Math.min(100, fraudTxns.length * 15);
    const pi = dataset.payment_instruments.find(p => p.payment_instrument_id === entityId);
    if (pi) {
      if (pi.is_virtual) risk += 10;
      if (pi.is_prepaid) risk += 5;
      if (pi.is_issuing_country_high_risk) risk += 15;
    }
  } else if (entityType === 'customer') {
    const customer = dataset.customers.find(c => c.customer_id === entityId);
    if (customer) {
      risk = customer.risk_score || 0;
    }
  }

  return Math.min(100, risk);
}

// Find connected components using Union-Find
function findConnectedComponents(nodes, edges) {
  const parent = {};

  function find(x) {
    if (!parent[x]) parent[x] = x;
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);
    }
    return parent[x];
  }

  function union(x, y) {
    const px = find(x);
    const py = find(y);
    if (px !== py) {
      parent[px] = py;
    }
  }

  // Initialize
  for (const node of nodes) {
    parent[node.id] = node.id;
  }

  // Union connected nodes
  for (const edge of edges) {
    union(edge.source, edge.target);
  }

  // Group by component
  const components = new Map();
  for (const node of nodes) {
    const root = find(node.id);
    if (!components.has(root)) {
      components.set(root, []);
    }
    components.get(root).push(node.id);
  }

  return Array.from(components.values());
}

// Detect suspicious clusters
function detectSuspiciousClusters(nodes, edges, dataset) {
  const components = findConnectedComponents(nodes, edges);
  const clusters = [];

  for (const component of components) {
    if (component.length < 3) continue;

    const clusterNodes = nodes.filter(n => component.includes(n.id));

    // Count entities by type
    const typeCounts = {};
    for (const node of clusterNodes) {
      typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
    }

    // Detect suspicious patterns
    const patterns = [];

    // Device sharing
    if (typeCounts.device >= 1 && typeCounts.account >= 2) {
      patterns.push('device_sharing');
    }

    // IP sharing
    if (typeCounts.ip >= 1 && typeCounts.account >= 2) {
      patterns.push('ip_sharing');
    }

    // Multiple payment instruments
    if (typeCounts.payment_instrument >= 3) {
      patterns.push('multiple_payment_instruments');
    }

    // Fraudulent transactions
    const fraudTxns = clusterNodes.filter(n => n.type === 'transaction' && n.is_fraudulent);
    if (fraudTxns.length > 0) {
      patterns.push('contains_fraud');
    }

    // Calculate risk score
    let riskScore = 0;
    const avgRisk = clusterNodes.reduce((sum, n) => sum + (n.risk || 0), 0) / clusterNodes.length;
    const highRiskCount = clusterNodes.filter(n => (n.risk || 0) >= 70).length;

    riskScore = avgRisk * 0.4 + highRiskCount * 10 + fraudTxns.length * 15;
    riskScore = Math.min(100, Math.floor(riskScore));

    if (riskScore < 30) continue;

    // Build entity breakdown
    const entities = {
      customers: clusterNodes.filter(n => n.type === 'customer').map(n => n.id),
      accounts: clusterNodes.filter(n => n.type === 'account').map(n => n.id),
      devices: clusterNodes.filter(n => n.type === 'device').map(n => n.id),
      ips: clusterNodes.filter(n => n.type === 'ip').map(n => n.id),
      payment_instruments: clusterNodes.filter(n => n.type === 'payment_instrument').map(n => n.id),
      merchants: clusterNodes.filter(n => n.type === 'merchant').map(n => n.id),
      transactions: clusterNodes.filter(n => n.type === 'transaction').map(n => n.id),
    };

    clusters.push({
      cluster_id: `CLUSTER_${String(clusters.length + 1).padStart(4, '0')}`,
      size: component.length,
      entities,
      merchants_affected: entities.merchants,
      risk_score: riskScore,
      patterns_detected: patterns,
      fraudulent_transactions: fraudTxns.length,
      entity_counts: typeCounts,
    });
  }

  // Sort by risk score
  clusters.sort((a, b) => b.risk_score - a.risk_score);

  return clusters;
}

// Main test
console.log("\n📊 Building Fraud Network Graph...");
const sampleTransactions = dataset.transactions.slice(0, 2000);
const network = buildNetwork(sampleTransactions);

console.log(`\n📈 Network Statistics:`);
console.log(`  Total Nodes: ${network.nodes.length}`);
console.log(`  Total Edges: ${network.edges.length}`);

// Count node types
const nodeTypes = {};
for (const node of network.nodes) {
  nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
}
console.log(`\n🔢 Node Types:`);
for (const [type, count] of Object.entries(nodeTypes)) {
  console.log(`  ${type}: ${count}`);
}

// Count edge types
const edgeTypes = {};
for (const edge of network.edges) {
  edgeTypes[edge.relationship] = (edgeTypes[edge.relationship] || 0) + 1;
}
console.log(`\n🔗 Edge Types:`);
for (const [type, count] of Object.entries(edgeTypes)) {
  console.log(`  ${type}: ${count}`);
}

// Calculate entity risks
console.log(`\n⚠️  Calculating Entity Risk Scores...`);
for (const node of network.nodes) {
  node.risk = calculateEntityRisk(node.id, node.type, dataset);
}

// Detect suspicious clusters
console.log(`\n🎯 Detecting Suspicious Clusters...`);
const clusters = detectSuspiciousClusters(network.nodes, network.edges, dataset);

console.log(`\n📊 Cluster Statistics:`);
console.log(`  Total Clusters: ${clusters.length}`);
console.log(`  Critical (80+): ${clusters.filter(c => c.risk_score >= 80).length}`);
console.log(`  High (60-79): ${clusters.filter(c => c.risk_score >= 60 && c.risk_score < 80).length}`);
console.log(`  Medium (40-59): ${clusters.filter(c => c.risk_score >= 40 && c.risk_score < 60).length}`);

// Show top clusters
console.log(`\n🚨 Top 5 Suspicious Clusters:`);
for (let i = 0; i < Math.min(5, clusters.length); i++) {
  const cluster = clusters[i];
  console.log(`\n  ${cluster.cluster_id}:`);
  console.log(`    Size: ${cluster.size} entities`);
  console.log(`    Risk Score: ${cluster.risk_score}/100`);
  console.log(`    Fraudulent Transactions: ${cluster.fraudulent_transactions}`);
  console.log(`    Patterns: ${cluster.patterns_detected.join(', ')}`);
  console.log(`    Entity Counts:`);
  for (const [type, count] of Object.entries(cluster.entity_counts)) {
    console.log(`      ${type}: ${count}`);
  }
}

// Save network results
const results = {
  nodes: network.nodes.slice(0, 100), // Sample for output
  edges: network.edges.slice(0, 100),
  suspicious_clusters: clusters.slice(0, 20),
  statistics: {
    total_nodes: network.nodes.length,
    total_edges: network.edges.length,
    total_clusters: clusters.length,
    high_risk_entities: network.nodes.filter(n => n.risk >= 70).length,
    fraudulent_transactions: network.nodes.filter(n => n.type === 'transaction' && n.is_fraudulent).length,
    node_types: nodeTypes,
    edge_types: edgeTypes,
    clusters_by_risk: {
      critical: clusters.filter(c => c.risk_score >= 80).length,
      high: clusters.filter(c => c.risk_score >= 60 && c.risk_score < 80).length,
      medium: clusters.filter(c => c.risk_score >= 40 && c.risk_score < 60).length,
      low: clusters.filter(c => c.risk_score < 40).length,
    },
  },
};

fs.writeFileSync('fraud_network_results.json', JSON.stringify(results, null, 2));
console.log(`\n💾 Network results saved to fraud_network_results.json`);

console.log(`\n${"=".repeat(70)}`);
console.log("✅ Fraud Network Validation Complete!");
console.log("=".repeat(70));

console.log(`\n📋 API Endpoint Ready:`);
console.log(`  GET /api/network`);
console.log(`\n📊 Returns:`);
console.log(`  • Nodes: Entity nodes with risk scores`);
console.log(`  • Edges: Relationships between entities`);
console.log(`  • Suspicious Clusters: Detected fraud patterns`);
console.log(`  • Statistics: Network analysis summary`);

console.log(`\n🎯 Cluster Detection Features:`);
console.log(`  ✓ Device sharing (multiple accounts on same device)`);
console.log(`  ✓ IP sharing (multiple accounts from same IP)`);
console.log(`  ✓ Multiple payment instruments in cluster`);
console.log(`  ✓ Fraudulent transaction presence`);
console.log(`  ✓ Risk-based scoring (0-100)`);
console.log(`  ✓ Connected component analysis`);
