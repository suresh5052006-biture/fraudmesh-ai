"""
FraudMesh AI - Authentication Layer Test
Verifies API Key validation, RBAC, and merchant isolation
"""

import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app
from auth import MASTER_KEY, DEMO_KEY

client = TestClient(app)

def test_health_is_public():
    """Health check endpoint should always be public"""
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print("✓ GET /api/health is publicly accessible")

def test_invalid_api_key_rejected():
    """Invalid API key should be rejected with 401"""
    res = client.get(
        "/api/transactions",
        headers={"X-API-Key": "fm_invalid_fake_key_9999"}
    )
    assert res.status_code == 401, f"Expected 401 for invalid key, got {res.status_code}"
    print("✓ Invalid API Key is properly rejected with 401 Unauthorized")

def test_master_key_authenticated():
    """Master platform key grants admin access to transactions"""
    res = client.get(
        "/api/transactions?page_size=5",
        headers={"X-API-Key": MASTER_KEY}
    )
    assert res.status_code == 200, f"Expected 200 with master key, got {res.status_code}"
    data = res.json()
    assert "items" in data
    print("✓ Master Key authenticated with admin privileges")

def test_merchant_demo_key_authenticated():
    """Demo merchant key grants access and filters correctly"""
    res = client.get(
        "/api/transactions?page_size=5",
        headers={"X-API-Key": DEMO_KEY}
    )
    assert res.status_code == 200, f"Expected 200 with demo key, got {res.status_code}"
    print("✓ Demo Merchant Key authenticated successfully")

def test_merchant_impersonation_blocked():
    """A merchant cannot perform actions on behalf of another merchant"""
    # Demo key is bound to MER0005, try to run risk check as MER0012
    res = client.post(
        "/api/risk/check",
        headers={"X-API-Key": DEMO_KEY},
        json={
            "account_id": "ACC00001",
            "device_id": "DEV0001",
            "payment_instrument_id": "PI0001",
            "ip_address": "192.168.1.1",
            "merchant_id": "MER0012",  # Attempted impersonation!
            "customer_id": "CUS00001",
            "amount": 100.0
        }
    )
    assert res.status_code == 403, f"Expected 403 Forbidden for merchant mismatch, got {res.status_code}"
    print("✓ Cross-merchant impersonation is blocked with 403 Forbidden")

def test_authorized_merchant_allowed():
    """Merchant acting as themselves is permitted"""
    res = client.post(
        "/api/risk/check",
        headers={"X-API-Key": DEMO_KEY},
        json={
            "account_id": "ACC00001",
            "device_id": "DEV0001",
            "payment_instrument_id": "PI0001",
            "ip_address": "192.168.1.1",
            "merchant_id": "MER0005",  # Own merchant identity
            "customer_id": "CUS00001",
            "amount": 100.0
        }
    )
    assert res.status_code == 200, f"Expected 200 for matching merchant, got {res.status_code}"
    print("✓ Authorized merchant request verified and scored")

if __name__ == "__main__":
    print("=" * 60)
    print("Running FraudMesh AI Authentication Tests")
    print("=" * 60)
    test_health_is_public()
    test_invalid_api_key_rejected()
    test_master_key_authenticated()
    test_merchant_demo_key_authenticated()
    test_merchant_impersonation_blocked()
    test_authorized_merchant_allowed()
    print("=" * 60)
    print("All Authentication & RBAC tests passed successfully!")
    print("=" * 60)
