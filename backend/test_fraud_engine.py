"""
FraudMesh AI - Fraud Risk Engine Test
Tests the fraud risk calculation with synthetic transactions
"""

import json
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db, seed_database
from models import Transaction as TransactionModel
from fraud_engine import calculate_transaction_risk

def test_fraud_risk_engine():
    """Test the fraud risk engine with synthetic transactions"""

    # Initialize and seed database
    print("Initializing database...")
    init_db()

    db = SessionLocal()
    try:
        count = db.query(TransactionModel).count()
        if count == 0:
            print("Seeding database...")
            seed_database()
        else:
            print(f"Database already contains {count} transactions")

        # Get a sample fraudulent transaction
        print("\n" + "="*60)
        print("Testing with a FRAUDULENT transaction:")
        print("="*60)

        fraudulent_txn = db.query(TransactionModel).filter(
            TransactionModel.is_fraudulent == True
        ).first()

        if fraudulent_txn:
            print(f"\nTransaction: {fraudulent_txn.transaction_id}")
            print(f"Account: {fraudulent_txn.account_id}")
            print(f"Amount: ${fraudulent_txn.amount:.2f}")
            print(f"Status: {fraudulent_txn.status}")
            print(f"Fraud Ring: {fraudulent_txn.fraud_ring_id}")

            txn_dict = {
                "transaction_id": fraudulent_txn.transaction_id,
                "account_id": fraudulent_txn.account_id,
                "device_id": fraudulent_txn.device_id,
                "payment_instrument_id": fraudulent_txn.payment_instrument_id,
                "ip_address": fraudulent_txn.ip_address,
                "merchant_id": fraudulent_txn.merchant_id,
                "customer_id": fraudulent_txn.customer_id,
                "amount": fraudulent_txn.amount,
                "timestamp": fraudulent_txn.timestamp,
            }

            result = calculate_transaction_risk(db, txn_dict)

            print(f"\n📊 Risk Score: {result['risk_score']}/100")
            print(f"🚨 Risk Level: {result['risk_level']}")
            print(f"📋 Recommended Action: {result['recommended_action']}")
            print(f"\n🔍 Detected Signals ({len(result['signals'])} total):")
            for sig in result['signals']:
                print(f"  • {sig['signal_type']}: {sig['description']}")
                print(f"    Contribution: +{sig['score_contribution']:.1f}")

        # Get a sample legitimate transaction
        print("\n" + "="*60)
        print("Testing with a LEGITIMATE transaction:")
        print("="*60)

        legit_txn = db.query(TransactionModel).filter(
            TransactionModel.is_fraudulent == False
        ).first()

        if legit_txn:
            print(f"\nTransaction: {legit_txn.transaction_id}")
            print(f"Account: {legit_txn.account_id}")
            print(f"Amount: ${legit_txn.amount:.2f}")
            print(f"Status: {legit_txn.status}")

            txn_dict = {
                "transaction_id": legit_txn.transaction_id,
                "account_id": legit_txn.account_id,
                "device_id": legit_txn.device_id,
                "payment_instrument_id": legit_txn.payment_instrument_id,
                "ip_address": legit_txn.ip_address,
                "merchant_id": legit_txn.merchant_id,
                "customer_id": legit_txn.customer_id,
                "amount": legit_txn.amount,
                "timestamp": legit_txn.timestamp,
            }

            result = calculate_transaction_risk(db, txn_dict)

            print(f"\n📊 Risk Score: {result['risk_score']}/100")
            print(f"🚨 Risk Level: {result['risk_level']}")
            print(f"📋 Recommended Action: {result['recommended_action']}")
            print(f"\n🔍 Detected Signals ({len(result['signals'])} total):")
            for sig in result['signals']:
                print(f"  • {sig['signal_type']}: {sig['description']}")
                print(f"    Contribution: +{sig['score_contribution']:.1f}")

        # Test a high-velocity card testing pattern
        print("\n" + "="*60)
        print("Testing CARD TESTING pattern detection:")
        print("="*60)

        # Get multiple transactions from same payment instrument
        pi_txns = db.query(TransactionModel).filter(
            TransactionModel.payment_instrument_id != None
        ).group_by(
            TransactionModel.payment_instrument_id
        ).having(
            # This is a simplified check - in real code use func.count()
        ).limit(1).all()

        if pi_txns:
            test_txn = pi_txns[0]
            print(f"\nTesting Payment Instrument: {test_txn.payment_instrument_id}")

            txn_dict = {
                "transaction_id": test_txn.transaction_id,
                "account_id": test_txn.account_id,
                "device_id": test_txn.device_id,
                "payment_instrument_id": test_txn.payment_instrument_id,
                "ip_address": test_txn.ip_address,
                "merchant_id": test_txn.merchant_id,
                "customer_id": test_txn.customer_id,
                "amount": test_txn.amount,
                "timestamp": test_txn.timestamp,
            }

            result = calculate_transaction_risk(db, txn_dict)

            print(f"\n📊 Risk Score: {result['risk_score']}/100")
            print(f"🚨 Risk Level: {result['risk_level']}")

            card_testing_signals = [s for s in result['signals'] if 'testing' in s['description'].lower()]
            if card_testing_signals:
                print("🎯 Card Testing Signals Detected:")
                for sig in card_testing_signals:
                    print(f"  • {sig['description']}")

        # Summary
        print("\n" + "="*60)
        print("✅ Fraud Risk Engine Test Complete!")
        print("="*60)

    finally:
        db.close()


if __name__ == "__main__":
    test_fraud_risk_engine()
