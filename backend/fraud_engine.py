"""
FraudMesh AI - Deterministic Fraud Risk Engine
Calculates risk scores using explainable signals
"""

from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Transaction, Device, Account, PaymentInstrument, Merchant, IpAddress


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RecommendedAction(str, Enum):
    ALLOW = "ALLOW"
    STEP_UP = "STEP_UP"
    REVIEW = "REVIEW"
    BLOCK = "BLOCK"


class FraudSignal:
    """Represents a fraud detection signal"""

    def __init__(self, signal_type: str, description: str, score_contribution: float, severity: str = "medium"):
        self.signal_type = signal_type
        self.description = description
        self.score_contribution = score_contribution  # Can be negative
        self.severity = severity


def get_transaction_velocity(db: Session, account_id: str, time_window_minutes: int = 60) -> Tuple[int, List[str]]:
    """
    Calculate transaction velocity for an account
    High velocity = multiple transactions in short time window
    """
    cutoff_time = datetime.utcnow() - timedelta(minutes=time_window_minutes)
    count = db.query(Transaction).filter(
        Transaction.account_id == account_id,
        Transaction.timestamp >= cutoff_time
    ).count()

    signals = []
    score = 0

    if count >= 5:
        signals.append(f"Very high velocity: {count} transactions in {time_window_minutes} minutes")
        score += 25
    elif count >= 3:
        signals.append(f"High velocity: {count} transactions in {time_window_minutes} minutes")
        score += 15
    elif count >= 2:
        signals.append(f"Elevated velocity: {count} transactions in {time_window_minutes} minutes")
        score += 8

    return score, signals


def get_device_velocity(db: Session, device_id: str, time_window_minutes: int = 60) -> Tuple[int, List[str]]:
    """
    Calculate transaction velocity for a device
    High velocity across different accounts = card testing or device sharing
    """
    cutoff_time = datetime.utcnow() - timedelta(minutes=time_window_minutes)
    count = db.query(Transaction).filter(
        Transaction.device_id == device_id,
        Transaction.timestamp >= cutoff_time
    ).count()

    distinct_accounts = db.query(
        func.count(func.distinct(Transaction.account_id))
    ).filter(
        Transaction.device_id == device_id,
        Transaction.timestamp >= cutoff_time
    ).scalar() or 0

    signals = []
    score = 0

    if distinct_accounts >= 3:
        signals.append(f"Device testing pattern: used with {distinct_accounts} different accounts")
        score += 30
    elif count >= 4:
        signals.append(f"High device velocity: {count} transactions in {time_window_minutes} minutes")
        score += 20

    return score, signals


def get_payment_instrument_velocity(db: Session, pi_id: str, time_window_minutes: int = 60) -> Tuple[int, List[str]]:
    """
    Calculate transaction velocity for a payment instrument
    High velocity across different merchants = card testing
    """
    cutoff_time = datetime.utcnow() - timedelta(minutes=time_window_minutes)
    count = db.query(Transaction).filter(
        Transaction.payment_instrument_id == pi_id,
        Transaction.timestamp >= cutoff_time
    ).count()

    distinct_merchants = db.query(
        func.count(func.distinct(Transaction.merchant_id))
    ).filter(
        Transaction.payment_instrument_id == pi_id,
        Transaction.timestamp >= cutoff_time
    ).scalar() or 0

    signals = []
    score = 0

    if distinct_merchants >= 4:
        signals.append(f"Card testing pattern: used with {distinct_merchants} different merchants")
        score += 35
    elif count >= 5:
        signals.append(f"High payment instrument velocity: {count} transactions in {time_window_minutes} minutes")
        score += 18

    return score, signals


def get_merchant_hopping(db: Session, account_id: str, time_window_hours: int = 4) -> Tuple[int, List[str]]:
    """
    Detect rapid merchant hopping - indicator of account takeover or fraud
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=time_window_hours)
    transactions = db.query(Transaction).filter(
        Transaction.account_id == account_id,
        Transaction.timestamp >= cutoff_time
    ).order_by(Transaction.timestamp).all()

    if len(transactions) < 2:
        return 0, []

    signals = []
    score = 0
    distinct_merchants = len(set(t.merchant_id for t in transactions))

    if distinct_merchants >= 4:
        signals.append(f"Rapid merchant hopping: {distinct_merchants} merchants in {time_window_hours} hours")
        score += 20

    return score, signals


def get_abnormal_amount(db: Session, account_id: str, transaction_amount: float) -> Tuple[int, List[str]]:
    """
    Compare transaction amount to historical average
    Outlier amounts can indicate account compromise
    """
    # Get historical transactions for this account (exclude current)
    historical = db.query(
        func.avg(Transaction.amount),
        func.max(Transaction.amount),
        func.min(Transaction.amount)
    ).filter(
        Transaction.account_id == account_id,
        Transaction.timestamp >= datetime.utcnow() - timedelta(days=30)
    ).first()

    signals = []
    score = 0

    if historical[0] is None:  # No history
        return 0, []

    avg_amount = historical[0]
    max_amount = historical[1]

    if transaction_amount > max_amount * 2:
        signals.append(f"Extremely high amount: ${transaction_amount:.2f} (2x historical max)")
        score += 20
    elif transaction_amount > avg_amount * 5:
        signals.append(f"Very high amount: ${transaction_amount:.2f} (5x historical average)")
        score += 15
    elif transaction_amount < 1 and avg_amount > 50:
        signals.append(f"Suspiciously low amount: ${transaction_amount:.2f} (card testing indicator)")
        score += 18

    return score, signals


def get_unusual_timing(db: Session, account_id: str, current_timestamp: datetime) -> Tuple[int, List[str]]:
    """
    Detect transactions at unusual times
    Different timezone from historical patterns can indicate account takeover
    """
    # Get historical transaction hours for this account
    historical = db.query(Transaction).filter(
        Transaction.account_id == account_id,
        Transaction.timestamp >= datetime.utcnow() - timedelta(days=30)
    ).all()

    if not historical:
        return 0, []

    historical_hours = [t.timestamp.hour for t in historical if t.timestamp]
    current_hour = current_timestamp.hour

    # Calculate if current hour is unusual
    if not historical_hours:
        return 0, []

    hour_counts = {}
    for h in historical_hours:
        hour_counts[h] = hour_counts.get(h, 0) + 1

    most_common_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    common_hours = [h for h, _ in most_common_hours]

    signals = []
    score = 0

    if current_hour not in common_hours and len(historical_hours) > 10:
        signals.append(f"Unusual transaction time: {current_hour}:00 (outside historical pattern)")
        score += 10

    # Late night transactions
    if current_hour >= 2 and current_hour <= 5:
        signals.append("Late night transaction (2-5 AM)")
        score += 5

    return score, signals


def get_suspicious_entities(db: Session, transaction: Dict[str, Any]) -> Tuple[int, List[str]]:
    """
    Check if transaction involves known suspicious entities
    (devices, IPs, etc. that appear in fraud rings)
    """
    signals = []
    score = 0

    # Check device risk
    if transaction.get("device_id"):
        device = db.query(Device).filter(Device.device_id == transaction["device_id"]).first()
        if device:
            if device.is_rooted:
                signals.append("Rooted/jailbroken device detected")
                score += 15
            if device.is_emulator:
                signals.append("Emulator detected")
                score += 20

    # Check IP address risk
    if transaction.get("ip_address"):
        ip_info = db.query(IpAddress).filter(IpAddress.ip_address == transaction["ip_address"]).first()
        if ip_info:
            if ip_info.is_vpn:
                signals.append("VPN detected")
                score += 10
            if ip_info.is_proxy:
                signals.append("Proxy/anonymizer detected")
                score += 15
            if ip_info.is_datacenter:
                signals.append("Data center IP detected")
                score += 8
            if ip_info.risk_score > 70:
                signals.append(f"High-risk IP (score: {ip_info.risk_score})")
                score += 12

    # Check merchant risk
    if transaction.get("merchant_id"):
        merchant = db.query(Merchant).filter(Merchant.merchant_id == transaction["merchant_id"]).first()
        if merchant and merchant.risk_level == "high":
            signals.append(f"High-risk merchant category: {merchant.category}")
            score += 8

    return score, signals


def get_cross_entity_connections(db: Session, transaction: Dict[str, Any], account: Account) -> Tuple[int, List[str]]:
    """
    Detect if account is connected to suspicious entities via graph analysis
    (e.g., same device/IP as known fraud account)
    """
    signals = []
    score = 0

    # Check if this device has been used for fraudulent transactions
    if transaction.get("device_id"):
        fraud_txns = db.query(Transaction).filter(
            Transaction.device_id == transaction["device_id"],
            Transaction.is_fraudulent == True
        ).count()

        if fraud_txns > 0:
            signals.append(f"Device used in {fraud_txns} fraudulent transactions")
            score += 25

    # Check if this IP has been used for fraudulent transactions
    if transaction.get("ip_address"):
        fraud_txns = db.query(Transaction).filter(
            Transaction.ip_address == transaction["ip_address"],
            Transaction.is_fraudulent == True
        ).count()

        if fraud_txns > 2:
            signals.append(f"IP used in {fraud_txns} fraudulent transactions")
            score += 22

    # Check if payment instrument is reused across many accounts
    if transaction.get("payment_instrument_id"):
        pi = db.query(PaymentInstrument).filter(
            PaymentInstrument.payment_instrument_id == transaction["payment_instrument_id"]
        ).first()

        if pi:
            # Count how many different accounts use this payment instrument
            accounts_using_pi = db.query(
                func.count(func.distinct(Transaction.account_id))
            ).filter(
                Transaction.payment_instrument_id == transaction["payment_instrument_id"]
            ).scalar() or 0

            if accounts_using_pi >= 3:
                signals.append(f"Payment instrument reused across {accounts_using_pi} accounts")
                score += 15

    return score, signals


def get_customer_risk_profile(db: Session, customer_id: str) -> Tuple[int, List[str]]:
    """
    Check customer's historical risk profile
    """
    signals = []
    score = 0

    # Count historical fraudulent transactions
    fraud_count = db.query(Transaction).filter(
        Transaction.customer_id == customer_id,
        Transaction.is_fraudulent == True
    ).count()

    if fraud_count >= 3:
        signals.append(f"High-risk customer: {fraud_count} prior fraudulent transactions")
        score += 20
    elif fraud_count == 2:
        signals.append(f"Elevated risk: {fraud_count} prior fraudulent transactions")
        score += 10
    elif fraud_count == 1:
        signals.append("Customer has 1 prior fraudulent transaction")
        score += 5

    return score, signals


def score_to_risk_level(score: float) -> RiskLevel:
    """Convert numerical score to risk level"""
    if score >= 80:
        return RiskLevel.CRITICAL
    elif score >= 60:
        return RiskLevel.HIGH
    elif score >= 40:
        return RiskLevel.MEDIUM
    else:
        return RiskLevel.LOW


def score_to_recommendation(score: float, risk_level: RiskLevel) -> RecommendedAction:
    """Convert risk score to recommended action"""
    if score >= 85:
        return RecommendedAction.BLOCK
    elif score >= 70:
        return RecommendedAction.REVIEW
    elif score >= 50:
        return RecommendedAction.STEP_UP
    else:
        return RecommendedAction.ALLOW


def calculate_transaction_risk(db: Session, transaction: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate fraud risk score for a transaction

    Args:
        db: SQLAlchemy session
        transaction: Transaction data dict with keys:
            - transaction_id
            - account_id
            - device_id
            - payment_instrument_id
            - ip_address
            - merchant_id
            - customer_id
            - amount
            - timestamp (datetime or ISO string)

    Returns:
        {
            "risk_score": 0-100,
            "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
            "signals": [
                {
                    "signal_type": str,
                    "description": str,
                    "score_contribution": float
                },
                ...
            ],
            "recommended_action": "ALLOW|STEP_UP|REVIEW|BLOCK"
        }
    """
    score = 0
    signal_list = []

    # Parse timestamp if needed
    if isinstance(transaction.get("timestamp"), str):
        transaction_time = datetime.fromisoformat(transaction["timestamp"].replace("Z", "+00:00"))
    else:
        transaction_time = transaction.get("timestamp", datetime.utcnow())

    # Get account for context
    account = db.query(Account).filter(
        Account.account_id == transaction.get("account_id")
    ).first()

    if not account:
        return {
            "risk_score": 0,
            "risk_level": RiskLevel.LOW.value,
            "signals": [{"signal_type": "account_not_found", "description": "Account not found", "score_contribution": 0}],
            "recommended_action": RecommendedAction.ALLOW.value,
        }

    # Signal 1: Transaction Velocity
    velocity_score, velocity_signals = get_transaction_velocity(db, transaction.get("account_id"), 60)
    score += velocity_score
    for sig in velocity_signals:
        signal_list.append({
            "signal_type": "transaction_velocity",
            "description": sig,
            "score_contribution": velocity_score / len(velocity_signals) if velocity_signals else 0,
        })

    # Signal 2: Device Velocity
    if transaction.get("device_id"):
        device_score, device_signals = get_device_velocity(db, transaction.get("device_id"), 60)
        score += device_score
        for sig in device_signals:
            signal_list.append({
                "signal_type": "device_velocity",
                "description": sig,
                "score_contribution": device_score / len(device_signals) if device_signals else 0,
            })

    # Signal 3: Payment Instrument Velocity
    if transaction.get("payment_instrument_id"):
        pi_score, pi_signals = get_payment_instrument_velocity(db, transaction.get("payment_instrument_id"), 60)
        score += pi_score
        for sig in pi_signals:
            signal_list.append({
                "signal_type": "payment_instrument_velocity",
                "description": sig,
                "score_contribution": pi_score / len(pi_signals) if pi_signals else 0,
            })

    # Signal 4: Merchant Hopping
    hopping_score, hopping_signals = get_merchant_hopping(db, transaction.get("account_id"), 4)
    score += hopping_score
    for sig in hopping_signals:
        signal_list.append({
            "signal_type": "merchant_hopping",
            "description": sig,
            "score_contribution": hopping_score / len(hopping_signals) if hopping_signals else 0,
        })

    # Signal 5: Abnormal Amount
    amount_score, amount_signals = get_abnormal_amount(db, transaction.get("account_id"), transaction.get("amount", 0))
    score += amount_score
    for sig in amount_signals:
        signal_list.append({
            "signal_type": "abnormal_amount",
            "description": sig,
            "score_contribution": amount_score / len(amount_signals) if amount_signals else 0,
        })

    # Signal 6: Unusual Timing
    timing_score, timing_signals = get_unusual_timing(db, transaction.get("account_id"), transaction_time)
    score += timing_score
    for sig in timing_signals:
        signal_list.append({
            "signal_type": "unusual_timing",
            "description": sig,
            "score_contribution": timing_score / len(timing_signals) if timing_signals else 0,
        })

    # Signal 7: Suspicious Entities
    entities_score, entities_signals = get_suspicious_entities(db, transaction)
    score += entities_score
    for sig in entities_signals:
        signal_list.append({
            "signal_type": "suspicious_entities",
            "description": sig,
            "score_contribution": entities_score / len(entities_signals) if entities_signals else 0,
        })

    # Signal 8: Cross-Entity Connections
    connection_score, connection_signals = get_cross_entity_connections(db, transaction, account)
    score += connection_score
    for sig in connection_signals:
        signal_list.append({
            "signal_type": "cross_entity_connections",
            "description": sig,
            "score_contribution": connection_score / len(connection_signals) if connection_signals else 0,
        })

    # Signal 9: Customer Risk Profile
    customer_score, customer_signals = get_customer_risk_profile(db, transaction.get("customer_id"))
    score += customer_score
    for sig in customer_signals:
        signal_list.append({
            "signal_type": "customer_risk_profile",
            "description": sig,
            "score_contribution": customer_score / len(customer_signals) if customer_signals else 0,
        })

    # Cap score at 100
    final_score = min(int(score), 100)
    risk_level = score_to_risk_level(final_score)
    recommendation = score_to_recommendation(final_score, risk_level)

    return {
        "risk_score": final_score,
        "risk_level": risk_level.value,
        "signals": signal_list,
        "recommended_action": recommendation.value,
    }
