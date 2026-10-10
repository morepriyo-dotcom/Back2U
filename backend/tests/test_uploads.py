import io
from PIL import Image

def _create_test_image_bytes(format="PNG") -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (32, 32), color=(73, 109, 137))
    img.save(buf, format=format)
    return buf.getvalue()

def test_upload_requires_authentication(client):
    img_bytes = _create_test_image_bytes("PNG")
    res = client.post(
        "/api/upload",
        files={"file": ("photo.png", img_bytes, "image/png")}
    )
    assert res.status_code == 401

def test_upload_svg_rejected_for_xss_protection(client, test_users):
    svg_payload = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"
    res = client.post(
        "/api/upload",
        files={"file": ("vector.svg", svg_payload, "image/svg+xml")},
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res.status_code == 400
    assert "Unsupported file type" in res.json()["detail"]

def test_upload_fake_image_magic_bytes_rejected(client, test_users):
    # A text/script file masquerading as a .png
    fake_payload = b"#!/bin/bash\necho 'malicious executable masquerading as image'"
    res = client.post(
        "/api/upload",
        files={"file": ("malicious.png", fake_payload, "image/png")},
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res.status_code == 400
    assert "image signature" in res.json()["detail"].lower()

def test_upload_valid_image_succeeds_with_safe_random_name(client, test_users):
    valid_bytes = _create_test_image_bytes("JPEG")
    res = client.post(
        "/api/upload",
        files={"file": ("my_camera_photo.jpeg", valid_bytes, "image/jpeg")},
        headers={"Authorization": f"Bearer {test_users['finder_token']}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["url"].startswith("/uploads/")
    assert data["content_type"] == "image/jpeg"
    # Filename must be random hex, not original filename
    assert data["filename"] != "my_camera_photo.jpeg"
    assert len(data["filename"]) > 20
