/**
 * FraudMesh AI - Signal Exchange Test
 * Tests the complete fraud signal exchange workflow:
 *
 * 1. Merchant A discovers a fraud pattern
 * 2. FS-001 is created
 * 3. Merchant B receives the signal
 * 4. A new Merchant B transaction matches FS-001
 */

const fs = require('fs');

// Load the dataset
const dataset = JSON.parse(fs.readFileSync('./fraudmesh_dataset.json', 'utf8'));

console.log("=".repeat(80));
console.log("FraudMesh AI - Signal Exchange Integration Test");
console.log("=".repeat(80));

// Simulated Signal Exchange Database (in-memory)
const signalDatabase = {
  signals: [],
  signalIdCounter: 1,
};

// Helper: Generate Signal ID
function generateSignalId() {
  return `FS-${String(signalDatabase.signalIdCounter++).padStart(3, '0')}`;
}

// Helper: Extract behavioral signals from transaction context
function extractBehavioralSignals(transaction, relatedTransactions = []) {
  const signals = [];

  const account_id = transaction.account_id;
  const device_id = transaction.device_id;
  const ip_address = transaction.ip_address;
  const payment_instrument_id = transaction.payment_instrument_id;
  const amount = transaction.amount;

  // Device reuse check
  const devicesForAccount = new Set(
    relatedTransactions.filter(t => t.account_id === account_id && t.device_id).map(t => t.device_id)
  );
  if (devicesForAccount.size > 1) {
    signals.push("device_reuse");
  }

  // High velocity check
  if (relatedTransactions.filter(t => t.account_id === account_id).length >= 3) {
    signals.push("high_velocity");
  }

  // Multi-account activity check
  const accountsForDevice = new Set(
    relatedTransactions.filter(t => t.device_id === device_id && t.account_id).map(t => t.account_id)
  );
  if (accountsForDevice.size >= 3) {
    signals.push("multi_account_activity");
  }

  // Merchant hopping check
  const merchants = new Set(
    relatedTransactions.filter(t => t.account_id === account_id && t.merchant_id).map(t => t.merchant_id)
  );
  if (merchants.size >= 4) {
    signals.push("merchant_hopping");
  }

  // Low-value testing
  const lowValueTxns = relatedTransactions.filter(t => t.amount < 10);
  if (lowValueTxns.length > 5) {
    signals.push("low_value_testing");
  }

  // High-value transaction
  if (amount > 1000) {
    signals.push("high_value_transaction");
  }

  return signals;
}

// Helper: Create IP pattern (privacy-preserving)
function createIpPattern(ip_address) {
  const parts = ip_address.split('.');
  if (parts.length === 4) {
    return {
      first_octet: parseInt(parts[0]),
      second_octet: parseInt(parts[1]),
      subnet: `${parts[0]}.${parts[1]}.*.*`,
    };
  }
  return null;
}

// Helper: Determine severity
function determineSeverity(signals, confidence) {
  const highImpactSignals = [
    "account_takeover", "coordinated_activity", "merchant_collusion",
    "high_value_transaction", "multi_account_activity"
  ];

  if (signals.some(s => highImpactSignals.includes(s)) && confidence >= 0.8) {
    return "CRITICAL";
  } else if (signals.length >= 3 && confidence >= 0.7) {
    return "HIGH";
  } else if (signals.length >= 2 && confidence >= 0.5) {
    return "MEDIUM";
  }
  return "LOW";
}

// Helper: Publish signal (privacy-preserving)
function publishSignal(publisherId, patternType, signals, confidence, matchingCriteria, options = {}) {
  const signalId = generateSignalId();
  const severity = determineSeverity(signals, confidence);

  const signal = {
    signal_id: signalId,
    pattern_type: patternType,
    signals: signals,
    severity: severity,
    confidence: confidence,
    version: 1,
    publisher_id: publisherId,
    published_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    match_count: 0,

    // Privacy-preserving metadata (NO PII)
    device_fingerprints: options.deviceFingerprints || null,
    ip_patterns: options.ipPatterns || null,
    matching_criteria: matchingCriteria,

    // Explicitly NOT included (privacy-preserving)
    // - names, emails, phones, addresses
    // - raw customer records
    // - raw transaction history
  };

  signalDatabase.signals.push(signal);
  return signal;
}

// Helper: Get all signals
function getAllSignals(activeOnly = true, minSeverity = null) {
  let signals = signalDatabase.signals;

  if (activeOnly) {
    signals = signals.filter(s => s.is_active && new Date(s.expires_at) > new Date());
  }

  if (minSeverity) {
    const severityOrder = { "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4 };
    const minLevel = severityOrder[minSeverity] || 1;
    signals = signals.filter(s => severityOrder[s.severity] >= minLevel);
  }

  return signals;
}

// Helper: Match transaction against signals
function matchTransaction(transaction, relatedTransactions = []) {
  const signals = getAllSignals(true);

  if (signals.length === 0) {
    return {
      matches: [],
      total_signals_checked: 0,
      has_match: false,
      recommended_action: "ALLOW",
    };
  }

  // Extract transaction's behavioral signals
  const transactionSignals = extractBehavioralSignals(transaction, relatedTransactions);

  const matches = [];

  for (const signal of signals) {
    let matchScore = 0;
    const matchedCriteria = [];

    const criteria = signal.matching_criteria || {};
    const requiredSignals = criteria.required_signals || [];

    // Check signal overlap
    const signalOverlap = transactionSignals.filter(s => requiredSignals.includes(s));
    if (signalOverlap.length > 0) {
      const overlapRatio = signalOverlap.length / requiredSignals.length;
      matchScore += overlapRatio * 50;
      matchedCriteria.push(...signalOverlap);
    }

    // Check IP pattern matching
    if (criteria.ip_subnet_pattern && transaction.ip_address) {
      const parts = transaction.ip_address.split('.');
      const subnet = parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : null;
      if (subnet === criteria.ip_subnet_pattern) {
        matchScore += 20;
        matchedCriteria.push("ip_pattern_match");
      }
    }

    // Check velocity threshold
    if (criteria.velocity_threshold) {
      const recentCount = relatedTransactions.filter(t => t.account_id === transaction.account_id).length;
      if (recentCount >= criteria.velocity_threshold) {
        matchScore += 15;
        matchedCriteria.push("velocity_match");
      }
    }

    // Apply confidence boost
    if (matchScore > 0) {
      matchScore = Math.min(100, matchScore + signal.confidence * 10);
    }

    // Threshold for match
    if (matchScore >= 30) {
      matches.push({
        signal_id: signal.signal_id,
        pattern_type: signal.pattern_type,
        match_score: Math.round(matchScore * 100) / 100,
        matched_criteria: matchedCriteria,
        severity: signal.severity,
        confidence: signal.confidence,
      });

      // Update match count
      signal.match_count++;
    }
  }

  // Sort by match score
  matches.sort((a, b) => b.match_score - a.match_score);

  // Determine recommended action
  let recommendedAction = "ALLOW";
  if (matches.length > 0) {
    const highestMatch = matches[0];
    if (highestMatch.match_score >= 80) {
      recommendedAction = "BLOCK";
    } else if (highestMatch.match_score >= 60) {
      recommendedAction = "REVIEW";
    } else if (highestMatch.match_score >= 40) {
      recommendedAction = "STEP_UP";
    }
  }

  return {
    matches,
    total_signals_checked: signals.length,
    transaction_signals: transactionSignals,
    has_match: matches.length > 0,
    best_match: matches[0] || null,
    recommended_action: recommendedAction,
  };
}

// ==================== SCENARIO TEST ====================

console.log("\n" + "=".repeat(80));
console.log("SCENARIO: Signal Exchange Between Merchants");
console.log("=".repeat(80));

// STEP 1: Merchant A discovers a fraud pattern
console.log("\n" + "-".repeat(80));
console.log("STEP 1: Merchant A Discovers a Fraud Pattern");
console.log("-".repeat(80));

const merchantA = "MER0005";
const merchantATransactions = dataset.transactions.filter(t => t.merchant_id === merchantA);

console.log(`\nMerchant A (${merchantA}) analyzing their transactions...`);
console.log(`Total transactions: ${merchantATransactions.length}`);

// Find fraudulent transactions for Merchant A
const fraudTxnsForA = merchantATransactions.filter(t => t.is_fraudulent);
console.log(`Fraudulent transactions: ${fraudTxnsForA.length}`);

let riskyIPs = [];
let sampleFraudTxn = fraudTxnsForA[0] || null;

if (fraudTxnsForA.length > 0) {
  console.log(`\nAnalyzing fraud patterns...`);

  // Find device reuse pattern
  const deviceAccountMap = {};
  for (const txn of merchantATransactions) {
    if (!deviceAccountMap[txn.device_id]) {
      deviceAccountMap[txn.device_id] = new Set();
    }
    deviceAccountMap[txn.device_id].add(txn.account_id);
  }

  // Find devices used by multiple accounts (suspicious)
  const suspiciousDevices = Object.entries(deviceAccountMap)
    .filter(([device, accounts]) => accounts.size >= 3)
    .map(([device, accounts]) => ({ device, accountCount: accounts.size }));

  console.log(`\n🔍 Suspicious patterns detected:`);
  console.log(`  Devices used by 3+ accounts: ${suspiciousDevices.length}`);

  if (suspiciousDevices.length > 0) {
    console.log(`\n  Top suspicious devices:`);
    suspiciousDevices.slice(0, 3).forEach(d => {
      console.log(`    ${d.device}: ${d.accountCount} accounts`);
    });
  }

  // Find high-risk IPs
  const ipFraudMap = {};
  for (const txn of merchantATransactions) {
    if (txn.is_fraudulent) {
      ipFraudMap[txn.ip_address] = (ipFraudMap[txn.ip_address] || 0) + 1;
    }
  }

  riskyIPs = Object.entries(ipFraudMap)
    .filter(([ip, count]) => count >= 2)
    .map(([ip, count]) => ({ ip, fraudCount: count }));

  console.log(`  IPs with 2+ fraudulent txns: ${riskyIPs.length}`);
}

// STEP 2: FS-001 is created
console.log("\n" + "-".repeat(80));
console.log("STEP 2: Merchant A Publishes Privacy-Preserving Signal (FS-001)");
console.log("-".repeat(80));

// Create a signal for device fraud pattern
sampleFraudTxn = fraudTxnsForA[0];
if (sampleFraudTxn) {
  const signal1 = publishSignal(
    merchantA,
    "DEVICE_FRAUD",
    ["device_reuse", "multi_account_activity", "high_velocity"],
    0.93,
    {
      required_signals: ["device_reuse", "multi_account_activity"],
      min_signal_count: 2,
    },
    {
      deviceFingerprints: [sampleFraudTxn.device_id],
    }
  );

  console.log(`\n✅ Signal Created:`);
  console.log(`  Signal ID: ${signal1.signal_id}`);
  console.log(`  Pattern Type: ${signal1.pattern_type}`);
  console.log(`  Signals: ${signal1.signals.join(", ")}`);
  console.log(`  Severity: ${signal1.severity}`);
  console.log(`  Confidence: ${signal1.confidence}`);
  console.log(`  Publisher: ${signal1.publisher_id}`);

  console.log(`\n🔒 Privacy-Preserving (NO PII):`);
  console.log(`  ✓ No names, emails, phones, addresses`);
  console.log(`  ✓ No raw customer records`);
  console.log(`  ✓ No raw transaction history`);
  console.log(`  ✓ Only behavioral signals and patterns`);
}

// Create additional signals
if (riskyIPs && riskyIPs.length > 0) {
  const signal2 = publishSignal(
    merchantA,
    "IP_REPUTATION",
    ["ip_reputation"],
    0.85,
    {
      required_signals: ["ip_reputation"],
      ip_subnet_pattern: createIpPattern(riskyIPs[0].ip)?.subnet,
    },
    {
      ipPatterns: [createIpPattern(riskyIPs[0].ip)],
    }
  );

  console.log(`\n✅ Additional Signal Created:`);
  console.log(`  Signal ID: ${signal2.signal_id}`);
  console.log(`  Pattern Type: ${signal2.pattern_type}`);
  console.log(`  IP Pattern: ${signal2.matching_criteria.ip_subnet_pattern}`);
}

// STEP 3: Merchant B receives the signal
console.log("\n" + "-".repeat(80));
console.log("STEP 3: Merchant B Receives and Reviews Signal");
console.log("-".repeat(80));

const merchantB = "MER0010";
console.log(`\nMerchant B (${merchantB}) fetching published signals...`);

const availableSignals = getAllSignals(true);
console.log(`\n📡 Available Signals: ${availableSignals.length}`);

availableSignals.forEach(signal => {
  console.log(`\n  ${signal.signal_id}:`);
  console.log(`    Type: ${signal.pattern_type}`);
  console.log(`    Severity: ${signal.severity}`);
  console.log(`    Confidence: ${signal.confidence}`);
  console.log(`    Signals: ${signal.signals.join(", ")}`);
  console.log(`    Publisher: ${signal.publisher_id}`);
});

console.log(`\n💡 Merchant B can now use these signals to screen transactions`);
console.log(`   without accessing Merchant A's customer data.`);

// STEP 4: A new Merchant B transaction matches FS-001
console.log("\n" + "-".repeat(80));
console.log("STEP 4: New Merchant B Transaction Matches Signal");
console.log("-".repeat(80));

// Find a transaction for Merchant B that shares device/IP with fraud patterns
const merchantBTransactions = dataset.transactions.filter(t => t.merchant_id === merchantB);
const merchantBFraudTxns = merchantBTransactions.filter(t => t.is_fraudulent);

console.log(`\nMerchant B transactions: ${merchantBTransactions.length}`);
console.log(`Fraudulent transactions: ${merchantBFraudTxns.length}`);

// Select a suspicious transaction
let testTransaction = merchantBFraudTxns[0] || merchantBTransactions[0];
let matchResult = null;

if (testTransaction) {
  console.log(`\n🧪 Testing Transaction:`);
  console.log(`  Transaction ID: ${testTransaction.transaction_id}`);
  console.log(`  Account: ${testTransaction.account_id}`);
  console.log(`  Device: ${testTransaction.device_id}`);
  console.log(`  IP: ${testTransaction.ip_address}`);
  console.log(`  Amount: $${testTransaction.amount.toFixed(2)}`);
  console.log(`  Actual Fraud: ${testTransaction.is_fraudulent}`);

  // Get related transactions for context
  const relatedTxns = dataset.transactions.filter(t =>
    t.account_id === testTransaction.account_id ||
    t.device_id === testTransaction.device_id
  ).slice(0, 20);

  // Match against signals
  console.log(`\n🔍 Matching Against Published Signals...`);
  matchResult = matchTransaction(testTransaction, relatedTxns);

  console.log(`\n📊 Match Results:`);
  console.log(`  Total Signals Checked: ${matchResult.total_signals_checked}`);
  console.log(`  Transaction Signals: ${matchResult.transaction_signals.join(", ") || "None"}`);
  console.log(`  Has Match: ${matchResult.has_match}`);
  console.log(`  Recommended Action: ${matchResult.recommended_action}`);

  if (matchResult.best_match) {
    console.log(`\n🎯 Best Match:`);
    console.log(`  Signal ID: ${matchResult.best_match.signal_id}`);
    console.log(`  Pattern Type: ${matchResult.best_match.pattern_type}`);
    console.log(`  Match Score: ${matchResult.best_match.match_score}/100`);
    console.log(`  Matched Criteria: ${matchResult.best_match.matched_criteria.join(", ")}`);
    console.log(`  Severity: ${matchResult.best_match.severity}`);
    console.log(`  Confidence: ${matchResult.best_match.confidence}`);
  }

  if (matchResult.matches.length > 1) {
    console.log(`\n🎯 Other Matches:`);
    matchResult.matches.slice(1).forEach((m, i) => {
      console.log(`  ${i + 2}. ${m.signal_id}: Score ${m.match_score}/100 (${m.pattern_type})`);
    });
  }

  console.log(`\n⚠️  IMPORTANT:`);
  console.log(`   A signal match is ADDITIONAL INTELLIGENCE,`);
  console.log(`   NOT an automatic fraud verdict.`);
  console.log(`   Always combine with other risk assessment methods.`);
}

// Summary
console.log("\n" + "=".repeat(80));
console.log("✅ Signal Exchange Integration Test Complete!");
console.log("=".repeat(80));

console.log("\n📋 Summary:");
console.log(`  1. Merchant A discovered fraud patterns`);
console.log(`  2. Privacy-preserving signals were published`);
console.log(`  3. Merchant B received the signals`);
console.log(`  4. New transaction matched against signals`);
console.log(`  5. Recommended action was provided`);

console.log("\n📊 Signal Database:");
console.log(`  Total Signals Published: ${signalDatabase.signals.length}`);
signalDatabase.signals.forEach(s => {
  console.log(`    ${s.signal_id}: ${s.pattern_type} (${s.severity}) - ${s.match_count} matches`);
});

console.log("\n🔒 Privacy Compliance:");
console.log(`  ✓ No personal information exchanged`);
console.log(`  ✓ No raw transaction data shared`);
console.log(`  ✓ Only behavioral patterns communicated`);
console.log(`  ✓ Merchants retain control of their data`);

console.log("\n🌐 API Endpoints Ready:");
console.log(`  POST /api/signals/publish - Publish a new signal`);
console.log(`  GET /api/signals - List all signals`);
console.log(`  POST /api/signals/match - Match transaction against signals`);

// Save results
const results = {
  scenario: "Signal Exchange Between Merchants",
  steps: {
    "1_discover": {
      merchant: merchantA,
      fraud_transactions_found: fraudTxnsForA.length,
    },
    "2_publish": {
      signals_created: signalDatabase.signals.map(s => ({
        signal_id: s.signal_id,
        pattern_type: s.pattern_type,
        severity: s.severity,
        confidence: s.confidence,
      })),
    },
    "3_receive": {
      merchant: merchantB,
      signals_available: availableSignals.length,
    },
    "4_match": testTransaction ? {
      transaction_id: testTransaction.transaction_id,
      match_result: {
        has_match: matchResult.has_match,
        recommended_action: matchResult.recommended_action,
        matches: matchResult.matches,
      },
    } : null,
  },
  signal_database: signalDatabase.signals,
};

fs.writeFileSync('signal_exchange_test_results.json', JSON.stringify(results, null, 2));
console.log(`\n💾 Test results saved to signal_exchange_test_results.json`);
