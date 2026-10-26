"""
FraudMesh AI - Authentication & Authorization Layer
Provides API Key authentication and role-based access control for gateway endpoints.
"""

import os
from typing import Optional
from fastapi import Security, HTTPException, status, Depends
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from database import get_db
from models import Merchant

# Header names supported for API Key
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# Configurable keys via environment
MASTER_KEY = os.getenv("FRAUDMESH_MASTER_KEY", "fm_live_master_secret_2026")
DEMO_KEY = os.getenv("FRAUDMESH_DEMO_KEY", "fm_live_merchant_demo_key_2026")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() in ("true", "1") or ENVIRONMENT == "production"


class AuthContext:
    """Represents authenticated identity and permissions"""

    def __init__(
        self,
        api_key: Optional[str],
        role: str,
        merchant_id: Optional[str] = None,
        is_authenticated: bool = False,
    ):
        self.api_key = api_key
        self.role = role  # "admin" | "merchant" | "anonymous"
        self.merchant_id = merchant_id
        self.is_authenticated = is_authenticated

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


async def get_auth_context(
    api_key: Optional[str] = Security(API_KEY_HEADER),
    db: Session = Depends(get_db),
) -> AuthContext:
    """
    Dependency that extracts and validates API Key credentials.
    In production (or when REQUIRE_AUTH=true), missing/invalid keys raise 401.
    In development, missing keys yield an unauthenticated context with fallback.
    """
    if not api_key:
        if REQUIRE_AUTH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required: Please provide a valid 'X-API-Key' header.",
                headers={"WWW-Authenticate": "ApiKey"},
            )
        # Development fallback
        return AuthContext(
            api_key=None,
            role="anonymous",
            merchant_id="MER0005",
            is_authenticated=False,
        )

    # 1. Master Platform Admin Key
    if api_key == MASTER_KEY:
        return AuthContext(
            api_key=api_key,
            role="admin",
            merchant_id=None,
            is_authenticated=True,
        )

    # 2. Universal Demo Merchant Key (for showcase and frontend UI)
    if api_key == DEMO_KEY:
        return AuthContext(
            api_key=api_key,
            role="merchant",
            merchant_id="MER0005",
            is_authenticated=True,
        )

    # 3. Dynamic Merchant Key format: fm_live_<merchant_id>_<secret>
    if api_key.startswith("fm_live_"):
        parts = api_key.split("_")
        if len(parts) >= 3:
            merchant_id = parts[2].upper()
            merchant = db.query(Merchant).filter(Merchant.merchant_id == merchant_id).first()
            if merchant:
                return AuthContext(
                    api_key=api_key,
                    role="merchant",
                    merchant_id=merchant_id,
                    is_authenticated=True,
                )

    # Invalid Key provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API Key. Authentication failed.",
        headers={"WWW-Authenticate": "ApiKey"},
    )


async def require_auth(auth: AuthContext = Depends(get_auth_context)) -> AuthContext:
    """Ensure the request is authenticated by an authorized identity"""
    if not auth.is_authenticated and REQUIRE_AUTH:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return auth


def verify_merchant_ownership(auth: AuthContext, requested_merchant_id: Optional[str]):
    """
    Prevent merchant impersonation. A merchant cannot publish or charge
    under a different merchant's identity unless they possess the admin role.
    """
    if not auth.is_authenticated:
        return
    if auth.is_admin:
        return
    if auth.merchant_id and requested_merchant_id and auth.merchant_id != requested_merchant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: Authenticated as {auth.merchant_id}, cannot perform action on behalf of {requested_merchant_id}.",
        )
