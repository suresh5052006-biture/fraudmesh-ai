"""
FraudMesh AI - Synthetic Data Generator
Deterministic synthetic data for fraud detection testing
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Seed for deterministic data generation
RANDOM_SEED = 42
random.seed(RANDOM_SEED)


def generate_timestamp(start_days_ago: int = 90) -> datetime:
    """Generate a random timestamp within the last N days"""
    start_date = datetime.now() - timedelta(days=start_days_ago)
    random_days = random.randint(0, start_days_ago)
    random_seconds = random.randint(0, 86400 * random_days)
    return start_date + timedelta(seconds=random_seconds)


def generate_merchants(count: int = 20) -> List[Dict[str, Any]]:
    """Generate synthetic merchant data"""
    categories = [
        "E-commerce", "Digital Services", "Marketplace", "SaaS",
        "Gaming", "Streaming", "Food Delivery", "Transportation",
        "Healthcare", "Education", "Finance", "Travel"
    ]
    risk_levels = ["low", "medium", "high"]

    merchants = []
    for i in range(1, count + 1):
        merchants.append({
            "merchant_id": f"MER{i:04d}",
            "name": f"Merchant {i}",
            "category": random.choice(categories),
            "risk_level": random.choices(risk_levels, weights=[70, 20, 10])[0],
            "created_at": generate_timestamp(365).isoformat(),
        })
    return merchants


def generate_customers(count: int = 5000) -> List[Dict[str, Any]]:
    """Generate synthetic customer data"""
    first_names = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "Robert", "Lisa",
                   "William", "Jennifer", "James", "Amanda", "Charles", "Jessica", "Thomas",
                   "Ashley", "Daniel", "Nicole", "Matthew", "Stephanie"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
                  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
                  "Thomas", "Taylor", "Moore", "Jackson", "Martin"]

    customers = []
    for i in range(1, count + 1):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        customers.append({
            "customer_id": f"CUS{i:05d}",
            "email": f"user{i}@example.com",
            "name": f"{first_name} {last_name}",
            "created_at": generate_timestamp(365).isoformat(),
            "risk_score": random.randint(0, 100),
        })
    return customers


def generate_accounts(count: int = 5000, customers: List[Dict]) -> List[Dict[str, Any]]:
    """Generate synthetic account data"""
    account_types = ["checking", "savings", "business", "prepaid"]
    statuses = ["active", "active", "active", "active", "suspended", "closed"]

    accounts = []
    for i in range(1, count + 1):
        customer = random.choice(customers)
        accounts.append({
            "account_id": f"ACC{i:05d}",
            "customer_id": customer["customer_id"],
            "account_type": random.choice(account_types),
            "status": random.choices(statuses, weights=[40, 30, 15, 10, 4, 1])[0],
            "created_at": generate_timestamp(365).isoformat(),
            "balance": round(random.uniform(0, 50000), 2),
        })
    return accounts


def generate_devices(count: int = 2000) -> List[Dict[str, Any]]:
    """Generate synthetic device data"""
    device_types = ["mobile", "desktop", "tablet", "smartwatch"]
    os_list = ["iOS", "Android", "Windows", "macOS", "Linux"]
    browsers = ["Chrome", "Safari", "Firefox", "Edge", "Opera"]

    devices = []
    for i in range(1, count + 1):
        devices.append({
            "device_id": f"DEV{i:04d}",
            "type": random.choice(device_types),
            "os": random.choice(os_list),
            "browser": random.choice(browsers),
            "fingerprint": f"fp_{i:04d}_{random.randint(10000, 99999)}",
            "is_rooted": random.random() < 0.05,
            "is_emulator": random.random() < 0.02,
        })
    return devices


def generate_ip_addresses(count: int = 1000) -> List[Dict[str, Any]]:
    """Generate synthetic IP address data"""
    # Generate realistic-looking IPs
    ip_addresses = []
    for i in range(1, count + 1):
        # Mix of residential, data center, and VPN proxies
        if random.random() < 0.7:
            # Residential IPs
            octet1 = random.choice([24, 71, 98, 126, 172, 173, 174, 184, 192, 198, 199])
            octet2 = random.randint(0, 255)
            octet3 = random.randint(0, 255)
            octet4 = random.randint(1, 254)
        elif random.random() < 0.8:
            # Data center IPs
            octet1 = random.choice([23, 40, 104, 107, 108, 138, 147, 162, 167, 172])
            octet2 = random.randint(0, 255)
            octet3 = random.randint(0, 255)
            octet4 = random.randint(1, 254)
        else:
            # VPN/Proxy ranges
            octet1 = random.choice([91, 185, 188, 195])
            octet2 = random.randint(0, 255)
            octet3 = random.randint(0, 255)
            octet4 = random.randint(1, 254)

        ip = f"{octet1}.{octet2}.{octet3}.{octet4}"
        ip_addresses.append({
            "ip_address": ip,
            "country": random.choice(["US", "IN", "GB", "DE", "BR", "NG", "RU", "CN", "PH", "VN"]),
            "is_vpn": random.random() < 0.1,
            "is_proxy": random.random() < 0.05,
            "is_datacenter": random.random() < 0.1,
            "risk_score": random.randint(0, 100),
        })
    return ip_addresses


def generate_payment_instruments(count: int = 2000, customers: List[Dict]) -> List[Dict[str, Any]]:
    """Generate synthetic payment instrument data"""
    instrument_types = ["card", "bank_account", "upi", "wallet"]
    networks = ["Visa", "Mastercard", "RuPay", "None", "None", "None"]

    payment_instruments = []
    for i in range(1, count + 1):
        customer = random.choice(customers)
        p_type = random.choice(instrument_types)
        if p_type == "card":
            last_four = f"{random.randint(1000, 9999)}"
            network = random.choice(networks)
        else:
            last_four = f"{random.randint(1000, 9999)}"
            network = "None"

        payment_instruments.append({
            "payment_instrument_id": f"PI{i:04d}",
            "customer_id": customer["customer_id"],
            "type": p_type,
            "last_four": last_four,
            "network": network,
            "is_prepaid": random.random() < 0.1,
            "is_virtual": random.random() < 0.15,
            "is_issuing_country_high_risk": random.random() < 0.08,
        })
    return payment_instruments


def create_fraud_rings(
    merchants: List[Dict],
    customers: List[Dict],
    accounts: List[Dict],
    devices: List[Dict],
    ip_addresses: List[Dict],
    payment_instruments: List[Dict]
) -> List[Dict[str, Any]]:
    """Create coordinated fraud rings for testing"""

    # Index data for efficient lookup
    accounts_by_customer = {}
    for acc in accounts:
        if acc["customer_id"] not in accounts_by_customer:
            accounts_by_customer[acc["customer_id"]] = []
        accounts_by_customer[acc["customer_id"]].append(acc)

    fraud_rings = []

    # Fraud Ring 1: Quick Cashout Ring
    # High-value transactions from new accounts using same device
    ring1_accounts = random.sample(accounts, 50)
    ring1_device = random.choice(devices)
    ring1_ip = random.choice(ip_addresses)
    ring1_merchants = random.sample([m for m in merchants if m["risk_level"] == "high"], 3)

    fraud_rings.append({
        "ring_id": "FR001",
        "name": "Quick Cashout Ring",
        "description": "High-value transactions from new accounts using same device and IP",
        "accounts": [a["account_id"] for a in ring1_accounts],
        "devices": [ring1_device["device_id"]],
        "ip_addresses": [ring1_ip["ip_address"]],
        "merchants": [m["merchant_id"] for m in ring1_merchants],
        "pattern": "high_velocity_new_accounts_same_device",
        "severity": "critical",
    })

    # Fraud Ring 2: Distributed Testing Ring
    # Small test transactions across many accounts and devices
    ring2_accounts = random.sample([a for a in accounts if a["status"] == "active"], 100)
    ring2_devices = random.sample(devices, 20)
    ring2_ips = random.sample(ip_addresses, 10)

    fraud_rings.append({
        "ring_id": "FR002",
        "name": "Card Testing Ring",
        "description": "Small test transactions across many accounts and devices",
        "accounts": [a["account_id"] for a in ring2_accounts],
        "devices": [d["device_id"] for d in ring2_devices],
        "ip_addresses": [ip["ip_address"] for ip in ring2_ips],
        "merchants": [],
        "pattern": "small_test_transactions_distributed",
        "severity": "high",
    })

    # Fraud Ring 3: Account Takeover Pattern
    # Multiple accounts showing sudden device/IP changes
    ring3_accounts = random.sample(accounts, 30)
    ring3_new_devices = [d for d in devices if d["is_rooted"] or d["is_emulator"]][:5]
    if not ring3_new_devices:
        ring3_new_devices = random.sample(devices, 5)
    ring3_vpn_ips = [ip for ip in ip_addresses if ip["is_vpn"]][:3]
    if not ring3_vpn_ips:
        ring3_vpn_ips = random.sample(ip_addresses, 3)

    fraud_rings.append({
        "ring_id": "FR003",
        "name": "Account Takeover Ring",
        "description": "Multiple accounts with sudden device/IP changes to compromised endpoints",
        "accounts": [a["account_id"] for a in ring3_accounts],
        "devices": [d["device_id"] for d in ring3_new_devices],
        "ip_addresses": [ip["ip_address"] for ip in ring3_vpn_ips],
        "merchants": [],
        "pattern": "account_takeover_indicators",
        "severity": "critical",
    })

    # Fraud Ring 4: Collusive Merchant Ring
    # Multiple merchants and accounts coordinating on transactions
    ring4_merchants = random.sample([m for m in merchants if m["category"] in ["E-commerce", "Marketplace"]], 5)
    ring4_accounts = []
    for merchant in ring4_merchants:
        for _ in range(10):
            cust = random.choice(customers)
            if cust["customer_id"] in accounts_by_customer:
                ring4_accounts.extend(accounts_by_customer[cust["customer_id"]][:1])
    ring4_accounts = list(dict.fromkeys(ring4_accounts))[:30]
    ring4_ips = [ip for ip in ip_addresses if ip["is_datacenter"]][:5]
    if not ring4_ips:
        ring4_ips = random.sample(ip_addresses, 5)

    fraud_rings.append({
        "ring_id": "FR004",
        "name": "Collusive Merchant Ring",
        "description": "Multiple merchants coordinating with accounts using data center IPs",
        "accounts": [a["account_id"] for a in ring4_accounts],
        "devices": random.sample(devices, 10),
        "ip_addresses": [ip["ip_address"] for ip in ring4_ips],
        "merchants": [m["merchant_id"] for m in ring4_merchants],
        "pattern": "merchant_account_collusion",
        "severity": "high",
    })

    # Fraud Ring 5: International Money Laundering Ring
    # Large transactions with high-risk country IPs
    ring5_accounts = random.sample(accounts, 40)
    ring5_high_risk_ips = [ip for ip in ip_addresses
                           if ip["risk_score"] > 70 or ip["is_proxy"]][:5]
    ring5_merchants = random.sample(
        [m for m in merchants if m["category"] in ["Travel", "Finance"]], 4)

    fraud_rings.append({
        "ring_id": "FR005",
        "name": "International Laundering Ring",
        "description": "Large transactions using high-risk proxy IPs and international flows",
        "accounts": [a["account_id"] for a in ring5_accounts],
        "devices": random.sample(devices, 8),
        "ip_addresses": [ip["ip_address"] for ip in ring5_high_risk_ips],
        "merchants": [m["merchant_id"] for m in ring5_merchants],
        "pattern": "international_money_laundering",
        "severity": "critical",
    })

    return fraud_rings


def generate_transactions(
    count: int = 15000,
    merchants: List[Dict] = None,
    customers: List[Dict] = None,
    accounts: List[Dict] = None,
    devices: List[Dict] = None,
    ip_addresses: List[Dict] = None,
    payment_instruments: List[Dict] = None,
    fraud_rings: List[Dict] = None
) -> List[Dict[str, Any]]:
    """Generate synthetic transaction data"""

    if fraud_rings is None:
        fraud_rings = []

    # Build lookup maps
    accounts_by_id = {a["account_id"]: a for a in accounts}
    devices_by_id = {d["device_id"]: d for d in devices}
    ips_by_address = {ip["ip_address"]: ip for ip in ip_addresses}

    # Count how many transactions should go to each fraud ring
    ring_transaction_count = int(count * 0.10)  # 10% of transactions are fraudulent
    ring_counts = {r["ring_id"]: ring_transaction_count // 5 for r in fraud_rings}

    transactions = []
    ring_transactions_generated = {r["ring_id"]: 0 for r in fraud_rings}

    for i in range(1, count + 1):
        is_fraudulent = False
        assigned_ring = None

        # Determine if this transaction should be fraudulent
        if fraud_rings:
            for ring in fraud_rings:
                if ring_transactions_generated[ring["ring_id"]] < ring_counts.get(ring["ring_id"], 0):
                    if random.random() < 0.01:  # Weighted random assignment
                        is_fraudulent = True
                        assigned_ring = ring
                        ring_transactions_generated[ring["ring_id"]] += 1
                        break

        if assigned_ring:
            # Generate fraudulent transaction based on ring pattern
            account_id = random.choice(assigned_ring["accounts"])
            account = accounts_by_id.get(account_id, random.choice(accounts))

            if "devices" in assigned_ring and assigned_ring["devices"]:
                device = devices_by_id.get(
                    random.choice(assigned_ring["devices"]),
                    random.choice(devices)
                )
            else:
                device = random.choice(devices)

            if "ip_addresses" in assigned_ring and assigned_ring["ip_addresses"]:
                ip_address = random.choice(assigned_ring["ip_addresses"])
            else:
                ip_address = random.choice(ip_addresses)["ip_address"]

            if "merchants" in assigned_ring and assigned_ring["merchants"]:
                merchant = next((m for m in merchants if m["merchant_id"] == random.choice(assigned_ring["merchants"])),
                               random.choice(merchants))
            else:
                merchant = random.choice(merchants)

            # Fraudulent transactions are typically higher value and recent
            amount = round(random.uniform(500, 10000), 2)
            timestamp = generate_timestamp(7)  # More recent

        else:
            # Generate legitimate transaction
            account = random.choice(accounts)
            device = random.choice(devices)
            ip_info = random.choice(ip_addresses)
            ip_address = ip_info["ip_address"]
            merchant = random.choice(merchants)

            # Most transactions are low value
            amount = round(random.expovariate(0.1), 2)
            timestamp = generate_timestamp(90)

        status_options = ["completed", "completed", "completed", "completed",
                         "pending", "failed", "declined", "declined"]

        # Fraudulent transactions more likely to be declined
        if is_fraudulent:
            status_options = ["declined", "declined", "declined", "completed", "failed"]

        status = random.choices(status_options, weights=[50, 25, 15, 8, 2] if is_fraudulent
                               else [50, 25, 15, 8, 2])[0]

        transactions.append({
            "transaction_id": f"TXN{i:06d}",
            "merchant_id": merchant["merchant_id"],
            "customer_id": account["customer_id"],
            "account_id": account["account_id"],
            "device_id": device["device_id"],
            "ip_address": ip_address,
            "payment_instrument_id": random.choice(payment_instruments)["payment_instrument_id"],
            "amount": amount,
            "timestamp": timestamp.isoformat(),
            "status": status,
            "is_fraudulent": is_fraudulent,
            "fraud_ring_id": assigned_ring["ring_id"] if assigned_ring else None,
        })

    return transactions


def generate_dataset() -> Dict[str, Any]:
    """
    Main function to generate the complete synthetic dataset
    Returns all generated data as a dictionary
    """
    print("Generating FraudMesh AI synthetic dataset...")
    print("=" * 50)

    # Generate base entities
    print("Generating 20 merchants...")
    merchants = generate_merchants(20)

    print("Generating 5,000 customers...")
    customers = generate_customers(5000)

    print("Generating 5,000 accounts...")
    accounts = generate_accounts(5000, customers)

    print("Generating 2,000 devices...")
    devices = generate_devices(2000)

    print("Generating 1,000 IP addresses...")
    ip_addresses = generate_ip_addresses(1000)

    print("Generating 2,000 payment instruments...")
    payment_instruments = generate_payment_instruments(2000, customers)

    # Create fraud rings
    print("Creating 5 fraud rings...")
    fraud_rings = create_fraud_rings(
        merchants, customers, accounts, devices, ip_addresses, payment_instruments
    )

    # Generate transactions
    print("Generating 15,000 transactions...")
    transactions = generate_transactions(
        15000, merchants, customers, accounts, devices, ip_addresses,
        payment_instruments, fraud_rings
    )

    dataset = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "seed": RANDOM_SEED,
            "version": "1.0.0",
        },
        "merchants": merchants,
        "customers": customers,
        "accounts": accounts,
        "devices": devices,
        "ip_addresses": ip_addresses,
        "payment_instruments": payment_instruments,
        "fraud_rings": fraud_rings,
        "transactions": transactions,
    }

    # Print summary
    print("=" * 50)
    print("Dataset generation complete!")
    print(f"  - Merchants: {len(merchants)}")
    print(f"  - Customers: {len(customers)}")
    print(f"  - Accounts: {len(accounts)}")
    print(f"  - Devices: {len(devices)}")
    print(f"  - IP Addresses: {len(ip_addresses)}")
    print(f"  - Payment Instruments: {len(payment_instruments)}")
    print(f"  - Fraud Rings: {len(fraud_rings)}")
    print(f"  - Transactions: {len(transactions)}")

    fraud_count = sum(1 for t in transactions if t["is_fraudulent"])
    print(f"\nFraud Statistics:")
    print(f"  - Fraudulent Transactions: {fraud_count} ({fraud_count/len(transactions)*100:.2f}%)")
    print(f"  - Legitimate Transactions: {len(transactions) - fraud_count}")

    return dataset


if __name__ == "__main__":
    dataset = generate_dataset()

    # Save to JSON for verification
    import json
    output_file = "fraudmesh_dataset.json"
    with open(output_file, "w") as f:
        json.dump(dataset, f, indent=2, default=str)
    print(f"\nDataset saved to {output_file}")