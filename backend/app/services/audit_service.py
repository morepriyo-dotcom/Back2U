from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.user import User

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        actor: Optional[User],
        action: str,
        resource_type: str,
        resource_id: Optional[int] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        log_entry = AuditLog(
            actor_id=actor.id if actor else None,
            actor_email=actor.email if actor else "system",
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

audit_service = AuditService()
