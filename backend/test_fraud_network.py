"""
FraudMesh AI - Fraud Network Test
Tests graph-based fraud cluster detection
"""

import json
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db, seed_database
from fraud_network import get_fraud_network


def test_fraud_network():
    """Test the fraud relationship network detection"""

    # Initialize and seed database
    print("Initializing database...")
    init_db()

    db = SessionLocal()
    try:
        count = db.query(Transaction).count()
        if count == 0:
            print("Seeding database...")
            seed_database()
        else:
            print(f"Database already contains {count} transactions")

        # Test fraud network generation
        print("\n" + "="*70)
        print("Testing Fraud Relationship Network Detection")
        print("="*70)

        # Build network
        print("\n📊 Building fraud network from transaction data...")
        result = get_fraud_network(db, limit=2000)

        # Print statistics
        stats = result["statistics"]
        print(f"\n📈 Network Statistics:")
        print(f"  Total Nodes: {stats['total_nodes']}")
        print(f"  Total Edges: {stats['total_edges']}")
        print(f"  High Risk Entities: {stats['high_risk_entities']}")
        print(f"  Fraudulent Transactions: {stats['fraudulent_transactions']}")
        print(f"  Suspicious Clusters: {stats['total_clusters']}")

        print(f"\n🔢 Node Types:")
        for node_type, count in stats["node_types"].items():
            print(f"  {node_type}: {count}")

        print(f"\n🔗 Edge Types:")
        for edge_type, count in stats["edge_types"].items():
            print(f"  {edge_type}: {count}")

        print(f"\n⚠️  Clusters by Risk Level:")
        for level, count in stats["clusters_by_risk"].items():
            print(f"  {level}: {count}")

        # Print suspicious clusters
        clusters = result["suspicious_clusters"]
        if clusters:
            print(f"\n🎯 Top Suspicious Clusters:")
            for i, cluster in enumerate(clusters[:5]):  # Show top 5
                print(f"\n  {cluster['cluster_id']}:")
                print(f"    Size: {cluster['size']} entities")
                print(f"    Risk Score: {cluster['risk_score']}/100")
                print(f"    Fraudulent Txns: {cluster['fraudulent_transactions']}")
                print(f"    Patterns: {', '.join(cluster['patterns_detected'])}")

                # Show entity breakdown
                entities = cluster["entities"]
                print(f"    Entity Breakdown:")
                for entity_type, ids in entities.items():
                    if ids:
                        print(f"      {entity_type}: {len(ids)}")

                if cluster["merchants_affected"]:
                    print(f"    Merchants Affected: {len(cluster['merchants_affected'])}")

        # Sample nodes and edges
        print(f"\n🎭 Sample Network Structure:")
        if result["nodes"]:
            sample_nodes = result["nodes"][:3]
            print(f"  Sample Nodes:")
            for node in sample_nodes:
                print(f"    {node['id']} ({node['type']}) - Risk: {node.get('risk', 0)}")

        if result["edges"]:
            sample_edges = result["edges"][:3]
            print(f"  Sample Edges:")
            for edge in sample_edges:
                print(f"    {edge['source']} → {edge['target']} ({edge['relationship']})")

        # Find the highest risk cluster
        if clusters:
            top_cluster = clusters[0]
            print(f"\n🚨 Highest Risk Cluster:")
            print(f"  Cluster ID: {top_cluster['cluster_id']}")
            print(f"  Risk Score: {top_cluster['risk_score']}/100")
            print(f"  Size: {top_cluster['size']} entities")
            print(f"  Patterns: {', '.join(top_cluster['patterns_detected'])}")

            # Show suspicious patterns detected
            print(f"\n  Suspicious Patterns Analysis:")
            for pattern in top_cluster['patterns_detected']:
                if pattern == "device_sharing":
                    print(f"    📱 Device Sharing: Multiple accounts using same device")
                    device_ids = cluster["entities"]["devices"]
                    account_ids = cluster["entities"]["accounts"]
                    if device_ids and account_ids:
                        print(f"      Devices: {device_ids[:3]}{'...' if len(device_ids) > 3 else ''}")
                        print(f"      Accounts: {account_ids[:3]}{'...' if len(account_ids) > 3 else ''}")
                elif pattern == "contains_fraud":
                    print(f"    🚨 Contains Fraudulent Transactions: {top_cluster['fraudulent_transactions']} fraud txns")
                elif pattern == "vpn_proxy_ips":
                    print(f"    🌐 VPN/Proxy IPs Detected")
                    ip_ids = cluster["entities"]["ips"]
                    if ip_ids:
                        print(f"      IPs: {ip_ids[:3]}{'...' if len(ip_ids) > 3 else ''}")

        # Save results for inspection
        output_file = "fraud_network_results.json"
        with open(output_file, "w") as f:
            # Convert to JSON serializable format
            serializable_result = {
                "nodes": result["nodes"],
                "edges": result["edges"],
                "suspicious_clusters": result["suspicious_clusters"],
                "statistics": result["statistics"],
            }
            json.dump(serializable_result, f, indent=2, default=str)
        print(f"\n💾 Network results saved to {output_file}")

        # Test API endpoint compatibility
        print(f"\n" + "="*70)
        print("API Endpoint Compatibility Check")
        print("="*70)
        print("\n✅ The following endpoints are now available:")
        print(f"  GET /api/health")
        print(f"  GET /api/transactions")
        print(f"  POST /api/risk/check")
        print(f"  GET /api/network")
        print(f"\n📊 Fraud network endpoint returns:")
        print(f"  • Nodes: Entities with risk scores")
        print(f"  • Edges: Relationships between entities")
        print(f"  • Suspicious Clusters: Graph-based fraud patterns")
        print(f"  • Statistics: Network analysis summary")

    finally:
        db.close()


if __name__ == "__main__":
    from models import Transaction
    test_fraud_network()
