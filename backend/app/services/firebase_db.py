import os
import datetime
import logging
from typing import Optional, Dict, Any, List
from app.config import settings

logger = logging.getLogger("back2u.firebase_db")

_firestore_client = None
_init_attempted = False

def get_firestore_client():
    """
    Lazily acquires or returns the Firebase Admin Firestore client instance.
    Returns None if Firebase credentials or SDK are not configured.
    """
    global _firestore_client, _init_attempted
    if _firestore_client is not None:
        return _firestore_client

    if _init_attempted:
        return None

    _init_attempted = True
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        # Check if already initialized in auth_service
        try:
            app = firebase_admin.get_app()
        except ValueError:
            # Need to initialize app
            cred_path = settings.FIREBASE_CREDENTIALS_PATH
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                app = firebase_admin.initialize_app(cred)
                logger.info(f"[Firebase DB] Initialized Firebase Admin from {cred_path}")
            elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")):
                app = firebase_admin.initialize_app()
                logger.info("[Firebase DB] Initialized Firebase Admin from GOOGLE_APPLICATION_CREDENTIALS")
            else:
                logger.info("[Firebase DB] No serviceAccountKey.json detected. Firestore client offline.")
                return None

        _firestore_client = firestore.client(app=app)
        logger.info("[Firebase DB] Cloud Firestore database client initialized successfully.")
        return _firestore_client
    except Exception as exc:
        logger.warning(f"[Firebase DB] Could not initialize Firestore client: {exc}")
        return None


def is_firebase_db_ready() -> bool:
    """Returns True if Firebase Firestore client is ready and connected."""
    return get_firestore_client() is not None


def test_firestore_connection() -> Dict[str, Any]:
    """
    Performs an active round-trip read/write test to Firestore.
    Returns status dictionary.
    """
    client = get_firestore_client()
    if not client:
        return {
            "connected": False,
            "status": "NOT_CONFIGURED",
            "message": "Firebase Admin credentials not found. Provide FIREBASE_CREDENTIALS_PATH in backend/.env to connect."
        }

    try:
        ping_ref = client.collection("_back2u_system").document("backend_ping")
        now = datetime.datetime.utcnow().isoformat()
        ping_ref.set({
            "service": "Back2U Backend API",
            "last_ping": now,
            "status": "ONLINE"
        }, merge=True)

        doc = ping_ref.get()
        if doc.exists:
            return {
                "connected": True,
                "status": "ONLINE",
                "message": "Cloud Firestore round-trip read/write succeeded.",
                "last_ping": now
            }
        else:
            return {
                "connected": False,
                "status": "READ_FAILED",
                "message": "Document written but could not be read back."
            }
    except Exception as exc:
        logger.error(f"[Firebase DB] Connection test failed: {exc}")
        return {
            "connected": False,
            "status": "ERROR",
            "message": str(exc)
        }


def sync_item_to_firestore(item_data: Dict[str, Any]) -> bool:
    """
    Synchronizes an item record to Firestore 'items' collection.
    Non-blocking / safe fallback.
    """
    client = get_firestore_client()
    if not client or "id" not in item_data:
        return False

    try:
        doc_id = str(item_data["id"])
        # Format timestamps to ISO strings for Firestore JSON compatibility
        safe_data = {}
        for k, v in item_data.items():
            if isinstance(v, (datetime.datetime, datetime.date)):
                safe_data[k] = v.isoformat()
            elif k in ("private_clues", "text_embedding", "image_embedding"):
                # Omit private clues & raw vector embeddings from public Firestore documents
                continue
            else:
                safe_data[k] = v

        safe_data["synced_at"] = datetime.datetime.utcnow().isoformat()
        client.collection("items").document(doc_id).set(safe_data, merge=True)
        logger.info(f"[Firebase DB] Synced item #{doc_id} to Firestore.")
        return True
    except Exception as exc:
        logger.warning(f"[Firebase DB] Failed to sync item to Firestore: {exc}")
        return False


def sync_claim_to_firestore(claim_data: Dict[str, Any]) -> bool:
    """
    Synchronizes a claim record to Firestore 'claims' collection.
    Non-blocking / safe fallback.
    """
    client = get_firestore_client()
    if not client or "id" not in claim_data:
        return False

    try:
        doc_id = str(claim_data["id"])
        safe_data = {}
        for k, v in claim_data.items():
            if isinstance(v, (datetime.datetime, datetime.date)):
                safe_data[k] = v.isoformat()
            else:
                safe_data[k] = v

        safe_data["synced_at"] = datetime.datetime.utcnow().isoformat()
        client.collection("claims").document(doc_id).set(safe_data, merge=True)
        logger.info(f"[Firebase DB] Synced claim #{doc_id} to Firestore.")
        return True
    except Exception as exc:
        logger.warning(f"[Firebase DB] Failed to sync claim to Firestore: {exc}")
        return False


def sync_notification_to_firestore(user_id: int, notification_data: Dict[str, Any]) -> bool:
    """
    Writes a real-time notification to Firestore user subcollection.
    """
    client = get_firestore_client()
    if not client:
        return False

    try:
        user_doc = client.collection("users").document(str(user_id))
        user_doc.collection("notifications").add({
            **notification_data,
            "created_at": datetime.datetime.utcnow().isoformat(),
            "is_read": False
        })
        return True
    except Exception as exc:
        logger.warning(f"[Firebase DB] Failed to write notification to Firestore: {exc}")
        return False


def sync_user_to_firestore(user_data: Dict[str, Any]) -> bool:
    """
    Synchronizes a user profile record to Firestore 'users' collection.
    Excludes sensitive password hashes.
    """
    client = get_firestore_client()
    if not client or ("id" not in user_data and "email" not in user_data):
        return False

    try:
        doc_id = str(user_data.get("id") or user_data.get("email"))
        safe_data = {}
        for k, v in user_data.items():
            if k in ("hashed_password", "password"):
                continue
            if isinstance(v, (datetime.datetime, datetime.date)):
                safe_data[k] = v.isoformat()
            else:
                safe_data[k] = v

        safe_data["synced_at"] = datetime.datetime.utcnow().isoformat()
        client.collection("users").document(doc_id).set(safe_data, merge=True)
        logger.info(f"[Firebase DB] Synced user #{doc_id} to Firestore.")
        return True
    except Exception as exc:
        logger.warning(f"[Firebase DB] Failed to sync user to Firestore: {exc}")
        return False


def sync_marketplace_request_to_firestore(req_data: Dict[str, Any]) -> bool:
    """
    Synchronizes a marketplace request/bid to Firestore 'marketplace_requests' collection.
    """
    client = get_firestore_client()
    if not client:
        return False

    try:
        doc_id = str(req_data.get("id", f"req_{int(datetime.datetime.utcnow().timestamp())}"))
        safe_data = {}
        for k, v in req_data.items():
            if isinstance(v, (datetime.datetime, datetime.date)):
                safe_data[k] = v.isoformat()
            else:
                safe_data[k] = v

        safe_data["synced_at"] = datetime.datetime.utcnow().isoformat()
        client.collection("marketplace_requests").document(doc_id).set(safe_data, merge=True)
        logger.info(f"[Firebase DB] Synced marketplace request #{doc_id} to Firestore.")
        return True
    except Exception as exc:
        logger.warning(f"[Firebase DB] Failed to sync marketplace request to Firestore: {exc}")
        return False


def sync_recovery_to_firestore(recovery_data: Dict[str, Any]) -> bool:
    """
    Synchronizes a verified recovery handover to Firestore 'recoveries' collection.
    """
    client = get_firestore_client()
    if not client:
        return False

    try:
        doc_id = str(recovery_data.get("claim_id") or recovery_data.get("id"))
        safe_data = {}
        for k, v in recovery_data.items():
            if isinstance(v, (datetime.datetime, datetime.date)):
                safe_data[k] = v.isoformat()
            else:
                safe_data[k] = v

        safe_data["synced_at"] = datetime.datetime.utcnow().isoformat()
        client.collection("recoveries").document(doc_id).set(safe_data, merge=True)
        logger.info(f"[Firebase DB] Synced recovery #{doc_id} to Firestore.")
        return True
    except Exception as exc:
        logger.warning(f"[Firebase DB] Failed to sync recovery to Firestore: {exc}")
        return False

