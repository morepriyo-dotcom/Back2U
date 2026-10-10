import pytest

def test_recovery_requires_approval_first(client, test_users):
    # Create item
    res_item = client.post(
        "/api/items",
        json={
            "report_type": "FOUND",
            "title": "Black Leather Wallet",
            "category": "Wallets and bags",
            "description": "Found near bus stop",
            "location_name": "Bus Stop B",
            "custody_status": "IN_POSSESSION"
        },
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    item_id = res_item.json()["id"]

    # Submit claim
    res_claim = client.post(
        "/api/claims",
        json={"item_id": item_id, "challenge_answers": "Contains student card with ID 2026-X"},
        headers={"Authorization": f"Bearer {test_users['owner_token']}"}
    )
    claim_id = res_claim.json()["id"]

    # Attempt to confirm handover before approval
    res_confirm = client.post(
        f"/api/recovery/{claim_id}/confirm",
        json={"handover_notes": "Attempting early confirmation"},
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res_confirm.status_code == 400
    assert "must be approved" in res_confirm.json()["detail"].lower()

def test_dual_party_handover_and_idempotent_rewards(client, test_users):
    # 1. Report found item (Finder earns +50 report points)
    res_item = client.post(
        "/api/items",
        json={
            "report_type": "FOUND",
            "title": "Sony WH-1000XM5 Headphones",
            "category": "Electronics",
            "description": "Left on desk in Engineering Hall",
            "location_name": "Engineering Hall 101",
            "private_clues": "Small nick on left ear cushion",
            "custody_status": "IN_POSSESSION"
        },
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    item_id = res_item.json()["id"]

    # Check finder points balance before recovery
    res_finder_profile_start = client.get("/api/auth/me", headers={"Authorization": f"Bearer {test_users['finder_token']}"})
    initial_points = res_finder_profile_start.json()["points_balance"]

    # 2. Owner files claim
    res_claim = client.post(
        "/api/claims",
        json={
            "item_id": item_id,
            "challenge_answers": "Small nick on left ear cushion and custom name 'Alex-XM5' in Bluetooth settings",
            "serial_number_provided": "SONY-XM5-8910"
        },
        headers={"Authorization": f"Bearer {test_users['owner_token']}"}
    )
    claim_id = res_claim.json()["id"]

    # 3. Finder approves claim -> moves to HANDOVER_PENDING
    res_approve = client.put(
        f"/api/claims/{claim_id}/status",
        json={"status": "APPROVED"},
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "HANDOVER_PENDING"

    # 4. Finder confirms physical handover
    res_finder_conf = client.post(
        f"/api/recovery/{claim_id}/confirm",
        json={"handover_notes": "Met at Engineering lobby and handed over device"},
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res_finder_conf.status_code == 200
    assert res_finder_conf.json()["finder_confirmed"] is True
    assert res_finder_conf.json()["owner_confirmed"] is False
    assert res_finder_conf.json()["case_status"] == "HANDOVER_PENDING"

    # Verify points NOT yet awarded after only 1 confirmation
    res_finder_mid = client.get("/api/auth/me", headers={"Authorization": f"Bearer {test_users['finder_token']}"})
    assert res_finder_mid.json()["points_balance"] == initial_points

    # 5. Owner confirms physical handover -> Dual confirmation reached!
    res_owner_conf = client.post(
        f"/api/recovery/{claim_id}/confirm",
        json={"handover_notes": "Received headphones in good condition. Thank you!"},
        headers={"Authorization": f"Bearer {test_users['owner_token']}"}
    )
    assert res_owner_conf.status_code == 200
    assert res_owner_conf.json()["finder_confirmed"] is True
    assert res_owner_conf.json()["owner_confirmed"] is True
    assert res_owner_conf.json()["case_status"] == "RETURN_CONFIRMED"

    # Verify Finder earned +150 reward points!
    res_finder_after = client.get("/api/auth/me", headers={"Authorization": f"Bearer {test_users['finder_token']}"})
    assert res_finder_after.json()["points_balance"] == initial_points + 150

    # 6. Idempotency test: Repeat confirmation must NOT award duplicate points
    res_repeat = client.post(
        f"/api/recovery/{claim_id}/confirm",
        json={"handover_notes": "Accidental duplicate click"},
        headers={"Authorization": f"Bearer {test_users['owner_token']}"}
    )
    assert res_repeat.status_code == 200
    res_finder_final = client.get("/api/auth/me", headers={"Authorization": f"Bearer {test_users['finder_token']}"})
    assert res_finder_final.json()["points_balance"] == initial_points + 150 # Still exactly +150, no duplication
