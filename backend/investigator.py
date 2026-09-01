"""
FraudMesh AI - Fraud Investigator
Deterministic evidence collection and investigation reports
"""

import os
from typing import Dict, List, Any, Optional, Set
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from models import (
    Transaction, Account, Customer, Device, IpAddress,
    PaymentInstrument, Merchant, Investigation
)
from fraud_engine import calculate_transaction_risk
from signal_exchange import match_transaction_against_signals
from fraud_network import get_fraud_network


class InvestigationEvidence:
    """Represents a piece of evidence in an investigation"""

    def __init__(self, evidence_type: str, severity: str, description: str, details: Dict = None):
        self.evidence_type = evidence_type  # e.g., "VELOCITY", "DEVICE_REUSE", "IP_RISK"
        self.severity = severity  # LOW, MEDIUM, HIGH, CRITICAL
        self.description = description
        self.details = details or {}

    def to_dict(self):
        return {
            "type": self.evidence_type,
            "severity": self.severity,
            "description": self.description,
            "details": self.details,
        }


def collect_transaction_context(db: Session, transaction_id: str) -> Dict[str, Any]:
    """Collect all context about a transaction"""

    txn = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not txn:
        return None

    return {
        "transaction_id": txn.transaction_id,
        "merchant_id": txn.merchant_id,
        "customer_id": txn.customer_id,
        "account_id": txn.account_id,
        "device_id": txn.device_id,
        "ip_address": txn.ip_address,
        "payment_instrument_id": txn.payment_instrument_id,
        "amount": txn.amount,
        "timestamp": txn.timestamp,
        "status": txn.status,
        "is_fraudulent": txn.is_fraudulent,
        "fraud_ring_id": txn.fraud_ring_id,
    }


def find_connected_accounts(db: Session, transaction: Dict) -> Set[str]:
    """Find all accounts connected via device, IP, or payment instrument"""

    connected = set()

    # Add the account from the transaction
    if transaction.get("account_id"):
        connected.add(transaction["account_id"])

    # Find accounts using the same device
    if transaction.get("device_id"):
        device_accounts = db.query(Transaction).filter(
            Transaction.device_id == transaction["device_id"]
        ).distinct(Transaction.account_id).limit(100).all()
        connected.update(t.account_id for t in device_accounts if t.account_id)

    # Find accounts using the same IP
    if transaction.get("ip_address"):
        ip_accounts = db.query(Transaction).filter(
            Transaction.ip_address == transaction["ip_address"]
        ).distinct(Transaction.account_id).limit(100).all()
        connected.update(t.account_id for t in ip_accounts if t.account_id)

    # Find accounts using the same payment instrument
    if transaction.get("payment_instrument_id"):
        pi_accounts = db.query(Transaction).filter(
            Transaction.payment_instrument_id == transaction["payment_instrument_id"]
        ).distinct(Transaction.account_id).limit(100).all()
        connected.update(t.account_id for t in pi_accounts if t.account_id)

    return connected


def find_connected_devices(db: Session, connected_accounts: Set[str]) -> Set[str]:
    """Find all devices used by connected accounts"""

    connected = set()

    # Add device from initial transaction
    txns = db.query(Transaction).filter(
        Transaction.account_id.in_(list(connected_accounts))
    ).all()

    connected.update(t.device_id for t in txns if t.device_id)

    return connected


def find_connected_ips(db: Session, connected_accounts: Set[str]) -> Set[str]:
    """Find all IPs used by connected accounts"""

    ips = set()

    txns = db.query(Transaction).filter(
        Transaction.account_id.in_(list(connected_accounts))
    ).all()

    ips.update(t.ip_address for t in txns if t.ip_address)

    return ips


def find_connected_merchants(db: Session, connected_accounts: Set[str]) -> Set[str]:
    """Find all merchants transacted with by connected accounts"""

    merchants = set()

    txns = db.query(Transaction).filter(
        Transaction.account_id.in_(list(connected_accounts))
    ).all()

    merchants.update(t.merchant_id for t in txns if t.merchant_id)

    return merchants


def find_related_transactions(
    db: Session,
    connected_accounts: Set[str],
    connected_devices: Set[str],
    connected_ips: Set[str],
    limit: int = 50
) -> List[Dict]:
    """Find related transactions"""

    # Query transactions matching any connected entity
    txns = db.query(Transaction).filter(
        (Transaction.account_id.in_(list(connected_accounts))) |
        (Transaction.device_id.in_(list(connected_devices))) |
        (Transaction.ip_address.in_(list(connected_ips)))
    ).order_by(Transaction.timestamp.desc()).limit(limit).all()

    return [
        {
            "transaction_id": t.transaction_id,
            "account_id": t.account_id,
            "device_id": t.device_id,
            "ip_address": t.ip_address,
            "merchant_id": t.merchant_id,
            "amount": t.amount,
            "status": t.status,
            "is_fraudulent": t.is_fraudulent,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
        }
        for t in txns
    ]


def collect_evidence(
    db: Session,
    transaction: Dict,
    connected_accounts: Set[str],
    connected_devices: Set[str],
    connected_ips: Set[str],
    related_transactions: List[Dict],
) -> tuple[List[InvestigationEvidence], int]:
    """Collect all evidence for investigation"""

    evidence_list = []
    risk_score = 0

    # Evidence 1: Transaction Risk Score
    risk_result = calculate_transaction_risk(db, transaction)
    risk_score = risk_result.get("risk_score", 0)

    if risk_score >= 80:
        evidence_list.append(
            InvestigationEvidence(
                "TRANSACTION_RISK",
                "CRITICAL",
                f"Transaction risk score: {risk_score}/100",
                {"risk_score": risk_score, "risk_level": risk_result.get("risk_level")}
            )
        )
    elif risk_score >= 60:
        evidence_list.append(
            InvestigationEvidence(
                "TRANSACTION_RISK",
                "HIGH",
                f"Transaction risk score: {risk_score}/100",
                {"risk_score": risk_score, "risk_level": risk_result.get("risk_level")}
            )
        )

    # Evidence 2: Account Activity
    if len(connected_accounts) >= 3:
        evidence_list.append(
            InvestigationEvidence(
                "MULTI_ACCOUNT_ACTIVITY",
                "HIGH" if len(connected_accounts) >= 5 else "MEDIUM",
                f"Device/IP/PI reused across {len(connected_accounts)} accounts",
                {"account_count": len(connected_accounts)}
            )
        )
        if len(connected_accounts) >= 5:
            risk_score += 15

    # Evidence 3: Device Reuse
    if len(connected_devices) >= 2:
        fraud_count = sum(1 for t in related_transactions if t.get("is_fraudulent"))
        if fraud_count > 0:
            evidence_list.append(
                InvestigationEvidence(
                    "DEVICE_FRAUD_HISTORY",
                    "CRITICAL" if fraud_count >= 3 else "HIGH",
                    f"Device(s) used in {fraud_count} fraudulent transactions",
                    {"fraudulent_transaction_count": fraud_count, "devices": list(connected_devices)[:3]}
                )
            )
            if fraud_count >= 3:
                risk_score += 20
            else:
                risk_score += 10

    # Evidence 4: IP Reputation
    high_risk_ips = []
    for ip in connected_ips:
        ip_obj = db.query(IpAddress).filter(IpAddress.ip_address == ip).first()
        if ip_obj:
            if ip_obj.is_vpn or ip_obj.is_proxy:
                high_risk_ips.append(ip)
            if ip_obj.risk_score >= 70:
                high_risk_ips.append(ip)

    if high_risk_ips:
        evidence_list.append(
            InvestigationEvidence(
                "HIGH_RISK_IP",
                "HIGH",
                f"{len(high_risk_ips)} high-risk IPs (VPN/proxy/datacenter)",
                {"high_risk_ips": high_risk_ips[:3]}
            )
        )
        risk_score += 12

    # Evidence 5: Transaction Velocity
    recent_count = len(related_transactions)
    if recent_count >= 5:
        evidence_list.append(
            InvestigationEvidence(
                "HIGH_VELOCITY",
                "HIGH" if recent_count >= 10 else "MEDIUM",
                f"{recent_count} related transactions in recent history",
                {"transaction_count": recent_count}
            )
        )
        if recent_count >= 10:
            risk_score += 15
        else:
            risk_score += 8

    # Evidence 6: Merchant Hopping
    merchants = set(t.get("merchant_id") for t in related_transactions if t.get("merchant_id"))
    if len(merchants) >= 4:
        evidence_list.append(
            InvestigationEvidence(
                "MERCHANT_HOPPING",
                "HIGH",
                f"Rapid merchant hopping: {len(merchants)} different merchants",
                {"merchant_count": len(merchants)}
            )
        )
        risk_score += 10

    # Evidence 7: Abnormal Amount
    if transaction.get("amount", 0) > 1000:
        avg_amount = sum(t.get("amount", 0) for t in related_transactions) / max(1, len(related_transactions))
        if transaction["amount"] > avg_amount * 5:
            evidence_list.append(
                InvestigationEvidence(
                    "ABNORMAL_AMOUNT",
                    "HIGH",
                    f"Transaction amount ${transaction['amount']:.2f} is 5x+ historical average",
                    {"amount": transaction["amount"], "average": avg_amount}
                )
            )
            risk_score += 10

    # Evidence 8: Fraud Ring Connection
    if transaction.get("fraud_ring_id"):
        evidence_list.append(
            InvestigationEvidence(
                "FRAUD_RING_MEMBER",
                "CRITICAL",
                f"Transaction belongs to known fraud ring: {transaction['fraud_ring_id']}",
                {"fraud_ring_id": transaction["fraud_ring_id"]}
            )
        )
        risk_score += 25

    # Evidence 9: Signal Matching
    signal_match = match_transaction_against_signals(db, transaction)
    if signal_match.get("best_match"):
        best = signal_match["best_match"]
        evidence_list.append(
            InvestigationEvidence(
                "SIGNAL_MATCH",
                best.get("severity", "MEDIUM"),
                f"Matches published fraud signal {best.get('signal_id')}: {best.get('match_score'):.0f}% confidence",
                {
                    "signal_id": best.get("signal_id"),
                    "match_score": best.get("match_score"),
                    "pattern_type": best.get("pattern_type")
                }
            )
        )
        if best.get("match_score", 0) >= 70:
            risk_score += 12

    # Cap risk score at 100
    risk_score = min(100, int(risk_score))

    return evidence_list, risk_score


def generate_recommendation(risk_score: int, evidence_count: int) -> str:
    """Generate recommendation based on risk score and evidence"""

    if risk_score >= 85 or (risk_score >= 70 and evidence_count >= 4):
        return "BLOCK"
    elif risk_score >= 70 or evidence_count >= 4:
        return "REVIEW"
    elif risk_score >= 50 or evidence_count >= 3:
        return "STEP_UP"
    else:
        return "ALLOW"


def get_llm_summary(evidence_list: List[InvestigationEvidence], transaction: Dict) -> Optional[str]:
    """Use OpenAI API to generate a concise summary if available"""

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        import openai
        client = openai.OpenAI(api_key=api_key)

        # Prepare evidence text
        evidence_text = "\n".join([
            f"- {e.evidence_type}: {e.description}"
            for e in evidence_list
        ])

        prompt = f"""Based on ONLY this collected evidence (do not invent):

Evidence:
{evidence_text}

Transaction Details:
- Amount: ${transaction.get('amount', 0):.2f}
- Status: {transaction.get('status', 'unknown')}

Write a concise 2-3 sentence explanation of why this transaction is suspicious.
Focus only on the evidence listed above. Do not add any new information."""

        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a fraud analyst. Summarize evidence concisely."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.3,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Warning: LLM summary failed: {e}")
        return None


def generate_deterministic_summary(evidence_list: List[InvestigationEvidence]) -> str:
    """Generate a deterministic summary without LLM"""

    if not evidence_list:
        return "No significant fraud indicators detected."

    critical_evidence = [e for e in evidence_list if e.severity == "CRITICAL"]
    high_evidence = [e for e in evidence_list if e.severity == "HIGH"]

    summary_parts = []

    if critical_evidence:
        summary_parts.append(f"{len(critical_evidence)} critical indicator(s) detected:")
        for e in critical_evidence[:2]:
            summary_parts.append(f"  • {e.description}")

    if high_evidence and len(summary_parts) < 3:
        summary_parts.append(f"{len(high_evidence)} high-risk indicator(s) present.")

    if not summary_parts:
        summary_parts.append(f"{len(evidence_list)} fraud indicator(s) detected.")

    return " ".join(summary_parts)


def investigate_transaction(db: Session, transaction_id: str) -> Dict[str, Any]:
    """
    Main investigation function
    Performs deterministic evidence collection and analysis
    """

    # Step 1: Retrieve transaction
    transaction = collect_transaction_context(db, transaction_id)
    if not transaction:
        return {
            "error": "Transaction not found",
            "transaction_id": transaction_id
        }

    # Step 2: Find connected entities
    connected_accounts = find_connected_accounts(db, transaction)
    connected_devices = find_connected_devices(db, connected_accounts)
    connected_ips = find_connected_ips(db, connected_accounts)
    connected_merchants = find_connected_merchants(db, connected_accounts)

    # Step 3: Find related transactions
    related_transactions = find_related_transactions(
        db,
        connected_accounts,
        connected_devices,
        connected_ips,
        limit=50
    )

    # Step 4: Collect evidence
    evidence_list, risk_score = collect_evidence(
        db,
        transaction,
        connected_accounts,
        connected_devices,
        connected_ips,
        related_transactions,
    )

    # Step 5: Generate recommendation
    recommendation = generate_recommendation(risk_score, len(evidence_list))

    # Step 6: Generate summary (LLM if available, fallback to deterministic)
    summary = get_llm_summary(evidence_list, transaction)
    if not summary:
        summary = generate_deterministic_summary(evidence_list)

    # Step 7: Create investigation record
    investigation_id = f"INV-{transaction_id}"
    investigation = Investigation(
        investigation_id=investigation_id,
        transaction_id=transaction_id,
        status="open",
        priority="high" if risk_score >= 70 else "medium" if risk_score >= 50 else "low",
        notes=json.dumps({
            "connected_accounts": list(connected_accounts),
            "connected_devices": list(connected_devices),
            "connected_ips": list(connected_ips),
            "evidence_count": len(evidence_list),
            "risk_score": risk_score,
        }),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(investigation)
    db.commit()

    # Step 8: Return investigation report
    return {
        "transaction_id": transaction_id,
        "investigation_id": investigation_id,
        "risk_score": risk_score,
        "connected_accounts": len(connected_accounts),
        "connected_devices": len(connected_devices),
        "affected_merchants": len(connected_merchants),
        "related_transactions": len(related_transactions),
        "evidence_count": len(evidence_list),
        "evidence": [e.to_dict() for e in evidence_list],
        "recommendation": recommendation,
        "summary": summary,
        "created_at": datetime.utcnow().isoformat(),
    }
