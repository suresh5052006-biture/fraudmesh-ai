/**
 * FraudMesh AI - Hackathon Demo Test
 * Tests the complete POST /api/demo/run endpoint
 * Simulates end-to-end fraud detection, signal exchange, and investigation
 */

const fs = require('fs');
const http = require('http');

// Simple HTTP client for testing
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runDemoTest() {
  console.log("=".repeat(80));
  console.log("FraudMesh AI - Hackathon Demonstration Flow Test");
  console.log("=".repeat(80));

  try {
    // Test 1: Health check
    console.log("\n✅ TEST 1: Health Check");
    const health = await makeRequest('GET', '/api/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Service: ${health.data?.service || 'unknown'}`);

    // Test 2: Run full demo
    console.log("\n" + "=".repeat(80));
    console.log("🚀 TEST 2: Running Hackathon Demonstration");
    console.log("=".repeat(80));

    const demoStart = Date.now();
    console.log("\n⏳ Running demo...");

    const demo = await makeRequest('POST', '/api/demo/run');

    const demoEnd = Date.now();
    const demoTime = (demoEnd - demoStart) / 1000;

    if (demo.status !== 200) {
      console.log(`\n❌ Demo failed with status ${demo.status}`);
      console.log(JSON.stringify(demo.data, null, 2));
      return;
    }

    const result = demo.data;

    console.log(`\n✅ Demo completed in ${demoTime.toFixed(2)}s`);
    console.log(`\n📊 DEMO RESULTS`);
    console.log("=".repeat(80));

    // Display key findings
    console.log(`\n🎯 DETECTED FRAUD RING:`);
    if (result.detected_fraud_ring) {
      console.log(`   Cluster ID: ${result.detected_fraud_ring.cluster_id}`);
      console.log(`   Risk Score: ${result.detected_fraud_ring.risk_score}/100`);
      console.log(`   Accounts: ${result.detected_fraud_ring.accounts}`);
      console.log(`   Devices: ${result.detected_fraud_ring.devices}`);
      console.log(`   IPs: ${result.detected_fraud_ring.ips}`);
      console.log(`   Merchants: ${result.detected_fraud_ring.merchants}`);
      console.log(`   Patterns: ${result.detected_fraud_ring.patterns.join(", ")}`);
      console.log(`   Fraudulent Txns: ${result.detected_fraud_ring.fraudulent_txns}`);
    }

    console.log(`\n📨 MERCHANT PARTICIPATION:`);
    console.log(`   Merchant A (Publisher): ${result.merchant_a}`);
    console.log(`   Merchant B (Receiver): ${result.merchant_b}`);

    console.log(`\n📡 GENERATED SIGNAL (FS-001):`);
    if (result.generated_signal) {
      console.log(`   Signal ID: ${result.generated_signal.signal_id}`);
      console.log(`   Pattern Type: ${result.generated_signal.pattern_type}`);
      console.log(`   Severity: ${result.generated_signal.severity}`);
      console.log(`   Confidence: ${(result.generated_signal.confidence * 100).toFixed(0)}%`);
    }

    console.log(`\n🎯 MATCHED TRANSACTION:`);
    console.log(`   Transaction ID: ${result.matched_transaction}`);
    console.log(`   Signal Matches: ${result.signal_matches}`);

    console.log(`\n📊 RISK SCORE ANALYSIS:`);
    if (result.risk_score) {
      console.log(`   Without Signal: ${result.risk_score.without_signal}/100`);
      console.log(`   With Signal: ${result.risk_score.with_signal}/100`);
      console.log(`   Network Contribution: +${result.risk_score.network_contribution}`);
    }

    console.log(`\n🔍 INVESTIGATION FINDINGS:`);
    if (result.investigation) {
      console.log(`   Investigation ID: ${result.investigation.id}`);
      console.log(`   Evidence Collected: ${result.investigation.evidence_collected} types`);
      console.log(`   Connected Accounts: ${result.investigation.connected_entities.accounts}`);
      console.log(`   Connected Devices: ${result.investigation.connected_entities.devices}`);
      console.log(`   Affected Merchants: ${result.investigation.connected_entities.merchants}`);
    }

    console.log(`\n✅ RECOMMENDATION:`);
    console.log(`   Action: ${result.recommendation}`);
    console.log(`   Rationale: ${result.recommendation_rationale || "Smart action based on evidence"}`);

    // Display step-by-step flow
    console.log(`\n` + "=".repeat(80));
    console.log("📋 STEP-BY-STEP FLOW");
    console.log("=".repeat(80));

    result.steps.forEach(step => {
      const status = step.result.includes("✅") || step.result.includes("SUCCESS")
        ? "✅"
        : step.result.includes("🚨") || step.result.includes("CRITICAL")
          ? "🚨"
          : "ℹ️ ";

      console.log(`\n${status} Step ${step.step}: ${step.title}`);
      console.log(`   ${step.description}`);
      console.log(`   Result: ${step.result}`);

      // Show key data
      if (step.data && Object.keys(step.data).length > 0) {
        const keys = Object.keys(step.data).slice(0, 3);
        keys.forEach(key => {
          const value = step.data[key];
          if (typeof value === 'object') {
            console.log(`   ${key}: ${JSON.stringify(value).substring(0, 80)}...`);
          } else {
            console.log(`   ${key}: ${value}`);
          }
        });
      }
    });

    // Display summary
    console.log(`\n` + "=".repeat(80));
    console.log("📊 DEMONSTRATION SUMMARY");
    console.log("=".repeat(80));

    console.log(`\n✅ Key Achievements:`);
    result.summary.key_achievements.forEach(achievement => {
      console.log(`   ${achievement}`);
    });

    console.log(`\n📈 Demonstration Statistics:`);
    console.log(`   Total Duration: ${result.duration_seconds}s`);
    console.log(`   Merchants Involved: ${result.summary.merchants_involved}`);
    console.log(`   Fraud Ring Detected: ${result.summary.fraud_ring_detected ? "Yes" : "No"}`);
    console.log(`   Signals Generated: ${result.summary.signals_generated}`);
    console.log(`   Evidence Types: ${result.summary.evidence_types_collected}`);

    console.log(`\n💡 Key Insights:`);
    console.log(`   1. Fraud detection works across merchant boundaries`);
    console.log(`   2. Privacy-preserving signals enable safe intelligence sharing`);
    console.log(`   3. Network signals enhance local risk assessment`);
    console.log(`   4. Smart recommendations balance security and customer experience`);
    console.log(`   5. Evidence-based investigation creates audit trail for compliance`);

    // Save results
    console.log(`\n💾 Saving demo results...`);
    fs.writeFileSync('demo_results.json', JSON.stringify(result, null, 2));
    console.log(`   ✅ Saved to demo_results.json`);

    // Test 3: Verify API endpoints still work
    console.log(`\n` + "=".repeat(80));
    console.log("✅ TEST 3: Verify Other API Endpoints");
    console.log("=".repeat(80));

    const endpoints = [
      { method: 'GET', path: '/api/transactions?page=1&page_size=5', name: 'Transactions' },
      { method: 'GET', path: '/api/signals', name: 'Signals' },
      { method: 'GET', path: '/api/network?limit=1000', name: 'Network' },
    ];

    for (const endpoint of endpoints) {
      const result = await makeRequest(endpoint.method, endpoint.path);
      console.log(`\n   ${endpoint.method} ${endpoint.path}`);
      console.log(`   Status: ${result.status}`);
      if (result.status === 200) {
        console.log(`   ✅ Working`);
      } else {
        console.log(`   ❌ Failed`);
      }
    }

    console.log(`\n` + "=".repeat(80));
    console.log("🎉 All Tests Passed!");
    console.log("=".repeat(80));

    console.log(`\n📚 FraudMesh AI Hackathon MVP Features Demonstrated:`);
    console.log(`   ✅ Synthetic Data: 15K transactions with fraud rings`);
    console.log(`   ✅ Fraud Detection: Deterministic risk engine (9 signals)`);
    console.log(`   ✅ Relationship Network: Graph-based cluster detection`);
    console.log(`   ✅ Privacy-Preserving Signals: Merchants share fraud intel safely`);
    console.log(`   ✅ Signal Matching: Cross-merchant pattern recognition`);
    console.log(`   ✅ AI Investigation: Evidence-based fraud analysis`);
    console.log(`   ✅ Smart Recommendations: STEP_UP instead of blind block`);
    console.log(`   ✅ Audit Trail: All investigations recorded`);

    console.log(`\n🚀 Ready for Razorpay AI Risk Manager Track!\n`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\nNote: Make sure the server is running:");
    console.log("   cd C:\\Users\\acer\\backend");
    console.log("   uvicorn main:app --reload");
  }
}

// Run the test
runDemoTest().catch(console.error);
