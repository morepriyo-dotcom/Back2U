import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.item import Item
from app.models.user import User
from app.services.auth_service import get_current_user_optional, get_current_user
from app.services.firebase_db import (
    is_firebase_db_ready,
    test_firestore_connection,
    sync_item_to_firestore,
    get_firestore_client
)
from app.config import settings

router = APIRouter(prefix="/api/firebase", tags=["Firebase Database"])

@router.get("/status")
def get_firebase_status():
    """
    Returns the real-time configuration and connectivity status of Firebase services.
    """
    cred_path_configured = bool(settings.FIREBASE_CREDENTIALS_PATH)
    cred_file_exists = os.path.exists(settings.FIREBASE_CREDENTIALS_PATH) if cred_path_configured else False
    adc_configured = bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")))

    db_ready = is_firebase_db_ready()

    return {
        "firebase_configured": cred_file_exists or adc_configured,
        "firestore_database_ready": db_ready,
        "credentials_path": settings.FIREBASE_CREDENTIALS_PATH if cred_path_configured else None,
        "credentials_file_found": cred_file_exists,
        "application_default_credentials": adc_configured,
        "service": "Google Cloud Firestore & Firebase Auth",
        "supported_features": [
            "Realtime Item Discovery",
            "Live Ownership Claim Submissions",
            "Instant In-App Direct Chat",
            "Realtime User Notifications",
            "Cloud Firestore Sync"
        ],
        "instructions": (
            "To connect your Firebase project, download your serviceAccountKey.json from "
            "Firebase Console -> Project Settings -> Service accounts, save it as serviceAccountKey.json, "
            "and set FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json in backend/.env. "
            "Also set VITE_FIREBASE_* in frontend/.env for web real-time features."
        ) if not db_ready else "Firebase Cloud Firestore is active and ready."
    }

@router.post("/test-connection")
def run_firebase_connection_test(current_user: Optional[User] = Depends(get_current_user_optional)):
    """
    Tests live read/write latency to Google Cloud Firestore.
    """
    result = test_firestore_connection()
    return result

@router.post("/sync-all")
def sync_all_items_to_firestore(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synchronizes all active items from the relational database into Firebase Cloud Firestore.
    Requires authenticated user.
    """
    if not is_firebase_db_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Firestore is not initialized. Please configure credentials in backend/.env."
        )

    items = db.query(Item).filter(Item.is_flagged == False).all()
    synced_count = 0

    for item in items:
        ok = sync_item_to_firestore({
            "id": item.id,
            "report_type": item.report_type,
            "title": item.title,
            "category": item.category,
            "description": item.description,
            "location_name": item.location_name,
            "latitude": item.latitude,
            "longitude": item.longitude,
            "incident_date": item.incident_date,
            "image_url": item.image_url,
            "brand": item.brand,
            "model": item.model,
            "custody_status": item.custody_status,
            "status": item.status,
            "lr_number": item.lr_number,
            "is_govt_id": item.is_govt_id,
            "govt_id_type": item.govt_id_type,
            "masked_identifier": item.masked_identifier,
            "created_at": item.created_at,
            "reporter_id": item.reporter_id,
        })
        if ok:
            synced_count += 1

    return {
        "status": "COMPLETED",
        "total_items": len(items),
        "synced_count": synced_count,
        "message": f"Successfully synchronized {synced_count} items to Cloud Firestore collection 'items'."
    }
