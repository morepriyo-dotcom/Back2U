import pytest
from app.config import settings

def test_user_registration_success(client):
    payload = {
        "email": "newuser@test.org",
        "full_name": "New Test User",
        "password": "SecurePassword123!"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@test.org"
    assert data["user"]["points_balance"] == 100 # Welcome bonus

def test_duplicate_email_registration_fails(client, test_users):
    payload = {
        "email": test_users["finder"].email,
        "full_name": "Duplicate User",
        "password": "Password123!"
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

def test_login_success_and_failure(client, test_users):
    # Valid credentials
    res_valid = client.post("/api/auth/login", json={
        "email": test_users["finder"].email,
        "password": "Password123!"
    })
    assert res_valid.status_code == 200
    assert "access_token" in res_valid.json()

    # Invalid password
    res_invalid = client.post("/api/auth/login", json={
        "email": test_users["finder"].email,
        "password": "WrongPassword!"
    })
    assert res_invalid.status_code == 401
    assert "Invalid email or password" in res_invalid.json()["detail"]

def test_security_headers_enforced(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "strict-origin" in res.headers.get("Referrer-Policy")
    assert "max-age=31536000" in res.headers.get("Strict-Transport-Security")

def test_admin_route_requires_admin_role(client, test_users):
    # Regular user attempting admin endpoint
    res_regular = client.get(
        "/api/admin/overview",
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res_regular.status_code == 403

    # Admin user accessing admin endpoint
    res_admin = client.get(
        "/api/admin/overview",
        headers={"Authorization": f"Bearer {test_users['admin_token']}"}
    )
    assert res_admin.status_code == 200
    assert "total_items" in res_admin.json()["metrics"]

def test_demo_login_disabled_in_production(client, monkeypatch):
    monkeypatch.setattr(settings, "ENABLE_DEMO_LOGIN", False)
    res = client.post("/api/auth/demo-login", json={"role": "admin"})
    assert res.status_code == 403
    assert "disabled" in res.json()["detail"].lower()
