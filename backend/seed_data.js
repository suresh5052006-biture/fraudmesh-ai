/**
 * FraudMesh AI - Synthetic Data Generator (Node.js version)
 * Deterministic synthetic data for fraud detection testing
 */

const fs = require('fs');
const crypto = require('crypto');

// Seed for deterministic data generation
const RANDOM_SEED = 42;
let seedState = RANDOM_SEED;

// Seeded random number generator for determinism
function seededRandom() {
  seedState = (seedState * 9301 + 49297) % 233280;
  return seedState / 233280;
}

function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomChoices(arr, weights = null) {
  if (!weights) {
    return randomChoice(arr);
  }
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = seededRandom() * total;
  for (let i = 0; i < arr.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

function generateTimestamp(startDaysAgo = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDaysAgo);
  const randomDays = randomInt(0, startDaysAgo);
  const randomSeconds = randomInt(0, 86400);
  const resultDate = new Date(startDate);
  resultDate.setDate(resultDate.getDate() + randomDays);
  resultDate.setSeconds(resultDate.getSeconds() + randomSeconds);
  return resultDate.toISOString();
}

function generateMerchants(count = 20) {
  const categories = [
    "E-commerce", "Digital Services", "Marketplace", "SaaS",
    "Gaming", "Streaming", "Food Delivery", "Transportation",
    "Healthcare", "Education", "Finance", "Travel"
  ];
  const riskLevels = ["low", "medium", "high"];

  const merchants = [];
  for (let i = 1; i <= count; i++) {
    merchants.push({
      merchant_id: `MER${String(i).padStart(4, '0')}`,
      name: `Merchant ${i}`,
      category: randomChoice(categories),
      risk_level: randomChoices(riskLevels, [70, 20, 10]),
      created_at: generateTimestamp(365),
    });
  }
  return merchants;
}

function generateCustomers(count = 5000) {
  const firstNames = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "Robert", "Lisa",
    "William", "Jennifer", "James", "Amanda", "Charles", "Jessica", "Thomas",
    "Ashley", "Daniel", "Nicole", "Matthew", "Stephanie"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

  const customers = [];
  for (let i = 1; i <= count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    customers.push({
      customer_id: `CUS${String(i).padStart(5, '0')}`,
      email: `user${i}@example.com`,
      name: `${firstName} ${lastName}`,
      created_at: generateTimestamp(365),
      risk_score: randomInt(0, 100),
    });
  }
  return customers;
}

function generateAccounts(count = 5000, customers) {
  const accountTypes = ["checking", "savings", "business", "prepaid"];
  const statuses = ["active", "active", "active", "active", "suspended", "closed"];

  const accounts = [];
  for (let i = 1; i <= count; i++) {
    const customer = randomChoice(customers);
    accounts.push({
      account_id: `ACC${String(i).padStart(5, '0')}`,
      customer_id: customer.customer_id,
      account_type: randomChoice(accountTypes),
      status: randomChoices(statuses, [40, 30, 15, 10, 4, 1]),
      created_at: generateTimestamp(365),
      balance: Math.round(seededRandom() * 50000 * 100) / 100,
    });
  }
  return accounts;
}

function generateDevices(count = 2000) {
  const deviceTypes = ["mobile", "desktop", "tablet", "smartwatch"];
  const osList = ["iOS", "Android", "Windows", "macOS", "Linux"];
  const browsers = ["Chrome", "Safari", "Firefox", "Edge", "Opera"];

  const devices = [];
  for (let i = 1; i <= count; i++) {
    devices.push({
      device_id: `DEV${String(i).padStart(4, '0')}`,
      type: randomChoice(deviceTypes),
      os: randomChoice(osList),
      browser: randomChoice(browsers),
      fingerprint: `fp_${String(i).padStart(4, '0')}_${randomInt(10000, 99999)}`,
      is_rooted: seededRandom() < 0.05,
      is_emulator: seededRandom() < 0.02,
    });
  }
  return devices;
}

function generateIpAddresses(count = 1000) {
  const ipAddresses = [];
  for (let i = 1; i <= count; i++) {
    let octet1, octet2, octet3, octet4;
    const rand = seededRandom();

    if (rand < 0.7) {
      // Residential IPs
      octet1 = randomChoice([24, 71, 98, 126, 172, 173, 174, 184, 192, 198, 199]);
      octet2 = randomInt(0, 255);
      octet3 = randomInt(0, 255);
      octet4 = randomInt(1, 254);
    } else if (rand < 0.8) {
      // Data center IPs
      octet1 = randomChoice([23, 40, 104, 107, 108, 138, 147, 162, 167, 172]);
      octet2 = randomInt(0, 255);
      octet3 = randomInt(0, 255);
      octet4 = randomInt(1, 254);
    } else {
      // VPN/Proxy ranges
      octet1 = randomChoice([91, 185, 188, 195]);
      octet2 = randomInt(0, 255);
      octet3 = randomInt(0, 255);
      octet4 = randomInt(1, 254);
    }

    const ip = `${octet1}.${octet2}.${octet3}.${octet4}`;
    ipAddresses.push({
      ip_address: ip,
      country: randomChoice(["US", "IN", "GB", "DE", "BR", "NG", "RU", "CN", "PH", "VN"]),
      is_vpn: seededRandom() < 0.1,
      is_proxy: seededRandom() < 0.05,
      is_datacenter: seededRandom() < 0.1,
      risk_score: randomInt(0, 100),
    });
  }
  return ipAddresses;
}

function generatePaymentInstruments(count = 2000, customers) {
  const instrumentTypes = ["card", "bank_account", "upi", "wallet"];
  const networks = ["Visa", "Mastercard", "RuPay", "None", "None", "None"];

  const instruments = [];
  for (let i = 1; i <= count; i++) {
    const customer = randomChoice(customers);
    const pType = randomChoice(instrumentTypes);
    const lastFour = String(randomInt(1000, 9999));
    const network = pType === "card" ? randomChoice(networks) : "None";

    instruments.push({
      payment_instrument_id: `PI${String(i).padStart(4, '0')}`,
      customer_id: customer.customer_id,
      type: pType,
      last_four: lastFour,
      network: network,
      is_prepaid: seededRandom() < 0.1,
      is_virtual: seededRandom() < 0.15,
      is_issuing_country_high_risk: seededRandom() < 0.08,
    });
  }
  return instruments;
}

function createFraudRings(merchants, customers, accounts, devices, ipAddresses, paymentInstruments) {
  // Index data for efficient lookup
  const accountsById = {};
  for (const acc of accounts) {
    accountsById[acc.account_id] = acc;
  }

  const devicesById = {};
  for (const dev of devices) {
    devicesById[dev.device_id] = dev;
  }

  const fraudRings = [];

  // Fraud Ring 1: Quick Cashout Ring
  const ring1Accounts = [];
  for (let i = 0; i < 50; i++) {
    ring1Accounts.push(randomChoice(accounts).account_id);
  }
  const ring1Device = randomChoice(devices);
  const ring1Ip = randomChoice(ipAddresses);
  const ring1Merchants = [];
  for (let i = 0; i < 3; i++) {
    const m = randomChoice(merchants.filter(m => m.risk_level === "high"));
    ring1Merchants.push(m.merchant_id);
  }

  fraudRings.push({
    ring_id: "FR001",
    name: "Quick Cashout Ring",
    description: "High-value transactions from new accounts using same device and IP",
    accounts: ring1Accounts,
    devices: [ring1Device.device_id],
    ip_addresses: [ring1Ip.ip_address],
    merchants: ring1Merchants,
    pattern: "high_velocity_new_accounts_same_device",
    severity: "critical",
  });

  // Fraud Ring 2: Card Testing Ring
  const ring2Accounts = [];
  for (let i = 0; i < 100; i++) {
    const acc = randomChoice(accounts.filter(a => a.status === "active"));
    ring2Accounts.push(acc.account_id);
  }
  const ring2Devices = [];
  for (let i = 0; i < 20; i++) {
    ring2Devices.push(randomChoice(devices).device_id);
  }
  const ring2Ips = [];
  for (let i = 0; i < 10; i++) {
    ring2Ips.push(randomChoice(ipAddresses).ip_address);
  }

  fraudRings.push({
    ring_id: "FR002",
    name: "Card Testing Ring",
    description: "Small test transactions across many accounts and devices",
    accounts: ring2Accounts,
    devices: ring2Devices,
    ip_addresses: ring2Ips,
    merchants: [],
    pattern: "small_test_transactions_distributed",
    severity: "high",
  });

  // Fraud Ring 3: Account Takeover Pattern
  const ring3Accounts = [];
  for (let i = 0; i < 30; i++) {
    ring3Accounts.push(randomChoice(accounts).account_id);
  }
  const ring3Devices = devices.filter(d => d.is_rooted || d.is_emulator).slice(0, 5);
  const ring3Ips = ipAddresses.filter(ip => ip.is_vpn).slice(0, 3);

  fraudRings.push({
    ring_id: "FR003",
    name: "Account Takeover Ring",
    description: "Multiple accounts with sudden device/IP changes to compromised endpoints",
    accounts: ring3Accounts,
    devices: ring3Devices.map(d => d.device_id),
    ip_addresses: ring3Ips.map(ip => ip.ip_address),
    merchants: [],
    pattern: "account_takeover_indicators",
    severity: "critical",
  });

  // Fraud Ring 4: Collusive Merchant Ring
  const ring4Merchants = [];
  for (let i = 0; i < 5; i++) {
    const m = randomChoice(merchants.filter(m => ["E-commerce", "Marketplace"].includes(m.category)));
    ring4Merchants.push(m.merchant_id);
  }
  const ring4Accounts = [];
  for (let i = 0; i < 30; i++) {
    ring4Accounts.push(randomChoice(accounts).account_id);
  }
  const ring4Ips = ipAddresses.filter(ip => ip.is_datacenter).slice(0, 5);

  fraudRings.push({
    ring_id: "FR004",
    name: "Collusive Merchant Ring",
    description: "Multiple merchants coordinating with accounts using data center IPs",
    accounts: ring4Accounts,
    devices: Array.from({length: 10}, () => randomChoice(devices).device_id),
    ip_addresses: ring4Ips.map(ip => ip.ip_address),
    merchants: ring4Merchants,
    pattern: "merchant_account_collusion",
    severity: "high",
  });

  // Fraud Ring 5: International Money Laundering Ring
  const ring5Accounts = [];
  for (let i = 0; i < 40; i++) {
    ring5Accounts.push(randomChoice(accounts).account_id);
  }
  const ring5HighRiskIps = ipAddresses.filter(ip => ip.risk_score > 70 || ip.is_proxy).slice(0, 5);
  const ring5Merchants = [];
  for (let i = 0; i < 4; i++) {
    const m = randomChoice(merchants.filter(m => ["Travel", "Finance"].includes(m.category)));
    ring5Merchants.push(m.merchant_id);
  }

  fraudRings.push({
    ring_id: "FR005",
    name: "International Laundering Ring",
    description: "Large transactions using high-risk proxy IPs and international flows",
    accounts: ring5Accounts,
    devices: Array.from({length: 8}, () => randomChoice(devices).device_id),
    ip_addresses: ring5HighRiskIps.map(ip => ip.ip_address),
    merchants: ring5Merchants,
    pattern: "international_money_laundering",
    severity: "critical",
  });

  return fraudRings;
}

function generateTransactions(count = 15000, merchants, customers, accounts, devices, ipAddresses, paymentInstruments, fraudRings) {
  // Build lookup maps
  const accountsById = {};
  for (const acc of accounts) {
    accountsById[acc.account_id] = acc;
  }
  const devicesById = {};
  for (const dev of devices) {
    devicesById[dev.device_id] = dev;
  }

  // Count fraudulent transactions per ring
  const ringTransactionCount = Math.floor(count * 0.1); // 10% fraud
  const ringCounts = {};
  for (const ring of fraudRings) {
    ringCounts[ring.ring_id] = Math.floor(ringTransactionCount / 5);
  }

  const transactions = [];
  const ringTransactionsGenerated = {};
  for (const ring of fraudRings) {
    ringTransactionsGenerated[ring.ring_id] = 0;
  }

  for (let i = 1; i <= count; i++) {
    let isFraudulent = false;
    let assignedRing = null;

    // Determine if this transaction should be fraudulent
    if (fraudRings.length > 0) {
      for (const ring of fraudRings) {
        if (ringTransactionsGenerated[ring.ring_id] < ringCounts[ring.ring_id]) {
          if (seededRandom() < 0.01) {
            isFraudulent = true;
            assignedRing = ring;
            ringTransactionsGenerated[ring.ring_id]++;
            break;
          }
        }
      }
    }

    let merchant, account, device, ipAddress;

    if (assignedRing) {
      // Fraudulent transaction
      const accountId = randomChoice(assignedRing.accounts);
      account = accountsById[accountId] || randomChoice(accounts);

      if (assignedRing.devices && assignedRing.devices.length > 0) {
        const deviceId = randomChoice(assignedRing.devices);
        device = devicesById[deviceId] || randomChoice(devices);
      } else {
        device = randomChoice(devices);
      }

      if (assignedRing.ip_addresses && assignedRing.ip_addresses.length > 0) {
        ipAddress = randomChoice(assignedRing.ip_addresses);
      } else {
        ipAddress = randomChoice(ipAddresses).ip_address;
      }

      if (assignedRing.merchants && assignedRing.merchants.length > 0) {
        const merchantId = randomChoice(assignedRing.merchants);
        merchant = merchants.find(m => m.merchant_id === merchantId) || randomChoice(merchants);
      } else {
        merchant = randomChoice(merchants);
      }

      const amount = Math.round((seededRandom() * 9500 + 500) * 100) / 100;
      const timestamp = generateTimestamp(7);

      const status = randomChoices(
        ["declined", "declined", "declined", "completed", "failed"],
        [35, 35, 35, 20, 5]
      );

      transactions.push({
        transaction_id: `TXN${String(i).padStart(6, '0')}`,
        merchant_id: merchant.merchant_id,
        customer_id: account.customer_id,
        account_id: account.account_id,
        device_id: device.device_id,
        ip_address: ipAddress,
        payment_instrument_id: randomChoice(paymentInstruments).payment_instrument_id,
        amount: amount,
        timestamp: timestamp,
        status: status,
        is_fraudulent: isFraudulent,
        fraud_ring_id: assignedRing.ring_id,
      });
    } else {
      // Legitimate transaction
      account = randomChoice(accounts);
      device = randomChoice(devices);
      const ipInfo = randomChoice(ipAddresses);
      ipAddress = ipInfo.ip_address;
      merchant = randomChoice(merchants);

      const amount = Math.round(Math.exp(seededRandom() * 3) * 100) / 100;
      const timestamp = generateTimestamp(90);

      const status = randomChoices(
        ["completed", "completed", "completed", "completed", "pending", "failed", "declined", "declined"],
        [40, 40, 40, 40, 15, 10, 10, 10]
      );

      transactions.push({
        transaction_id: `TXN${String(i).padStart(6, '0')}`,
        merchant_id: merchant.merchant_id,
        customer_id: account.customer_id,
        account_id: account.account_id,
        device_id: device.device_id,
        ip_address: ipAddress,
        payment_instrument_id: randomChoice(paymentInstruments).payment_instrument_id,
        amount: amount,
        timestamp: timestamp,
        status: status,
        is_fraudulent: false,
        fraud_ring_id: null,
      });
    }
  }

  return transactions;
}

function generateDataset() {
  console.log("Generating FraudMesh AI synthetic dataset...");
  console.log("=".repeat(50));

  console.log("Generating 20 merchants...");
  const merchants = generateMerchants(20);

  console.log("Generating 5,000 customers...");
  const customers = generateCustomers(5000);

  console.log("Generating 5,000 accounts...");
  const accounts = generateAccounts(5000, customers);

  console.log("Generating 2,000 devices...");
  const devices = generateDevices(2000);

  console.log("Generating 1,000 IP addresses...");
  const ipAddresses = generateIpAddresses(1000);

  console.log("Generating 2,000 payment instruments...");
  const paymentInstruments = generatePaymentInstruments(2000, customers);

  console.log("Creating 5 fraud rings...");
  const fraudRings = createFraudRings(merchants, customers, accounts, devices, ipAddresses, paymentInstruments);

  console.log("Generating 15,000 transactions...");
  const transactions = generateTransactions(15000, merchants, customers, accounts, devices, ipAddresses, paymentInstruments, fraudRings);

  const dataset = {
    metadata: {
      generated_at: new Date().toISOString(),
      seed: RANDOM_SEED,
      version: "1.0.0",
    },
    merchants,
    customers,
    accounts,
    devices,
    ip_addresses: ipAddresses,
    payment_instruments: paymentInstruments,
    fraud_rings: fraudRings,
    transactions,
  };

  // Print summary
  console.log("=".repeat(50));
  console.log("Dataset generation complete!");
  console.log(`  - Merchants: ${merchants.length}`);
  console.log(`  - Customers: ${customers.length}`);
  console.log(`  - Accounts: ${accounts.length}`);
  console.log(`  - Devices: ${devices.length}`);
  console.log(`  - IP Addresses: ${ipAddresses.length}`);
  console.log(`  - Payment Instruments: ${paymentInstruments.length}`);
  console.log(`  - Fraud Rings: ${fraudRings.length}`);
  console.log(`  - Transactions: ${transactions.length}`);

  const fraudCount = transactions.filter(t => t.is_fraudulent).length;
  console.log(`\nFraud Statistics:`);
  console.log(`  - Fraudulent Transactions: ${fraudCount} (${(fraudCount / transactions.length * 100).toFixed(2)}%)`);
  console.log(`  - Legitimate Transactions: ${transactions.length - fraudCount}`);

  // Print fraud ring details
  console.log(`\nFraud Ring Details:`);
  for (const ring of fraudRings) {
    const ringTxns = transactions.filter(t => t.fraud_ring_id === ring.ring_id).length;
    console.log(`  ${ring.ring_id}: ${ring.name}`);
    console.log(`    - Accounts: ${ring.accounts.length}, Devices: ${ring.devices.length}, IPs: ${ring.ip_addresses.length}`);
    console.log(`    - Transactions: ${ringTxns}, Severity: ${ring.severity}`);
  }

  return dataset;
}

// Main execution
try {
  const dataset = generateDataset();

  // Save to JSON file
  const outputFile = "fraudmesh_dataset.json";
  fs.writeFileSync(outputFile, JSON.stringify(dataset, null, 2));
  console.log(`\nDataset saved to ${outputFile}`);

  // Print sample transaction
  console.log("\nSample legitimate transaction:");
  const legit = dataset.transactions.find(t => !t.is_fraudulent);
  console.log(JSON.stringify(legit, null, 2));

  console.log("\nSample fraudulent transaction:");
  const fraud = dataset.transactions.find(t => t.is_fraudulent);
  console.log(JSON.stringify(fraud, null, 2));
} catch (error) {
  console.error("Error generating dataset:", error);
  process.exit(1);
}
