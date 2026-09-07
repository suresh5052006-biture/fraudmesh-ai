"""
FraudMesh AI - Database Layer
SQLite database management and seeding
"""

import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError
from typing import Generator

from models import Base, Merchant, Customer, Account, Device, Transaction
from models import PaymentInstrument, FraudSignal, Investigation, IpAddress, FraudRing

# Database configuration
DATABASE_URL = "sqlite:///./fraudmesh.db"
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


from datetime import datetime

def seed_database(dataset_path: str = None):
    """Seed database with synthetic data from seed_data.py output"""
    if dataset_path is None:
        dataset_path = os.path.join(os.path.dirname(__file__), "fraudmesh_dataset.json")

    if not os.path.exists(dataset_path):
        print(f"Dataset file not found: {dataset_path}")
        return

    print(f"Loading dataset from {dataset_path}...")

    with open(dataset_path, "r") as f:
        dataset = json.load(f)

    db = SessionLocal()
    try:
        # Seed Merchants
        print("Seeding merchants...")
        for merchant in dataset.get("merchants", []):
            if "created_at" in merchant and isinstance(merchant["created_at"], str):
                merchant["created_at"] = datetime.fromisoformat(merchant["created_at"])
            db.add(Merchant(**merchant))

        # Seed Customers
        print("Seeding customers...")
        for customer in dataset.get("customers", []):
            if "created_at" in customer and isinstance(customer["created_at"], str):
                customer["created_at"] = datetime.fromisoformat(customer["created_at"])
            db.add(Customer(**customer))

        # Seed Accounts
        print("Seeding accounts...")
        for account in dataset.get("accounts", []):
            if "created_at" in account and isinstance(account["created_at"], str):
                account["created_at"] = datetime.fromisoformat(account["created_at"])
            db.add(Account(**account))

        # Seed Devices
        print("Seeding devices...")
        for device in dataset.get("devices", []):
            db.add(Device(**device))

        # Seed IP Addresses
        print("Seeding IP addresses...")
        for ip in dataset.get("ip_addresses", []):
            db.add(IpAddress(**ip))

        # Seed Payment Instruments
        print("Seeding payment instruments...")
        for pi in dataset.get("payment_instruments", []):
            db.add(PaymentInstrument(**pi))

        # Seed Fraud Rings
        print("Seeding fraud rings...")
        for ring in dataset.get("fraud_rings", []):
            db.add(FraudRing(
                ring_id=ring["ring_id"],
                name=ring["name"],
                description=ring["description"],
                pattern=ring["pattern"],
                severity=ring["severity"],
                accounts_json=json.dumps(ring.get("accounts", [])),
                devices_json=json.dumps(ring.get("devices", [])),
                ip_addresses_json=json.dumps(ring.get("ip_addresses", [])),
                merchants_json=json.dumps(ring.get("merchants", [])),
            ))

        # Seed Transactions
        print("Seeding transactions...")
        for txn in dataset.get("transactions", []):
            if "timestamp" in txn and isinstance(txn["timestamp"], str):
                txn["timestamp"] = datetime.fromisoformat(txn["timestamp"])
            db.add(Transaction(**txn))

        db.commit()
        print("Database seeded successfully!")

    except IntegrityError as e:
        db.rollback()
        print(f"Integrity error: {e}")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def get_transaction_stats():
    """Get transaction statistics"""
    db = SessionLocal()
    try:
        total = db.query(Transaction).count()
        fraud = db.query(Transaction).filter(Transaction.is_fraudulent == True).count()
        declined = db.query(Transaction).filter(Transaction.status == "declined").count()
        return {
            "total_transactions": total,
            "fraudulent_transactions": fraud,
            "declined_transactions": declined,
            "fraud_rate": round(fraud / total * 100, 2) if total > 0 else 0
        }
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing FraudMesh AI database...")
    init_db()

    # Check if already seeded
    db = SessionLocal()
    count = db.query(Transaction).count()
    db.close()

    if count == 0:
        print("Database is empty. Seeding with synthetic data...")
        seed_database()
    else:
        print(f"Database already contains {count} transactions. Skipping seed.")

    # Print stats
    stats = get_transaction_stats()
    print(f"\nDatabase Statistics:")
    print(f"  Total Transactions: {stats['total_transactions']}")
    print(f"  Fraudulent: {stats['fraudulent_transactions']} ({stats['fraud_rate']}%)")
    print(f"  Declined: {stats['declined_transactions']}")