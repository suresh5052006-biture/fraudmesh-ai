# FraudMesh AI - Implementation Summary

## What Was Implemented

### 1. **Synthetic Data Layer** (`seed_data.py`, `seed_data.js`, `fraudmesh_dataset.json`)
- **20 merchants** with categories and risk levels
- **5,000 customers** with synthetic names and risk scores
- **5,000 accounts** linked to customers with balances
- **2,000 devices** with fingerprints, OS, browser, rooted/emulator flags
- **1,000 IP addresses** with country, VPN/proxy/datacenter flags, risk scores
- **2,000 payment instruments** with type, network, virtual/prepaid flags
- **15,000 transactions** with comprehensive metadata
- **5 coordinated fraud rings** planted:
  1. **Quick Cashout Ring** (FR001) - Critical severity, high-velocity same device/IP
  2. **Card Testing Ring** (FR002) - High severity, distributed small transactions
  3. **Account Takeover Ring** (FR003) - Critical severity, compromised endpoints
  4. **Collusive Merchant Ring** (FR004) - High severity, merchant-account collusion
  5. **International Laundering Ring** (FR005) - Critical severity, high-risk proxy IPs

### 2. **Database Layer** (`models.py`, `database.py`)
- **SQLAlchemy ORM** with 10 tables:
  1. `merchants` - Business entities with risk levels
  2. `customers` - Synthetic customer profiles
  3. `accounts` - Financial accounts linked to customers
  4. `devices` - Device fingerprints with security flags
  5. `transactions` - 15K transactions with fraud markers
  6. `payment_instruments` - Payment method metadata
  7. `ip_addresses` - IP risk profiles
  8. `fraud_rings` - Fraud ring definitions and patterns
  9. `fraud_signals` - Signal tracking table
  10. `investigations` - Investigation workflow
- **SQLite database** (`fraudmesh.db`) with proper relationships
- **Auto-initialization** and **auto-seeding** on first run
- **Indexes** on common query fields

### 3. **Deterministic Fraud Risk Engine** (`fraud_engine.py`)
**9 Explainable Detection Signals:**
1. **Transaction Velocity** - Multiple txns from same account in 60 min window
2. **Device Velocity** - Device used with multiple accounts (card testing)
3. **Payment Instrument Velocity** - PI used with multiple merchants (card testing)
4. **Merchant Hopping** - Account with 4+ merchants in 4 hours
5. **Abnormal Amount** - Transaction vs historical average (5x outlier)
6. **Unusual Timing** - Transaction outside customer's historical hours
7. **Suspicious Entities** - Rooted devices, emulators, VPNs, proxies, datacenter IPs
8. **Cross-Entity Connections** - Devices/IPs appearing in fraud rings
9. **Customer Risk Profile** - Historical fraud patterns per customer

**Risk Scoring:**
- **Score Range:** 0-100
- **Risk Levels:** LOW (<40), MEDIUM (40-59), HIGH (60-79), CRITICAL (80+)
- **Recommended Actions:** ALLOW, STEP_UP, REVIEW, BLOCK

**Deterministic & Reproducible:** No LLM used for scoring - pure logic

### 4. **API Endpoints** (`main.py`)

#### Current Endpoints:
- `GET /api/health` - Service health check
- `GET /api/transactions` - Paginated transaction list with fraud filter
  - Query params: `page`, `page_size`, `fraud_only`
- `POST /api/risk/check` - Fraud risk assessment endpoint
  - **Request:** transaction details (account, device, PI, IP, merchant, amount)
  - **Response:** risk score, level, signals, recommended action

#### Risk Check Example Request:
```json
{
  "account_id": "ACC03476",
  "device_id": "DEV0834", 
  "payment_instrument_id": "PI1644",
  "ip_address": "174.142.188.197",
  "merchant_id": "MER0005",
  "customer_id": "CUS04022",
  "amount": 5443.48
}
```

#### Risk Check Example Response:
```json
{
  "risk_score": 72,
  "risk_level": "HIGH",
  "recommended_action": "REVIEW",
  "signals": [
    {
      "signal_type": "abnormal_amount",
      "description": "Very high amount: $5443.48 (5x historical average)",
      "score_contribution": 15.0
    },
    {
      "signal_type": "device_velocity",
      "description": "Device testing pattern: used with 54 different accounts",
      "score_contribution": 30.0
    },
    {
      "signal_type": "suspicious_entities",
      "description": "VPN detected",
      "score_contribution": 10.0
    }
  ]
}
```

## Files Created

```
backend/
├── main.py                    # FastAPI app with endpoints
├── models.py                  # SQLAlchemy ORM models (10 tables)
├── database.py               # DB initialization and seeding
├── fraud_engine.py           # Deterministic fraud risk engine
├── seed_data.py             # Python synthetic data generator
├── seed_data.js             # Node.js synthetic data generator
├── test_fraud_engine.py     # Python test script
├── validate_engine.js       # Validation test for fraud signals
├── requirements.txt         # Python dependencies
├── .env.example             # Environment template
└── fraudmesh_dataset.json   # 15K synthetic transactions (758 fraud)
```

## Validation Results

### Fraud Patterns Found:
1. **Card Testing Pattern** - `DEV0134` used with **54 different accounts** (163 fraudulent txns)
2. **Device Reuse** - `DEV1814` (emulator) with 92% fraud rate
3. **VPN/Proxy Traffic** - 149 suspicious IPs with high fraud activity
4. **Merchant Hopping** - 5+ accounts using 9+ different merchants
5. **Extreme Amounts** - Transactions up to $9,994 (5x historical average)

### Dataset Statistics:
- **Total Transactions:** 15,000
- **Fraudulent:** 758 (5.05%)
- **Fraud Rings:** 5 coordinated patterns
- **Avg Transaction Amount:** $278.29
- **Median Transaction Amount:** $4.91
- **Risk Signals:** 9 deterministic detection algorithms

## To Run and Test

```bash
cd C:\Users\acer\backend

# Install dependencies
pip install -r requirements.txt
# OR: py -m pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

### Test Commands:
```bash
# Health check
curl http://localhost:8000/api/health

# Get transactions (paginated)
curl "http://localhost:8000/api/transactions?page=1&page_size=10"

# Get fraudulent only
curl "http://localhost:8000/api/transactions?fraud_only=true&page_size=5"

# Risk check (use real data from fraudmesh_dataset.json)
curl -X POST http://localhost:8000/api/risk/check \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "ACC03476",
    "device_id": "DEV0834",
    "payment_instrument_id": "PI1644",
    "ip_address": "174.142.188.197",
    "merchant_id": "MER0005",
    "customer_id": "CUS04022",
    "amount": 5443.48
  }'
```

## Key Features

✅ **Complete Synthetic Data** - 15K transactions with 5 fraud rings  
✅ **SQLite Database** - Auto-initializes and seeds on first run  
✅ **Deterministic Risk Engine** - No LLM, 9 explainable signals  
✅ **RESTful API** - Health, transactions, risk check endpoints  
✅ **Reproducible Results** - Fixed seed for deterministic generation  
✅ **Pagination & Filtering** - Efficient transaction queries  
✅ **Explainable Signals** - Clear risk contribution breakdown  
✅ **Proper Relationships** - SQLAlchemy ORM with foreign keys  
✅ **Validation Tests** - Comprehensive fraud pattern detection  

## Next Steps (For Later Implementation)

1. **AI Agent Layer** - LLM-powered fraud investigation assistant
2. **Frontend Dashboard** - Real-time visualization and alerts
3. **Real-time Webhooks** - Transaction streaming and alerts
4. **Advanced Signals** - Graph analysis, network connections
5. **Machine Learning** - Anomaly detection models
6. **Investigation Workflow** - Case management and resolution

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FraudMesh AI Architecture                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Future) │  API Layer (FastAPI) │  Data Sources   │
│  Dashboard         │  /api/health         │  Synthetic Data │
│  Alerts            │  /api/transactions   │  Real-time Feeds│
│  Investigations    │  /api/risk/check     │  External APIs  │
├─────────────────────────────────────────────────────────────┤
│              Deterministic Fraud Risk Engine                 │
│  • Transaction Velocity      • Abnormal Amount              │
│  • Device Reuse              • Unusual Timing               │
│  • Payment Instrument Reuse  • Suspicious Entities          │
│  • Merchant Hopping          • Cross-Entity Connections     │
│  • Customer Risk Profile                                    │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer (SQLAlchemy)              │
│  • Merchants  • Customers  • Accounts   • Devices          │
│  • Transactions • IPs      • Payment Instruments           │
│  • Fraud Rings • Fraud Signals • Investigations            │
└─────────────────────────────────────────────────────────────┘
```

The foundation is complete and ready for AI agent and frontend implementation.