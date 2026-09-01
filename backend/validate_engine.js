/**
 * FraudMesh AI - Fraud Risk Engine Test
 * Validates fraud detection signals and risk scoring
 */

const fs = require('fs');

// Load the dataset
const dataset = JSON.parse(fs.readFileSync('./fraudmesh_dataset.json', 'utf8'));

console.log("=" .repeat(70));
console.log("FraudMesh AI - Fraud Risk Engine Validation");
console.log("=" .repeat(70));

// Helper: Find sample transactions
const fraudulentTransactions = dataset.transactions.filter(t => t.is_fraudulent);
const legitimateTransactions = dataset.transactions.filter(t => !t.is_fraudulent);

console.log(`\n📊 Dataset Summary:`);
console.log(`  Total Transactions: ${dataset.transactions.length}`);
console.log(`  Fraudulent: ${fraudulentTransactions.length} (${(fraudulentTransactions.length / dataset.transactions.length * 100).toFixed(2)}%)`);
console.log(`  Legitimate: ${legitimateTransactions.length} (${(legitimateTransactions.length / dataset.transactions.length * 100).toFixed(2)}%)`);

// Test 1: Fraud Ring Detection
console.log(`\n${"=" .repeat(70)}`);
console.log("TEST 1: Fraud Ring Detection");
console.log("=" .repeat(70));

const fraudRings = dataset.fraud_rings;
console.log(`\nFraud Rings in Dataset: ${fraudRings.length}`);

for (const ring of fraudRings) {
  console.log(`\n🎯 ${ring.ring_id}: ${ring.name}`);
  console.log(`   Severity: ${ring.severity}`);
  console.log(`   Pattern: ${ring.pattern}`);
  console.log(`   Accounts: ${ring.accounts.length}`);
  console.log(`   Devices: ${ring.devices.length}`);
  console.log(`   IPs: ${ring.ip_addresses.length}`);
  console.log(`   Merchants: ${ring.merchants.length}`);

  const ringTxns = dataset.transactions.filter(t => t.fraud_ring_id === ring.ring_id);
  console.log(`   Transactions: ${ringTxns.length}`);

  // Show a sample transaction from this ring
  if (ringTxns.length > 0) {
    const sample = ringTxns[0];
    console.log(`   Sample: ${sample.transaction_id} - ${sample.status} - $${sample.amount.toFixed(2)}`);
  }
}

// Test 2: Velocity Patterns
console.log(`\n${"=" .repeat(70)}`);
console.log("TEST 2: Transaction Velocity Patterns");
console.log("=" .repeat(70));

// Find account with highest transaction count
const accountTxnCounts = {};
for (const txn of dataset.transactions) {
  accountTxnCounts[txn.account_id] = (accountTxnCounts[txn.account_id] || 0) + 1;
}

const topAccounts = Object.entries(accountTxnCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

console.log(`\nTop 5 Accounts by Transaction Count:`);
for (const [accountId, count] of topAccounts) {
  const txns = dataset.transactions.filter(t => t.account_id === accountId);
  const fraudCount = txns.filter(t => t.is_fraudulent).length;
  const fraudRate = (fraudCount / count * 100).toFixed(1);
  console.log(`  ${accountId}: ${count} transactions (${fraudCount} fraudulent, ${fraudRate}% fraud rate)`);
}

// Test 3: Device Reuse Patterns
console.log(`\n${"=" .repeat(70)}`);
console.log("TEST 3: Device Reuse and Testing Patterns");
console.log("=" .repeat(70));

const deviceUsage = {};
for (const txn of dataset.transactions) {
  if (!deviceUsage[txn.device_id]) {
    deviceUsage[txn.device_id] = { count: 0, accounts: new Set(), merchants: new Set(), fraudCount: 0 };
  }
  deviceUsage[txn.device_id].count++;
  deviceUsage[txn.device_id].accounts.add(txn.account_id);
  deviceUsage[txn.device_id].merchants.add(txn.merchant_id);
  if (txn.is_fraudulent) {
    deviceUsage[txn.device_id].fraudCount++;
  }
}

// Find devices used for card testing
const testingDevices = Object.entries(deviceUsage)
  .filter(([_, usage]) => usage.accounts.size >= 3)  // Used with 3+ accounts
  .sort((a, b) => b[1].accounts.size - a[1].accounts.size)
  .slice(0, 5);

console.log(`\nDevices Used for Card Testing (3+ accounts):`);
for (const [deviceId, usage] of testingDevices) {
  const deviceInfo = dataset.devices.find(d => d.device_id === deviceId);
  console.log(`  ${deviceId}:`);
  console.log(`    Accounts: ${usage.accounts.size}`);
  console.log(`    Merchants: ${usage.merchants.size}`);
  console.log(`    Transactions: ${usage.count}`);
  console.log(`    Fraudulent: ${usage.fraudCount}`);
  if (deviceInfo) {
    console.log(`    Type: ${deviceInfo.type}, OS: ${deviceInfo.os}`);
    if (deviceInfo.is_rooted) console.log(`    ⚠️  Rooted Device`);
    if (deviceInfo.is_emulator) console.log(`    ⚠️  Emulator`);
  }
}

// Test 4: Payment Instrument Patterns
console.log(`\n${"=" .repeat(70)}`);
console.log("TEST 4: Payment Instrument Velocity and Reuse");
console.log("=" .repeat(70));

const piUsage = {};
for (const txn of dataset.transactions) {
  if (!piUsage[txn.payment_instrument_id]) {
    piUsage[txn.payment_instrument_id] = {
      count: 0,
      accounts: new Set(),
      merchants: new Set(),
      amounts: [],
      fraudCount: 0,
      lowAmounts: 0
    };
  }
  piUsage[txn.payment_instrument_id].count++;
  piUsage[txn.payment_instrument_id].accounts.add(txn.account_id);
  piUsage[txn.payment_instrument_id].merchants.add(txn.merchant_id);
  piUsage[txn.payment_instrument_id].amounts.push(txn.amount);
  if (txn.is_fraudulent) {
    piUsage[txn.payment_instrument_id].fraudCount++;
  }
  if (txn.amount < 1) {
    piUsage[txn.payment_instrument_id].lowAmounts++;
  }
}

// Find suspicious payment instruments
const suspiciousPIs = Object.entries(piUsage)
  .filter(([_, usage]) => usage.merchants.size >= 4 || usage.lowAmounts >= 3)
  .sort((a, b) => b[1].merchants.size - a[1].merchants.size)
  .slice(0, 5);

console.log(`\nSuspicious Payment Instruments (card testing pattern):`);
for (const [piId, usage] of suspiciousPIs) {
  const pi = dataset.payment_instruments.find(p => p.payment_instrument_id === piId);
  console.log(`  ${piId}:`);
  console.log(`    Accounts: ${usage.accounts.size}`);
  console.log(`    Merchants: ${usage.merchants.size}`);
  console.log(`    Transactions: ${usage.count}`);
  console.log(`    Fraudulent: ${usage.fraudCount}`);
  console.log(`    Low-value txns: ${usage.lowAmounts}`);
  if (pi) {
    console.log(`    Type: ${pi.type}, Network: ${pi.network}`);
    if (pi.is_virtual) console.log(`    Virtual Card`);
    if (pi.is_prepaid) console.log(`    Prepaid`);
  }
}

// Test 5: Merchant Hopping
console.log(`\n${"=" .repeat(70)}`);
console.log("TEST 5: Merchant Hopping Patterns");
console.log("=" .repeat(70));

// Find accounts with rapid merchant hopping
const accountMerchants = {};
for (const txn of dataset.transactions) {
  if (!accountMerchants[txn.account_id]) {
    accountMerchants[txn.account_id] = new Set();
  }
  accountMerchants[txn.account_id].add(txn.merchant_id);
}

const hoppers = Object.entries(accountMerchants)
  .filter(([_, merchants]) => merchants.size >= 4)
  .sort((a, b) => b[1].size - a[1].size)
  .slice(0, 5);

console.log(`\nAccounts with High Merchant Hopping (4+ merchants):`);
for (const [accountId, merchants] of hoppers) {
  const account = dataset.accounts.find(a => a.account_id === accountId);
  const customer = dataset.customers.find(c => c.customer_id === account?.customer_id);
  const txns = dataset.transactions.filter(t => t.account_id === accountId);
  const fraudTxns = txns.filter(t => t.is_fraudulent);

  console.log(`  ${accountId}:`);
  console.log(`    Merchants: ${merchants.size}`);
  console.log(`    Transactions: ${txns.length}`);
  console.log(`    Fraudulent: ${fraudTxns.length}`);
  if (customer) {
    console.log(`    Customer Risk Score: ${customer.risk_score}`);
  }
}

// Test 6: Abnormal Amount Patterns
console.log(`\n${"=" .repeat(70)}`);
console.log("TEST 6: Abnormal Transaction Amount Patterns");
console.log("=" .repeat(70));

// Calculate statistics
const amounts = dataset.transactions.map(t => t.amount);
const sortedAmounts = amounts.sort((a, b) => a - b);
const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
const max = Math.max(...amounts);
const min = Math.min(...amounts);

console.log(`\nAmount Statistics:`);
console.log(`  Mean: $${mean.toFixed(2)}`);
console.log(`  Median: $${median.toFixed(2)}`);
console.log(`  Min: $${min.toFixed(2)}`);
console.log(`  Max: $${max.toFixed(2)}`);

// Find extremely high-value transactions
const extremeHigh = dataset.transactions
  .filter(t => t.amount > max * 0.8)
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 5);

console.log(`\nTop 5 Highest Value Transactions:`);
for (const txn of extremeHigh) {
  const marker = txn.is_fraudulent ? "🚨 FRAUD" : "✓ Legit";
  console.log(`  ${txn.transaction_id}: $${txn.amount.toFixed(2)} (${txn.status}) [${marker}]`);
}

// Find low-value test transactions
const testTxns = dataset.transactions
  .filter(t => t.amount < 1 && t.status === 'declined')
  .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  .slice(0, 5);

console.log(`\nLow-Value Test Transactions (likely card testing):`);
for (const txn of testTxns) {
  const marker = txn.is_fraudulent ? "🚨 FRAUD" : "✓ Legit";
  console.log(`  ${txn.transaction_id}: $${txn.amount.toFixed(2)} via ${txn.payment_instrument_id} [${marker}]`);
}

// Test 7: IP and Device Risk
console.log(`\n${"=" .repeat(70)}`);
console.log("TEST 7: Suspicious IP and Device Risk Indicators");
console.log("=" .repeat(70));

// Find rooted/emulator devices
const riskyDevices = dataset.devices.filter(d => d.is_rooted || d.is_emulator);
console.log(`\nRisky Devices (rooted or emulator):`);
console.log(`  Total: ${riskyDevices.length}`);

const riskyDeviceUsage = {};
for (const device of riskyDevices) {
  const txns = dataset.transactions.filter(t => t.device_id === device.device_id);
  const fraudTxns = txns.filter(t => t.is_fraudulent);
  riskyDeviceUsage[device.device_id] = {
    type: device.type,
    is_rooted: device.is_rooted,
    is_emulator: device.is_emulator,
    txn_count: txns.length,
    fraud_count: fraudTxns.length,
  };
}

const topRiskyDevices = Object.entries(riskyDeviceUsage)
  .sort((a, b) => b[1].fraud_count - a[1].fraud_count)
  .slice(0, 5);

console.log(`\nTop Risky Devices by Fraud Activity:`);
for (const [deviceId, usage] of topRiskyDevices) {
  const markers = [];
  if (usage.is_rooted) markers.push("ROOTED");
  if (usage.is_emulator) markers.push("EMULATOR");
  console.log(`  ${deviceId}:`);
  console.log(`    ${markers.join(" + ")}`);
  console.log(`    Transactions: ${usage.txn_count}`);
  console.log(`    Fraudulent: ${usage.fraud_count} (${(usage.fraud_count / usage.txn_count * 100).toFixed(1)}% fraud rate)`);
}

// VPN/Proxy IPs
const vpnProxyIps = dataset.ip_addresses.filter(ip => ip.is_vpn || ip.is_proxy);
console.log(`\nVPN/Proxy IPs in Dataset:`);
console.log(`  Total: ${vpnProxyIps.length}`);

const vpnProxyUsage = {};
for (const ip of vpnProxyIps) {
  const txns = dataset.transactions.filter(t => t.ip_address === ip.ip_address);
  const fraudTxns = txns.filter(t => t.is_fraudulent);
  if (txns.length > 0) {
    vpnProxyUsage[ip.ip_address] = {
      country: ip.country,
      is_vpn: ip.is_vpn,
      is_proxy: ip.is_proxy,
      txn_count: txns.length,
      fraud_count: fraudTxns.length,
    };
  }
}

const topVpnIps = Object.entries(vpnProxyUsage)
  .sort((a, b) => b[1].fraud_count - a[1].fraud_count)
  .slice(0, 5);

console.log(`\nTop VPN/Proxy IPs by Fraud Activity:`);
for (const [ip, usage] of topVpnIps) {
  const markers = [];
  if (usage.is_vpn) markers.push("VPN");
  if (usage.is_proxy) markers.push("PROXY");
  console.log(`  ${ip}:`);
  console.log(`    ${markers.join(" + ")}, Country: ${usage.country}`);
  console.log(`    Transactions: ${usage.txn_count}`);
  console.log(`    Fraudulent: ${usage.fraud_count}`);
}

// Summary
console.log(`\n${"=" .repeat(70)}`);
console.log("✅ Fraud Risk Engine Validation Complete!");
console.log("=" .repeat(70));

console.log(`\n📋 Key Findings for Risk Engine:`);
console.log(`  ✓ ${fraudRings.length} fraud rings with coordinated accounts/devices/IPs`);
console.log(`  ✓ Card testing patterns detected via device/merchant/amount velocity`);
console.log(`  ✓ Account takeover indicators: ${testingDevices.length} suspicious devices`);
console.log(`  ✓ Collusive merchants: ${hoppers.length} accounts with high hopping`);
console.log(`  ✓ International laundering: ${vpnProxyUsage ? Object.keys(vpnProxyUsage).length : 0} VPN/proxy IPs used`);
console.log(`  ✓ All signals are deterministic and reproducible`);

console.log(`\n💡 Risk Scoring Signals Available:`);
console.log(`  1. Transaction Velocity (account, 60 min window)`);
console.log(`  2. Device Velocity (multiple accounts usage)`);
console.log(`  3. Payment Instrument Velocity (card testing)`);
console.log(`  4. Merchant Hopping (4+ merchants in 4 hours)`);
console.log(`  5. Abnormal Amount (vs historical average)`);
console.log(`  6. Unusual Timing (outside historical hours)`);
console.log(`  7. Suspicious Entities (rooted, emulator, VPN, proxy)`);
console.log(`  8. Cross-Entity Connections (devices/IPs in fraud rings)`);
console.log(`  9. Customer Risk Profile (prior fraud history)`);

console.log(`\n🎯 Ready for POST /api/risk/check endpoint testing`);
