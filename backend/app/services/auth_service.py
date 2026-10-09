import os
import datetime
import bcrypt
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User

security = HTTPBearer(auto_error=False)

# Initialize Firebase Admin SDK if credentials exist
firebase_initialized = False
try:
    import firebase_admin
    from firebase_admin import credentials, auth as fb_auth

    if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        print("[Firebase Admin] Initialized with credentials certificate.")
    elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists(os.getenv("GOOGLE_APPLICATION_CREDENTIALS")):
        firebase_admin.initialize_app()
        firebase_initialized = True
        print("[Firebase Admin] Initialized with application default credentials.")
    else:
        print("[Firebase Admin] No serviceAccountKey.json detected. Local JWT fallback active.")
except Exception as e:
    print(f"[Firebase Admin] Initialization skipped: {e}")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    pw_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_firebase_or_jwt_token(token: str, db: Session) -> Optional[User]:
    """
    Verifies either a Firebase ID Token (via Admin SDK) or Back2U Bearer JWT.
    """
    # 1. Try Firebase Admin ID Token verification if configured
    if firebase_initialized:
        try:
            from firebase_admin import auth as fb_auth
            decoded = fb_auth.verify_id_token(token)
            uid = decoded.get("uid")
            email = decoded.get("email")
            name = decoded.get("name") or email.split("@")[0]

            user = db.query(User).filter((User.firebase_uid == uid) | (User.email == email)).first()
            if not user:
                # Provision new user profile in PostgreSQL
                user = User(
                    firebase_uid=uid,
                    email=email,
                    full_name=name,
                    role="user",
                    trust_score=100,
                    penalty_points=0,
                    points_balance=100
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            elif not user.firebase_uid:
                user.firebase_uid = uid
                db.commit()
                db.refresh(user)
            return user
        except Exception:
            pass # Fall through to local JWT check

    # 2. Local JWT Bearer Token verification
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    except JWTError:
        return None

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not auth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth.credentials
    user = verify_firebase_or_jwt_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or disabled"
        )
    return user

def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not auth:
        return None
    try:
        return verify_firebase_or_jwt_token(auth.credentials, db)
    except Exception:
        return None

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required"
        )
    return current_user
