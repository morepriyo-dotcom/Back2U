import os
import io
import secrets
import datetime
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from app.config import settings
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/upload", tags=["Uploads"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Protected file upload endpoint.
    Requires authentication, validates file extension and deep content image signature,
    enforces size limits, and assigns cryptographically secure unique filenames.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing filename")

    # 1. Validate extension (no SVGs to prevent stored XSS)
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed image formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # 2. Check content size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum {settings.MAX_UPLOAD_SIZE_MB}MB limit"
        )
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File cannot be empty")

    # 3. Deep content verification: parse magic bytes & image signature
    try:
        with Image.open(io.BytesIO(content)) as img:
            img.verify()
            detected_format = img.format
            if detected_format not in ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid image structure. Detected format: {detected_format}"
                )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match a valid image signature or is corrupted."
        )

    # 4. Generate cryptographically safe random filename
    unique_name = f"{secrets.token_hex(16)}{ext}"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    dest_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    with open(dest_path, "wb") as f:
        f.write(content)

    # Sync upload record to Firestore
    try:
        from app.services.firebase_db import get_firestore_client
        client = get_firestore_client()
        if client:
            client.collection("uploads").document(unique_name).set({
                "filename": unique_name,
                "url": f"/uploads/{unique_name}",
                "uploader_id": current_user.id,
                "content_type": f"image/{detected_format.lower()}",
                "size": len(content),
                "uploaded_at": datetime.datetime.utcnow().isoformat()
            }, merge=True)
    except Exception:
        pass

    return {
        "url": f"/uploads/{unique_name}",
        "filename": unique_name,
        "content_type": f"image/{detected_format.lower()}",
        "size": len(content)
    }

