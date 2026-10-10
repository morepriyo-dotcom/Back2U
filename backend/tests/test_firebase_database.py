import pytest
from fastapi.testclient import TestClient
from app.services.firebase_db import (
    is_firebase_db_ready,
    sync_item_to_firestore,
    sync_claim_to_firestore,
    test_firestore_connection as run_test_firestore_connection
)

def test_firestore_connection_logic():
    """
    Directly tests test_firestore_connection logic safely.
    """
    res = run_test_firestore_connection()
    assert isinstance(res, dict)
    assert "status" in res

def test_firebase_status_endpoint(client: TestClient):
    """
    Verifies that the /api/firebase/status endpoint returns service configuration details.
    """
    response = client.get("/api/firebase/status")
    assert response.status_code == 200
    data = response.json()
    assert "firebase_configured" in data
    assert "firestore_database_ready" in data
    assert "supported_features" in data
    assert isinstance(data["supported_features"], list)
    assert len(data["supported_features"]) > 0


def test_firebase_test_connection_endpoint(client: TestClient):
    """
    Verifies the diagnostic connection endpoint executes safely without throwing unhandled exceptions.
    """
    response = client.post("/api/firebase/test-connection")
    assert response.status_code == 200
    data = response.json()
    assert "connected" in data
    assert "status" in data
    assert "message" in data


def test_firebase_sync_all_requires_auth(client: TestClient):
    """
    Verifies that catalog sync to Firestore requires user authentication.
    """
    response = client.post("/api/firebase/sync-all")
    assert response.status_code == 401


def test_firebase_services_fail_safe_when_unconfigured():
    """
    Verifies that Firebase sync functions gracefully handle offline or unconfigured states without crashing.
    """
    # Safe item sync
    res_item = sync_item_to_firestore({"id": 999999, "title": "Test Safe Sync", "category": "Electronics"})
    assert isinstance(res_item, bool)

    # Safe claim sync
    res_claim = sync_claim_to_firestore({"id": 888888, "item_id": 999999, "claimant_id": 1, "status": "PENDING"})
    assert isinstance(res_claim, bool)

    # Diagnostic test returns dict
    res_diag = run_test_firestore_connection()
    assert isinstance(res_diag, dict)
    assert "status" in res_diag
