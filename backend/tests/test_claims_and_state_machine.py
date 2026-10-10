import pytest
from app.models.item import Item

def _create_found_item(client, finder_token, private_clues="Blue butterfly sticker on back"):
    res = client.post(
        "/api/items",
        json={
            "report_type": "FOUND",
            "title": "Silver Apple MacBook Air",
            "category": "Electronics",
            "description": "Found in library 2nd floor silent study area",
            "location_name": "Main Campus Library",
            "private_clues": private_clues,
            "custody_status": "IN_POSSESSION"
        },
        headers={"Authorization": f"Bearer {finder_token}"}
    )
    assert res.status_code == 201
    return res.json()

def test_private_clues_never_leak_to_public(client, test_users):
    secret_clue = "Secret engraving: Initials 'MK' under bottom hinge"
    item_data = _create_found_item(client, test_users["finder_token"], private_clues=secret_clue)
    item_id = item_data["id"]

    # 1. Unauthenticated viewer
    res_anon = client.get(f"/api/items/{item_id}")
    assert res_anon.status_code == 200
    assert res_anon.json()["private_clues"] is None
    assert res_anon.json()["has_private_clues"] is True

    # 2. Potential claimant viewer
    res_claimant = client.get(
        f"/api/items/{item_id}",
        headers={"Authorization": f"Bearer {test_users['owner_token']}"}
    )
    assert res_claimant.status_code == 200
    assert res_claimant.json()["private_clues"] is None

    # 3. Finder viewer (authorized)
    res_finder = client.get(
        f"/api/items/{item_id}",
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res_finder.status_code == 200
    assert res_finder.json()["private_clues"] == secret_clue

def test_self_claim_prohibited(client, test_users):
    item = _create_found_item(client, test_users["finder_token"])
    res = client.post(
        "/api/claims",
        json={
            "item_id": item["id"],
            "challenge_answers": "I claim this item",
            "serial_number_provided": "ABC-123"
        },
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res.status_code == 400
    assert "yourself" in res.json()["detail"].lower()

def test_duplicate_active_claim_prohibited(client, test_users):
    item = _create_found_item(client, test_users["finder_token"])
    claim_payload = {
        "item_id": item["id"],
        "challenge_answers": "It has a scratch on the top corner and my name is on the sticker.",
        "serial_number_provided": "SN9928172"
    }

    # First claim succeeds
    res1 = client.post(
        "/api/claims",
        json=claim_payload,
        headers={"Authorization": f"Bearer {test_users['owner_token']}"}
    )
    assert res1.status_code == 201

    # Second active claim by same user fails
    res2 = client.post(
        "/api/claims",
        json=claim_payload,
        headers={"Authorization": f"Bearer {test_users['owner_token']}"}
    )
    assert res2.status_code == 400
    assert "already have an active claim" in res2.json()["detail"].lower()

def test_dispute_detected_when_multiple_claimants_submit(client, test_users):
    item = _create_found_item(client, test_users["finder_token"])

    # Claimant 1
    res1 = client.post(
        "/api/claims",
        json={"item_id": item["id"], "challenge_answers": "I lost this laptop yesterday afternoon."},
        headers={"Authorization": f"Bearer {test_users['owner_token']}"}
    )
    assert res1.status_code == 201
    claim1_id = res1.json()["id"]

    # Claimant 2 (different user)
    res2 = client.post(
        "/api/claims",
        json={"item_id": item["id"], "challenge_answers": "This is definitely my laptop, I have the receipt."},
        headers={"Authorization": f"Bearer {test_users['claimant2_token']}"}
    )
    assert res2.status_code == 201
    assert res2.json()["is_disputed"] is True

    # Finder cannot unilaterally approve a disputed claim
    res_finder_approve = client.put(
        f"/api/claims/{claim1_id}/status",
        json={"status": "APPROVED"},
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res_finder_approve.status_code in [400, 403]
    assert "disputed" in res_finder_approve.json()["detail"].lower()

    # Admin CAN adjudicate a disputed claim
    res_admin_approve = client.put(
        f"/api/claims/{claim1_id}/status",
        json={"status": "APPROVED", "admin_notes": "Verified receipt against laptop serial number"},
        headers={"Authorization": f"Bearer {test_users['admin_token']}"}
    )
    assert res_admin_approve.status_code == 200
    assert res_admin_approve.json()["status"] == "HANDOVER_PENDING"

def test_invalid_state_machine_transition_blocked(client, test_users):
    item = _create_found_item(client, test_users["finder_token"])
    res = client.post(
        "/api/claims",
        json={"item_id": item["id"], "challenge_answers": "Ownership evidence details"},
        headers={"Authorization": f"Bearer {test_users['owner_token']}"}
    )
    claim_id = res.json()["id"]

    # Invalid jump from SUBMITTED directly to RETURN_CONFIRMED
    res_invalid = client.put(
        f"/api/claims/{claim_id}/status",
        json={"status": "RETURN_CONFIRMED"},
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res_invalid.status_code == 400
    assert "Invalid state transition" in res_invalid.json()["detail"]
