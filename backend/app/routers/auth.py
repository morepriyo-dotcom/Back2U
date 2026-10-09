from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, TokenResponse, 
    DemoLoginRequest, FirebaseLoginRequest,
    SendOTPRequest, VerifyOTPRequest, OTPResponse
)
from app.services.auth_service import get_password_hash, verify_password, create_access_token, get_current_user
from app.services.otp_service import otp_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/phone/send-otp", response_model=OTPResponse)
def send_phone_otp(req: SendOTPRequest, db: Session = Depends(get_db)):
    """
    Sends a 6-digit SMS OTP to the provided phone number.
    Applies strict rate limiting (max 1 per 45s, max 5 per hour).
    """
    if not req.phone_number or len(req.phone_number.strip()) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid mobile phone number."
        )

    success, msg, dev_code, expires_sec = otp_service.generate_and_send_otp(db, req.phone_number)
    if not success:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=msg)

    norm_phone = otp_service.normalize_phone(req.phone_number)
    return OTPResponse(
        message=msg,
        phone_number=norm_phone,
        expires_in_seconds=expires_sec,
        dev_sms_simulation=f"Back2U Security Verification Code: {dev_code}. Valid for 5 minutes. Do not share this OTP."
    )

@router.post("/phone/verify-otp", response_model=TokenResponse)
def verify_phone_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verifies SMS OTP code and provisions or logs in the user session.
    """
    if not req.otp_code or len(req.otp_code.strip()) != 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code must be exactly 6 digits."
        )

    norm_phone = otp_service.normalize_phone(req.phone_number)
    is_valid, err_msg = otp_service.verify_otp(db, norm_phone, req.otp_code)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # Check if user with this phone number already exists
    user = db.query(User).filter(User.phone_number == norm_phone).first()

    if not user:
        # Create new verified phone user
        name = req.full_name.strip() if (req.full_name and req.full_name.strip()) else f"User {norm_phone[-4:]}"
        synthetic_email = f"phone_{norm_phone.replace('+', '')}@back2u.org"
        user = User(
            phone_number=norm_phone,
            email=synthetic_email,
            full_name=name,
            avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={name}",
            role="user",
            is_phone_verified=True,
            is_email_verified=False,
            trust_score=100,
            penalty_points=0,
            points_balance=100 # Welcome bonus
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        audit_service.log_action(
            db=db,
            actor=user,
            action="USER_PHONE_REGISTERED",
            resource_type="user",
            resource_id=user.id,
            details=f"New user registered with verified phone {norm_phone}"
        )
    else:
        # Existing user logging in via phone
        user.is_phone_verified = True
        db.commit()
        db.refresh(user)

        audit_service.log_action(
            db=db,
            actor=user,
            action="USER_PHONE_LOGIN",
            resource_type="user",
            resource_id=user.id,
            details=f"User logged in with verified phone {norm_phone}"
        )

    token = create_access_token({"sub": str(user.id), "phone": user.phone_number, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if user_in.email:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists"
            )

    norm_phone = otp_service.normalize_phone(user_in.phone_number) if user_in.phone_number else None
    if norm_phone:
        existing_phone = db.query(User).filter(User.phone_number == norm_phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this mobile number already exists"
            )
    
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        phone_number=norm_phone,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd,
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={user_in.full_name}",
        role="user",
        is_email_verified=bool(user_in.email),
        is_phone_verified=False,
        trust_score=100,
        penalty_points=0,
        points_balance=100 # Welcome bonus
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    audit_service.log_action(
        db=db,
        actor=user,
        action="USER_EMAIL_REGISTERED",
        resource_type="user",
        resource_id=user.id,
        details=f"User registered with email {user.email}"
    )

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/demo-login", response_model=TokenResponse)
def demo_login(req: DemoLoginRequest, db: Session = Depends(get_db)):
    """
    Convenient one-click development demo login for testing predefined personas.
    """
    role_map = {
        "admin": "admin@back2u.org",
        "finder": "rohan@back2u.org",
        "owner": "priya@back2u.org",
        "claimant": "vikram@back2u.org",
        "user": "rohan@back2u.org",
    }
    target_email = role_map.get(req.role.lower(), "rohan@back2u.org")
    user = db.query(User).filter(User.email == target_email).first()
    
    if not user:
        user = db.query(User).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="No demo users seeded yet. Please restart server to seed data.")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/firebase-login", response_model=TokenResponse)
def firebase_login(req: FirebaseLoginRequest, db: Session = Depends(get_db)):
    from app.services.auth_service import verify_firebase_or_jwt_token
    user = verify_firebase_or_jwt_token(req.id_token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or unverified Firebase ID token"
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
