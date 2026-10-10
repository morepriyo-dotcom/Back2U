import os
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

        # 3. SMS Delivery: check for real SMS provider credentials
        sent_real_sms = False

        # Provider A: Fast2SMS (India)
        fast2sms_key = os.getenv("FAST2SMS_API_KEY")
        if fast2sms_key:
            try:
                import httpx
                clean_num = phone.replace("+91", "").replace("+", "")
                resp = httpx.post(
                    "https://www.fast2sms.com/dev/bulkV2",
                    headers={"authorization": fast2sms_key},
                    data={
                        "variables_values": code,
                        "route": "otp",
                        "numbers": clean_num
                    },
                    timeout=5.0
                )
                if resp.status_code == 200:
                    sent_real_sms = True
                    print(f"[FAST2SMS] Successfully dispatched real SMS to {phone}")
            except Exception as e:
                print(f"[FAST2SMS] Dispatch error: {e}")

        # Provider B: Twilio (International)
        twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_from = os.getenv("TWILIO_PHONE_NUMBER")
        if not sent_real_sms and twilio_sid and twilio_token and twilio_from:
            try:
                import httpx
                resp = httpx.post(
                    f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
                    auth=(twilio_sid, twilio_token),
                    data={
                        "From": twilio_from,
                        "To": phone,
                        "Body": f"Your Back2U verification code is: {code}. Valid for 5 minutes."
                    },
                    timeout=5.0
                )
                if resp.status_code in (200, 201):
                    sent_real_sms = True
                    print(f"[TWILIO] Successfully dispatched real SMS to {phone}")
            except Exception as e:
                print(f"[TWILIO] Dispatch error: {e}")

        print(f"\n[BACK2U SMS GATEWAY] Dispatching to {phone} -> Verification Code: {code} (Real SMS Sent: {sent_real_sms})\n")

        if sent_real_sms:
            return True, "Verification code sent to your phone via SMS.", None, 300
        else:
            return True, "OTP dispatched. (Note: External SMS gateway is in Dev Preview mode).", code, 300

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
