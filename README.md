# 🛡️ FraudMesh AI — AI Fraud Signal Exchange Platform

> **Razorpay AI Risk Manager Track MVP**  
> An AI-powered, privacy-preserving fraud signal exchange platform enabling merchants to share fraud intelligence without exposing customer PII.

---

## 🏗️ Architecture & Component Overview

FraudMesh AI consists of two core layers:

1. **Backend API (`/backend`):** FastAPI + SQLAlchemy + SQLite engine with 9 explainable fraud detection signals, graph-based cluster detection, privacy-preserving signal exchange, and AI investigation reporting.
2. **Frontend Dashboard (`/fraudmesh-ui`):** React + Vite + Tailwind CSS dashboard with metrics, live risk check with decision spectrum visualization, published signal monitoring, and end-to-end fraud attack simulation.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FraudMesh AI Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 Frontend (React + Vite + Tailwind CSS)                       │
│  Location: /fraudmesh-ui                                        │
│  ├─ Dashboard          → High-level metrics & alert summary     │
│  ├─ Risk Check         → Live transaction risk scoring          │
│  ├─ Fraud Signals      → Shared cross-merchant signal pool      │
│  └─ Attack Simulator   → End-to-end hackathon demo simulation   │
│                                                                 │
│  ⚡ Backend API (FastAPI REST Server)                            │
│  Location: /backend                                             │
│  ├─ POST /api/risk/check       → Real-time 9-signal scoring     │
│  ├─ GET  /api/network          → Graph cluster analysis         │
│  ├─ POST /api/signals/publish  → Anonymized signal publishing   │
│  ├─ POST /api/signals/match    → Network signal matching        │
│  ├─ POST /api/investigate/{id} → Automated forensic reports     │
│  └─ POST /api/demo/run         → Interactive demo flow          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Decision & Action Spectrum

FraudMesh AI calculates a **0–100 Risk Score** mapped to 4 actionable gateway outcomes:

```
  0                           50             70             85               100
  ├────────────────────────────┼──────────────┼──────────────┼────────────────┤
  │          ALLOW             │   STEP_UP    │   REVIEW     │     BLOCK      │
  │     (Process Payment)      │ (Trigger OTP)│(Manual Queue)│  (Auto Decline)│
```

- **ALLOW (`< 50`)**: Direct payment approval.
- **STEP_UP (`50 - 69`)**: Trigger 3D-Secure / OTP verification.
- **REVIEW (`70 - 84`)**: Route to manual risk analyst queue.
- **BLOCK (`85+`)**: Auto-decline transaction prior to bank auth.

---

## 🚀 Quick Start Guide

### 1. Run Data Validation (Node.js)
```bash
cd backend
node validate_engine.js
node validate_network.js
```

### 2. Start Backend API Server
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```
*API interactive documentation available at `http://localhost:8000/docs`.*

### 3. Start Frontend Dashboard
```bash
cd fraudmesh-ui
npm install
npm run dev
```
*Dashboard available at `http://localhost:5173`.*

---

## 📜 License
MIT License. Built for Razorpay AI Risk Manager Track.
