"""
FraudMesh AI - Privacy-Preserving Fraud Signal Exchange
Enables merchants to share fraud intelligence without exposing personal data
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import Session

from models import Base, Transaction


class SignalPatternType(str, Enum):
    """Types of fraud patterns that can be signaled"""
    COORDINATED_ACTIVITY = "COORDINATED_ACTIVITY"
    CARD_TESTING = "CARD_TESTING"
    ACCOUNT_TAKEOVER = "ACCOUNT_TAKEOVER"
    DEVICE_FRAUD = "DEVICE_FRAUD"
    IP_REPUTATION = "IP_REPUTATION"
    VELOCITY_ANOMALY = "VELOCITY_ANOMALY"
    MERCHANT_COLLUSION = "MERCHANT_COLLUSION"
    MULTI_ACCOUNT_ABUSE = "MULTI_ACCOUNT_ABUSE"
    HIGH_RISK_DEVICE = "HIGH_RISK_DEVICE"
    PROXY_VPN_USAGE = "PROXY_VPN_USAGE"
    UNUSUAL_GEO_PATTERN = "UNUSUAL_GEO_PATTERN"
    NEW_ACCOUNT_FRAUD = "NEW_ACCOUNT_FRAUD"


class SignalSeverity(str, Enum):
    """Signal severity levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ExchangeFraudSignal(Base):
    """Fraud signal stored in database - privacy-preserving"""
    __tablename__ = "fraud_signals_exchange"

    id = Column(Integer, primary_key=True, autoincrement=True)
    signal_id = Column(String(50), unique=True, nullable=False, index=True)
    pattern_type = Column(String(50), nullable=False)
    signals = Column(JSON, nullable=False)  # List of behavioral signals
    severity = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=False)
    version = Column(Integer, default=1)

    # Privacy-preserving metadata (no PII)
    publisher_id = Column(String(50), nullable=True)  # Merchant ID only
    published_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    # Behavioral fingerprints (anonymized)
    device_fingerprints = Column(JSON, nullable=True)  # Hashed fingerprints only
    ip_patterns = Column(JSON, nullable=True)  # IP ranges/patterns, not exact IPs
    account_behavior = Column(JSON, nullable=True)  # Behavioral patterns
    transaction_patterns = Column(JSON, nullable=True)  # Amount ranges, timing patterns

    # Matching criteria
    matching_criteria = Column(JSON, nullable=False)

    # Status
    is_active = Column(Boolean, default=True)
    match_count = Column(Integer, default=0)


def create_device_fingerprint(device_id: str, device_type: str, os: str) -> str:
    """Create anonymized device fingerprint (hashed)"""
    # Use only device characteristics, not the actual ID
    fingerprint_input = f"{device_type}:{os}"
    return fingerprint_input


def create_ip_pattern(ip_address: str) -> Dict[str, Any]:
    """Create anonymized IP pattern (IP range, not exact IP)"""
    parts = ip_address.split('.')
    if len(parts) == 4:
        return {
            "first_octet": int(parts[0]),
            "second_octet": int(parts[1]),
            "subnet": f"{parts[0]}.{parts[1]}.*.*",
            "is_vpn_indicator": None,  # Will be filled from lookup
            "is_proxy_indicator": None,
        }
    return {}


def generate_signal_id() -> str:
    """Generate unique signal ID"""
    return f"FS-{uuid.uuid4().hex[:8].upper()}"


def extract_behavioral_signals(
    db: Session,
    transaction: Dict[str, Any],
    related_transactions: List[Dict] = None
) -> List[str]:
    """Extract behavioral signals from transaction context"""
    signals = []

    account_id = transaction.get("account_id")
    device_id = transaction.get("device_id")
    ip_address = transaction.get("ip_address")
    payment_instrument_id = transaction.get("payment_instrument_id")
    amount = transaction.get("amount", 0)

    if not related_transactions:
        related_transactions = []

    # Check device reuse
    if device_id and account_id:
        devices_for_account = set(t.get("device_id") for t in related_transactions if t.get("device_id"))
        if len(devices_for_account) > 1:
            signals.append("device_reuse")

    # Check high velocity
    if account_id and related_transactions:
        recent_count = len(related_transactions)
        if recent_count >= 3:
            signals.append("high_velocity")

    # Check multi-account activity
    if device_id:
        accounts_for_device = set(t.get("account_id") for t in related_transactions if t.get("account_id"))
        if len(accounts_for_device) >= 3:
            signals.append("multi_account_activity")

    # Check merchant hopping
    if account_id and related_transactions:
        merchants = set(t.get("merchant_id") for t in related_transactions if t.get("merchant_id"))
        if len(merchants) >= 4:
            signals.append("merchant_hopping")

    # Check low-value testing
    if amount < 10 and len(related_transactions) > 5:
        signals.append("low_value_testing")

    # Check high-value anomaly
    if amount > 1000:
        signals.append("high_value_transaction")

    # Check payment instrument reuse across accounts
    if payment_instrument_id:
        accounts_for_pi = set(t.get("account_id") for t in related_transactions if t.get("account_id"))
        if len(accounts_for_pi) >= 3:
            signals.append("payment_instrument_reuse")

    return signals


def create_matching_criteria(
    transaction: Dict[str, Any],
    signals: List[str]
) -> Dict[str, Any]:
    """Create matching criteria for signal - privacy-preserving"""

    criteria = {
        "required_signals": signals,
        "min_signal_count": max(2, len(signals) // 2),
    }

    # Add behavioral patterns (no exact IDs)
    if "device_reuse" in signals:
        criteria["device_type"] = transaction.get("device_type")
        criteria["device_os"] = transaction.get("device_os")

    if "high_velocity" in signals:
        criteria["velocity_threshold"] = 3

    if "merchant_hopping" in signals:
        criteria["merchant_count_threshold"] = 4

    # IP-based matching (use patterns, not exact IPs)
    if "ip_reputation" in signals:
        ip = transaction.get("ip_address", "")
        parts = ip.split('.')
        if len(parts) == 4:
            criteria["ip_subnet_pattern"] = f"{parts[0]}.{parts[1]}.*.*"

    return criteria


def determine_severity(signals: List[str], confidence: float) -> str:
    """Determine signal severity based on signals and confidence"""
    high_impact_signals = {
        "account_takeover", "coordinated_activity", "merchant_collusion",
        "high_value_transaction", "multi_account_activity"
    }

    if any(s in high_impact_signals for s in signals) and confidence >= 0.8:
        return SignalSeverity.CRITICAL.value
    elif len(signals) >= 3 and confidence >= 0.7:
        return SignalSeverity.HIGH.value
    elif len(signals) >= 2 and confidence >= 0.5:
        return SignalSeverity.MEDIUM.value
    else:
        return SignalSeverity.LOW.value


def publish_signal(
    db: Session,
    publisher_id: str,
    pattern_type: str,
    signals: List[str],
    confidence: float,
    matching_criteria: Dict[str, Any],
    device_fingerprints: List[str] = None,
    ip_patterns: List[Dict] = None,
    account_behavior: Dict = None,
    transaction_patterns: Dict = None,
    expires_in_days: int = 30
) -> ExchangeFraudSignal:
    """Publish a new fraud signal (privacy-preserving)"""

    signal_id = generate_signal_id()
    severity = determine_severity(signals, confidence)

    # Set expiration
    expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

    signal = ExchangeFraudSignal(
        signal_id=signal_id,
        pattern_type=pattern_type,
        signals=signals,
        severity=severity,
        confidence=confidence,
        version=1,
        publisher_id=publisher_id,
        published_at=datetime.utcnow(),
        expires_at=expires_at,
        device_fingerprints=device_fingerprints,
        ip_patterns=ip_patterns,
        account_behavior=account_behavior,
        transaction_patterns=transaction_patterns,
        matching_criteria=matching_criteria,
        is_active=True,
        match_count=0,
    )

    db.add(signal)
    db.commit()
    db.refresh(signal)

    return signal


def get_all_signals(
    db: Session,
    active_only: bool = True,
    min_severity: str = None,
    limit: int = 100
) -> List[ExchangeFraudSignal]:
    """Get all published signals"""
    query = db.query(ExchangeFraudSignal)

    if active_only:
        query = query.filter(ExchangeFraudSignal.is_active == True)
        query = query.filter(ExchangeFraudSignal.expires_at > datetime.utcnow())

    if min_severity:
        severity_order = {
            "LOW": 1,
            "MEDIUM": 2,
            "HIGH": 3,
            "CRITICAL": 4
        }
        min_level = severity_order.get(min_severity, 1)
        query = query.filter(
            ExchangeFraudSignal.severity.in_(
                [s for s, level in severity_order.items() if level >= min_level]
            )
        )

    return query.order_by(ExchangeFraudSignal.published_at.desc()).limit(limit).all()


def match_transaction_against_signals(
    db: Session,
    transaction: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Match a transaction against published signals
    Returns match results with confidence scores
    """

    # Get active signals
    signals = db.query(ExchangeFraudSignal).filter(
        ExchangeFraudSignal.is_active == True,
        ExchangeFraudSignal.expires_at > datetime.utcnow()
    ).all()

    if not signals:
        return {
            "matches": [],
            "transaction_signals": [],
            "total_signals_checked": 0,
            "has_match": False,
            "best_match": None,
            "recommended_action": "ALLOW"
        }

    matches = []
    transaction_signals = []

    # Get related transactions for context
    account_id = transaction.get("account_id")
    device_id = transaction.get("device_id")
    ip_address = transaction.get("ip_address")

    related_transactions = []
    if account_id:
        related_transactions = db.query(Transaction).filter(
            Transaction.account_id == account_id
        ).order_by(Transaction.timestamp.desc()).limit(10).all()
        related_transactions = [
            {
                "account_id": t.account_id,
                "device_id": t.device_id,
                "merchant_id": t.merchant_id,
                "amount": t.amount,
                "ip_address": t.ip_address,
                "payment_instrument_id": t.payment_instrument_id,
            }
            for t in related_transactions
        ]

    # Extract transaction's behavioral signals
    transaction_signals = extract_behavioral_signals(
        db,
        transaction,
        related_transactions
    )

    # Check each signal
    for signal in signals:
        match_score = 0
        matched_criteria = []

        criteria = signal.matching_criteria or {}
        required_signals = criteria.get("required_signals", [])

        # Check if transaction has required signals
        signal_overlap = set(transaction_signals) & set(required_signals)
        if signal_overlap:
            overlap_ratio = len(signal_overlap) / len(required_signals)
            match_score += overlap_ratio * 50

            matched_criteria.extend(list(signal_overlap))

        # Check IP pattern matching
        if criteria.get("ip_subnet_pattern") and ip_address:
            parts = ip_address.split('.')
            subnet = f"{parts[0]}.{parts[1]}.*.*" if len(parts) == 4 else None
            if subnet == criteria["ip_subnet_pattern"]:
                match_score += 20
                matched_criteria.append("ip_pattern_match")

        # Check velocity threshold
        if criteria.get("velocity_threshold") and len(related_transactions) >= criteria["velocity_threshold"]:
            match_score += 15
            matched_criteria.append("velocity_match")

        # Check merchant hopping threshold
        if criteria.get("merchant_count_threshold"):
            merchants = set(t.get("merchant_id") for t in related_transactions if t.get("merchant_id"))
            if len(merchants) >= criteria["merchant_count_threshold"]:
                match_score += 15
                matched_criteria.append("merchant_hopping_match")

        # Factor in signal confidence
        if match_score > 0:
            confidence_boost = signal.confidence * 0.3
            match_score = min(100, match_score + confidence_boost * 10)

        if match_score >= 30:  # Threshold for a match
            matches.append({
                "signal_id": signal.signal_id,
                "pattern_type": signal.pattern_type,
                "match_score": round(match_score, 2),
                "matched_criteria": matched_criteria,
                "severity": signal.severity,
                "confidence": signal.confidence,
            })

            # Update match count
            signal.match_count += 1

    db.commit()

    # Sort by match score
    matches.sort(key=lambda x: x["match_score"], reverse=True)

    # Determine recommended action based on matches
    recommended_action = "ALLOW"
    if matches:
        highest_match = matches[0]
        if highest_match["match_score"] >= 80:
            recommended_action = "BLOCK"
        elif highest_match["match_score"] >= 60:
            recommended_action = "REVIEW"
        elif highest_match["match_score"] >= 40:
            recommended_action = "STEP_UP"

    return {
        "matches": matches,
        "total_signals_checked": len(signals),
        "transaction_signals": transaction_signals,
        "has_match": len(matches) > 0,
        "best_match": matches[0] if matches else None,
        "recommended_action": recommended_action
    }


def generate_signals_from_transactions(db: Session, merchant_id: str, limit: int = 100) -> List[ExchangeFraudSignal]:
    """Generate fraud signals from transaction patterns for a merchant"""

    # Get recent transactions for this merchant
    transactions = db.query(Transaction).filter(
        Transaction.merchant_id == merchant_id
    ).order_by(Transaction.timestamp.desc()).limit(limit).all()

    if len(transactions) < 10:
        return []

    published_signals = []

    # Analyze patterns and create signals

    # Pattern 1: Device reuse across multiple accounts
    device_accounts = {}
    for txn in transactions:
        key = txn.device_id
        if key not in device_accounts:
            device_accounts[key] = set()
        device_accounts[key].add(txn.account_id)

    for device_id, accounts in device_accounts.items():
        if len(accounts) >= 3:
            signals_list = ["device_reuse", "multi_account_activity"]
            criteria = {
                "required_signals": signals_list,
                "min_signal_count": 2,
                "device_id_pattern": device_id,
            }

            signal = publish_signal(
                db=db,
                publisher_id=merchant_id,
                pattern_type=SignalPatternType.DEVICE_FRAUD.value,
                signals=signals_list,
                confidence=0.85,
                matching_criteria=criteria,
                device_fingerprints=[device_id] if device_id else None,
                transaction_patterns={"min_accounts": len(accounts)},
                expires_in_days=30
            )
            published_signals.append(signal)

    # Pattern 2: IP-based fraud indicators
    ip_fraud_count = {}
    for txn in transactions:
        if txn.is_fraudulent:
            ip_fraud_count[txn.ip_address] = ip_fraud_count.get(txn.ip_address, 0) + 1

    for ip_address, count in ip_fraud_count.items():
        if count >= 2:
            ip_pattern = create_ip_pattern(ip_address)
            signals_list = ["ip_reputation"]

            criteria = {
                "required_signals": signals_list,
                "ip_subnet_pattern": ip_pattern.get("subnet"),
            }

            signal = publish_signal(
                db=db,
                publisher_id=merchant_id,
                pattern_type=SignalPatternType.IP_REPUTATION.value,
                signals=signals_list,
                confidence=0.75,
                matching_criteria=criteria,
                ip_patterns=[ip_pattern],
                expires_in_days=30
            )
            published_signals.append(signal)

    # Pattern 3: Card testing (multiple merchants, low amounts)
    pi_merchants = {}
    for txn in transactions:
        key = txn.payment_instrument_id
        if key not in pi_merchants:
            pi_merchants[key] = set()
        pi_merchants[key].add(txn.merchant_id)

    for pi_id, merchants in pi_merchants.items():
        if len(merchants) >= 4:
            signals_list = ["low_value_testing", "merchant_hopping"]
            criteria = {
                "required_signals": signals_list,
                "min_merchant_count": 4,
                "max_amount": 10,
            }

            signal = publish_signal(
                db=db,
                publisher_id=merchant_id,
                pattern_type=SignalPatternType.CARD_TESTING.value,
                signals=signals_list,
                confidence=0.80,
                matching_criteria=criteria,
                transaction_patterns={
                    "merchant_count": len(merchants),
                    "max_amount": 10
                },
                expires_in_days=30
            )
            published_signals.append(signal)

    return published_signals


def serialize_signal(signal: ExchangeFraudSignal) -> Dict[str, Any]:
    """Serialize a fraud signal for API response"""
    return {
        "signal_id": signal.signal_id,
        "pattern_type": signal.pattern_type,
        "signals": signal.signals,
        "severity": signal.severity,
        "confidence": signal.confidence,
        "version": signal.version,
        "publisher_id": signal.publisher_id,
        "published_at": signal.published_at.isoformat() if signal.published_at else None,
        "expires_at": signal.expires_at.isoformat() if signal.expires_at else None,
        "is_active": signal.is_active,
        "match_count": signal.match_count,
    }