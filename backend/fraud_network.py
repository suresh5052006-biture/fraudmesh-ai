"""
FraudMesh AI - Fraud Relationship Network
Graph-based fraud cluster detection using deterministic analysis
"""

from typing import Dict, List, Any, Set, Tuple
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import (
    Transaction, Customer, Account, Device, IpAddress,
    PaymentInstrument, Merchant
)


class NodeType:
    CUSTOMER = "customer"
    ACCOUNT = "account"
    DEVICE = "device"
    IP = "ip"
    PAYMENT_INSTRUMENT = "payment_instrument"
    MERCHANT = "merchant"
    TRANSACTION = "transaction"


class RelationshipType:
    OWNS = "owns"
    USES_DEVICE = "uses_device"
    FROM_IP = "from_ip"
    PAYS_WITH = "pays_with"
    MERCHANT_TXN = "merchant_txn"
    ACCOUNT_TXN = "account_txn"
    SAME_DEVICE = "same_device"
    SAME_IP = "same_ip"


def calculate_entity_risk(db: Session, entity_type: str, entity_id: str) -> int:
    """Calculate risk score for an entity based on its transaction history"""

    if entity_type == NodeType.CUSTOMER:
        customer = db.query(Customer).filter(Customer.customer_id == entity_id).first()
        if customer:
            return customer.risk_score or 0
        return 0

    elif entity_type == NodeType.ACCOUNT:
        fraud_count = db.query(Transaction).filter(
            Transaction.account_id == entity_id,
            Transaction.is_fraudulent == True
        ).count()
        total_count = db.query(Transaction).filter(
            Transaction.account_id == entity_id
        ).count()
        if total_count == 0:
            return 0
        return min(100, int((fraud_count / total_count) * 100) + fraud_count * 10)

    elif entity_type == NodeType.DEVICE:
        device = db.query(Device).filter(Device.device_id == entity_id).first()
        risk = 0
        if device:
            if device.is_rooted:
                risk += 30
            if device.is_emulator:
                risk += 40
        fraud_count = db.query(Transaction).filter(
            Transaction.device_id == entity_id,
            Transaction.is_fraudulent == True
        ).count()
        risk += min(50, fraud_count * 5)
        return min(100, risk)

    elif entity_type == NodeType.IP:
        ip = db.query(IpAddress).filter(IpAddress.ip_address == entity_id).first()
        risk = 0
        if ip:
            risk = ip.risk_score or 0
            if ip.is_vpn:
                risk += 15
            if ip.is_proxy:
                risk += 20
            if ip.is_datacenter:
                risk += 10
        fraud_count = db.query(Transaction).filter(
            Transaction.ip_address == entity_id,
            Transaction.is_fraudulent == True
        ).count()
        risk += min(30, fraud_count * 3)
        return min(100, risk)

    elif entity_type == NodeType.PAYMENT_INSTRUMENT:
        fraud_count = db.query(Transaction).filter(
            Transaction.payment_instrument_id == entity_id,
            Transaction.is_fraudulent == True
        ).count()
        pi = db.query(PaymentInstrument).filter(
            PaymentInstrument.payment_instrument_id == entity_id
        ).first()
        risk = fraud_count * 15
        if pi:
            if pi.is_virtual:
                risk += 10
            if pi.is_prepaid:
                risk += 5
            if pi.is_issuing_country_high_risk:
                risk += 15
        return min(100, risk)

    elif entity_type == NodeType.MERCHANT:
        merchant = db.query(Merchant).filter(Merchant.merchant_id == entity_id).first()
        if merchant:
            if merchant.risk_level == "high":
                return 70
            elif merchant.risk_level == "medium":
                return 40
        return 10

    elif entity_type == NodeType.TRANSACTION:
        txn = db.query(Transaction).filter(Transaction.transaction_id == entity_id).first()
        if txn and txn.is_fraudulent:
            return 100
        return 0

    return 0


def build_graph_from_db(db: Session, limit: int = 5000) -> Tuple[List[Dict], List[Dict]]:
    """
    Build a relationship graph from transaction data
    Returns (nodes, edges)
    """
    nodes = []
    edges = []
    node_ids = set()
    edge_keys = set()

    # Get transactions (limited for performance)
    transactions = db.query(Transaction).order_by(
        Transaction.timestamp.desc()
    ).limit(limit).all()

    for txn in transactions:
        # Add transaction node
        if txn.transaction_id not in node_ids:
            nodes.append({
                "id": txn.transaction_id,
                "type": NodeType.TRANSACTION,
                "risk": 100 if txn.is_fraudulent else 0,
                "amount": txn.amount,
                "status": txn.status,
            })
            node_ids.add(txn.transaction_id)

        # Add account node and edge
        if txn.account_id and txn.account_id not in node_ids:
            nodes.append({
                "id": txn.account_id,
                "type": NodeType.ACCOUNT,
                "risk": calculate_entity_risk(db, NodeType.ACCOUNT, txn.account_id),
            })
            node_ids.add(txn.account_id)

        if txn.account_id:
            edge_key = f"{txn.transaction_id}-{txn.account_id}-{RelationshipType.ACCOUNT_TXN}"
            if edge_key not in edge_keys:
                edges.append({
                    "source": txn.transaction_id,
                    "target": txn.account_id,
                    "relationship": RelationshipType.ACCOUNT_TXN,
                })
                edge_keys.add(edge_key)

        # Add device node and edge
        if txn.device_id and txn.device_id not in node_ids:
            nodes.append({
                "id": txn.device_id,
                "type": NodeType.DEVICE,
                "risk": calculate_entity_risk(db, NodeType.DEVICE, txn.device_id),
            })
            node_ids.add(txn.device_id)

        if txn.device_id:
            edge_key = f"{txn.transaction_id}-{txn.device_id}-{RelationshipType.USES_DEVICE}"
            if edge_key not in edge_keys:
                edges.append({
                    "source": txn.transaction_id,
                    "target": txn.device_id,
                    "relationship": RelationshipType.USES_DEVICE,
                })
                edge_keys.add(edge_key)

        # Add IP node and edge
        if txn.ip_address and txn.ip_address not in node_ids:
            nodes.append({
                "id": txn.ip_address,
                "type": NodeType.IP,
                "risk": calculate_entity_risk(db, NodeType.IP, txn.ip_address),
            })
            node_ids.add(txn.ip_address)

        if txn.ip_address:
            edge_key = f"{txn.transaction_id}-{txn.ip_address}-{RelationshipType.FROM_IP}"
            if edge_key not in edge_keys:
                edges.append({
                    "source": txn.transaction_id,
                    "target": txn.ip_address,
                    "relationship": RelationshipType.FROM_IP,
                })
                edge_keys.add(edge_key)

        # Add merchant node and edge
        if txn.merchant_id and txn.merchant_id not in node_ids:
            nodes.append({
                "id": txn.merchant_id,
                "type": NodeType.MERCHANT,
                "risk": calculate_entity_risk(db, NodeType.MERCHANT, txn.merchant_id),
            })
            node_ids.add(txn.merchant_id)

        if txn.merchant_id:
            edge_key = f"{txn.transaction_id}-{txn.merchant_id}-{RelationshipType.MERCHANT_TXN}"
            if edge_key not in edge_keys:
                edges.append({
                    "source": txn.transaction_id,
                    "target": txn.merchant_id,
                    "relationship": RelationshipType.MERCHANT_TXN,
                })
                edge_keys.add(edge_key)

        # Add payment instrument node and edge
        if txn.payment_instrument_id and txn.payment_instrument_id not in node_ids:
            nodes.append({
                "id": txn.payment_instrument_id,
                "type": NodeType.PAYMENT_INSTRUMENT,
                "risk": calculate_entity_risk(db, NodeType.PAYMENT_INSTRUMENT, txn.payment_instrument_id),
            })
            node_ids.add(txn.payment_instrument_id)

        if txn.payment_instrument_id:
            edge_key = f"{txn.transaction_id}-{txn.payment_instrument_id}-{RelationshipType.PAYS_WITH}"
            if edge_key not in edge_keys:
                edges.append({
                    "source": txn.transaction_id,
                    "target": txn.payment_instrument_id,
                    "relationship": RelationshipType.PAYS_WITH,
                })
                edge_keys.add(edge_key)

        # Add customer node and edge
        if txn.customer_id and txn.customer_id not in node_ids:
            nodes.append({
                "id": txn.customer_id,
                "type": NodeType.CUSTOMER,
                "risk": calculate_entity_risk(db, NodeType.CUSTOMER, txn.customer_id),
            })
            node_ids.add(txn.customer_id)

    return nodes, edges


def find_connected_components(nodes: List[Dict], edges: List[Dict]) -> List[Set[str]]:
    """
    Find connected components using Union-Find algorithm
    """
    parent = {}

    def find(x):
        if x not in parent:
            parent[x] = x
        if parent[x] != x:
            parent[x] = find(parent[x])
        return parent[x]

    def union(x, y):
        px, py = find(x), find(y)
        if px != py:
            parent[px] = py

    # Initialize each node as its own component
    for node in nodes:
        parent[node["id"]] = node["id"]

    # Union nodes connected by edges
    for edge in edges:
        union(edge["source"], edge["target"])

    # Group nodes by component
    components = defaultdict(set)
    for node in nodes:
        root = find(node["id"])
        components[root].add(node["id"])

    return list(components.values())


def calculate_cluster_risk(nodes: List[Dict], cluster_node_ids: Set[str]) -> int:
    """Calculate overall risk score for a cluster"""
    cluster_nodes = [n for n in nodes if n["id"] in cluster_node_ids]

    if not cluster_nodes:
        return 0

    # Average risk
    avg_risk = sum(n.get("risk", 0) for n in cluster_nodes) / len(cluster_nodes)

    # Count high-risk entities
    high_risk_count = sum(1 for n in cluster_nodes if n.get("risk", 0) >= 70)

    # Count fraudulent transactions
    fraud_txns = sum(1 for n in cluster_nodes
                     if n.get("type") == NodeType.TRANSACTION and n.get("risk", 0) == 100)

    # Weighted score
    score = avg_risk * 0.4 + high_risk_count * 10 + fraud_txns * 15

    return min(100, int(score))


def detect_suspicious_clusters(
    db: Session,
    nodes: List[Dict],
    edges: List[Dict],
    min_cluster_size: int = 3,
    min_risk_score: int = 30
) -> List[Dict[str, Any]]:
    """
    Detect suspicious clusters using graph analysis

    Criteria for suspicious clusters:
    1. Multiple entities of the same type (e.g., multiple accounts on same device)
    2. High-risk entities present
    3. Cross-entity connections (devices used by multiple accounts)
    4. Known fraudulent transactions in cluster
    """
    suspicious_clusters = []

    # Find connected components
    components = find_connected_components(nodes, edges)

    cluster_id = 1
    for component in components:
        if len(component) < min_cluster_size:
            continue

        # Get nodes in this cluster
        cluster_nodes = [n for n in nodes if n["id"] in component]

        # Calculate cluster risk
        cluster_risk = calculate_cluster_risk(nodes, component)

        if cluster_risk < min_risk_score:
            continue

        # Count entities by type
        type_counts = defaultdict(int)
        for node in cluster_nodes:
            type_counts[node.get("type", "unknown")] += 1

        # Detect suspicious patterns
        suspicious_patterns = []

        # Pattern 1: Device sharing (multiple accounts on same device)
        if type_counts.get(NodeType.DEVICE, 0) >= 1 and type_counts.get(NodeType.ACCOUNT, 0) >= 2:
            suspicious_patterns.append("device_sharing")

        # Pattern 2: IP sharing (multiple accounts from same IP)
        if type_counts.get(NodeType.IP, 0) >= 1 and type_counts.get(NodeType.ACCOUNT, 0) >= 2:
            suspicious_patterns.append("ip_sharing")

        # Pattern 3: Multiple payment instruments
        if type_counts.get(NodeType.PAYMENT_INSTRUMENT, 0) >= 3:
            suspicious_patterns.append("multiple_payment_instruments")

        # Pattern 4: Fraudulent transactions present
        fraud_count = sum(1 for n in cluster_nodes if n.get("type") == NodeType.TRANSACTION and n.get("risk") == 100)
        if fraud_count > 0:
            suspicious_patterns.append("contains_fraud")

        # Pattern 5: High-risk devices (rooted/emulator)
        device_ids = [n["id"] for n in cluster_nodes if n.get("type") == NodeType.DEVICE]
        if device_ids:
            risky_devices = db.query(Device).filter(
                Device.device_id.in_(device_ids),
                (Device.is_rooted == True) | (Device.is_emulator == True)
            ).count()
            if risky_devices > 0:
                suspicious_patterns.append("risky_devices")

        # Pattern 6: VPN/Proxy IPs
        ip_ids = [n["id"] for n in cluster_nodes if n.get("type") == NodeType.IP]
        if ip_ids:
            risky_ips = db.query(IpAddress).filter(
                IpAddress.ip_address.in_(ip_ids),
                (IpAddress.is_vpn == True) | (IpAddress.is_proxy == True)
            ).count()
            if risky_ips > 0:
                suspicious_patterns.append("vpn_proxy_ips")

        # Get merchants affected
        merchants_in_cluster = [n["id"] for n in cluster_nodes if n.get("type") == NodeType.MERCHANT]

        # Build entity breakdown
        entities = {
            "customers": [n["id"] for n in cluster_nodes if n.get("type") == NodeType.CUSTOMER],
            "accounts": [n["id"] for n in cluster_nodes if n.get("type") == NodeType.ACCOUNT],
            "devices": [n["id"] for n in cluster_nodes if n.get("type") == NodeType.DEVICE],
            "ips": [n["id"] for n in cluster_nodes if n.get("type") == NodeType.IP],
            "payment_instruments": [n["id"] for n in cluster_nodes if n.get("type") == NodeType.PAYMENT_INSTRUMENT],
            "merchants": merchants_in_cluster,
            "transactions": [n["id"] for n in cluster_nodes if n.get("type") == NodeType.TRANSACTION],
        }

        suspicious_clusters.append({
            "cluster_id": f"CLUSTER_{cluster_id:04d}",
            "size": len(component),
            "entities": entities,
            "merchants_affected": merchants_in_cluster,
            "risk_score": cluster_risk,
            "patterns_detected": suspicious_patterns,
            "fraudulent_transactions": fraud_count,
            "entity_counts": dict(type_counts),
        })

        cluster_id += 1

    # Sort by risk score descending
    suspicious_clusters.sort(key=lambda x: x["risk_score"], reverse=True)

    return suspicious_clusters


def get_fraud_network(db: Session, limit: int = 5000) -> Dict[str, Any]:
    """
    Main function to build fraud network and detect clusters

    Args:
        db: SQLAlchemy session
        limit: Maximum number of transactions to analyze

    Returns:
        {
            "nodes": [...],
            "edges": [...],
            "suspicious_clusters": [...],
            "statistics": {...}
        }
    """
    # Build graph
    nodes, edges = build_graph_from_db(db, limit)

    # Detect suspicious clusters
    clusters = detect_suspicious_clusters(db, nodes, edges)

    # Calculate statistics
    node_type_counts = defaultdict(int)
    for node in nodes:
        node_type_counts[node.get("type", "unknown")] += 1

    edge_type_counts = defaultdict(int)
    for edge in edges:
        edge_type_counts[edge.get("relationship", "unknown")] += 1

    high_risk_nodes = [n for n in nodes if n.get("risk", 0) >= 70]
    fraudulent_nodes = [n for n in nodes if n.get("risk", 0) == 100 and n.get("type") == NodeType.TRANSACTION]

    statistics = {
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "total_clusters": len(clusters),
        "high_risk_entities": len(high_risk_nodes),
        "fraudulent_transactions": len(fraudulent_nodes),
        "node_types": dict(node_type_counts),
        "edge_types": dict(edge_type_counts),
        "clusters_by_risk": {
            "critical": len([c for c in clusters if c["risk_score"] >= 80]),
            "high": len([c for c in clusters if 60 <= c["risk_score"] < 80]),
            "medium": len([c for c in clusters if 40 <= c["risk_score"] < 60]),
            "low": len([c for c in clusters if c["risk_score"] < 40]),
        },
    }

    return {
        "nodes": nodes,
        "edges": edges,
        "suspicious_clusters": clusters[:20],  # Return top 20 clusters
        "statistics": statistics,
    }
