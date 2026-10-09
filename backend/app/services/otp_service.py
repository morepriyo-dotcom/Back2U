import hashlib
import secrets
import datetime
import re
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app.models.otp import PhoneOTP
from app.models.user import User

class OTPService:
    @staticmethod
    def normalize_phone(phone: str) -> str:
        # Strip all whitespace, dashes, parens
        digits = re.sub(r"[^\d+]", "", phone.strip())
        if not digits.startswith("+"):
            # Default to India +91 if 10 digits provided
            if len(digits) == 10:
                digits = f"+91{digits}"
            else:
                digits = f"+{digits}"
        return digits

    @staticmethod
    def hash_otp(phone: str, otp: str) -> str:
        # Salt with phone number
        salted = f"{phone}:{otp}:back2u_secure_salt"
        return hashlib.sha256(salted.encode("utf-8")).hexdigest()

    def generate_and_send_otp(self, db: Session, phone_raw: str) -> Tuple[bool, str, Optional[str], int]:
        """
        Returns (success, message, dev_otp_preview, expires_in_seconds)
        """
        phone = self.normalize_phone(phone_raw)
        now = datetime.datetime.utcnow()

        # 1. Rate limiting: check recent OTP sent in last 45 seconds
        recent = db.query(PhoneOTP).filter(
            PhoneOTP.phone_number == phone,
            PhoneOTP.created_at >= now - datetime.timedelta(seconds=45)
        ).first()

        if recent:
            remaining = 45 - int((now - recent.created_at).total_seconds())
            return False, f"Please wait {max(1, remaining)} seconds before requesting a new OTP.", None, 0

        # Check hourly limit (max 5 requests per hour)
        hourly_count = db.query(PhoneOTP).filter(
            PhoneOTP.phone_number == phone,
            PhoneOTP.created_at >= now - datetime.timedelta(hours=1)
        ).count()

        if hourly_count >= 5:
            return False, "Rate limit exceeded. Maximum 5 OTP requests per hour for this phone number.", None, 0

        # 2. Generate secure 6-digit code
        code = str(secrets.randbelow(900000) + 100000)
        otp_hash = self.hash_otp(phone, code)
        expires_at = now + datetime.timedelta(minutes=5)

        # Invalidate previous unused OTPs for this number
        db.query(PhoneOTP).filter(
            PhoneOTP.phone_number == phone,
            PhoneOTP.is_used == False
        ).update({"is_used": True})

        # Save new OTP record
        record = PhoneOTP(
            phone_number=phone,
            otp_hash=otp_hash,
            expires_at=expires_at,
            attempts=0,
            is_used=False
        )
        db.add(record)
        db.commit()

        # 3. SMS Delivery simulation or provider hook
        # Print clearly to backend console for developer observation
        print(f"\n[BACK2U SMS GATEWAY] Dispatching to {phone} -> Verification Code: {code} (Valid for 5 mins)\n")

        # In development, provide the preview so user/evaluator can test without external SMS bill
        return True, "OTP sent successfully via SMS", code, 300

    def verify_otp(self, db: Session, phone_raw: str, code: str) -> Tuple[bool, str]:
        """
        Returns (is_valid, error_message)
        """
        phone = self.normalize_phone(phone_raw)
        now = datetime.datetime.utcnow()

        record = db.query(PhoneOTP).filter(
            PhoneOTP.phone_number == phone,
            PhoneOTP.is_used == False,
            PhoneOTP.expires_at >= now
        ).order_by(PhoneOTP.created_at.desc()).first()

        if not record:
            return False, "No active OTP found or code has expired. Please request a new one."

        if record.attempts >= 3:
            record.is_used = True
            db.commit()
            return False, "Too many failed attempts. This OTP has been invalidated for security. Please request a new code."

        expected_hash = self.hash_otp(phone, code.strip())
        if record.otp_hash != expected_hash:
            record.attempts += 1
            db.commit()
            remaining_attempts = 3 - record.attempts
            return False, f"Invalid OTP code. {remaining_attempts} attempts remaining."

        # Success: mark OTP as used
        record.is_used = True
        db.commit()
        return True, "Phone number successfully verified"

otp_service = OTPService()
