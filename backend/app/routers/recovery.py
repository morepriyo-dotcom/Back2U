import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.claim import Claim
from app.models.user import User
from app.schemas.claim import HandoverConfirm, ClaimResponse
from app.services.auth_service import get_current_user
from app.services.trust_service import trust_service
from app.services.audit_service import audit_service
from app.config import settings
from app.routers.claims import _format_claim_response

router = APIRouter(prefix="/api/recovery", tags=["Recovery Tracking"])

@router.get("/{claim_id}")
def get_recovery_case(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Recovery case not found")

    is_claimant = claim.claimant_id == current_user.id
    is_finder = claim.item and claim.item.reporter_id == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_claimant or is_finder or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to access this recovery case")

    # Generate step-by-step timeline
    steps = [
        {"title": "Claim Submitted", "status": "completed", "date": claim.created_at.strftime("%b %d, %Y")},
        {
            "title": "Evidence Verification",
            "status": "completed" if claim.status in ["APPROVED", "HANDOVER_PENDING", "RETURN_CONFIRMED", "CLOSED"] else ("in-progress" if claim.status in ["SUBMITTED", "EVIDENCE_REVIEW", "MANUAL_REVIEW"] else "pending"),
            "date": "Verified by Finder / Admin" if claim.status in ["APPROVED", "HANDOVER_PENDING", "RETURN_CONFIRMED", "CLOSED"] else "Pending verification"
        },
        {
            "title": "Handover Coordination",
            "status": "completed" if claim.status in ["RETURN_CONFIRMED", "CLOSED"] else ("in-progress" if claim.status in ["APPROVED", "HANDOVER_PENDING"] else "pending"),
            "date": "Coordinate safe meeting place"
        },
        {
            "title": "Dual-Party Return Confirmation",
            "status": "completed" if (claim.finder_confirmed and claim.owner_confirmed) else ("in-progress" if (claim.finder_confirmed or claim.owner_confirmed) else "pending"),
            "date": f"Finder: {'Confirmed' if claim.finder_confirmed else 'Pending'} | Owner: {'Confirmed' if claim.owner_confirmed else 'Pending'}"
        },
        {
            "title": "Points & Reputation Awarded",
            "status": "completed" if claim.points_awarded else "pending",
            "date": "+150 Back2U Points for Finder"
        }
    ]

    return {
        "case": _format_claim_response(claim, current_user),
        "steps": steps,
        "is_finder": is_finder,
        "is_claimant": is_claimant,
        "is_admin": is_admin
    }

@router.post("/{claim_id}/confirm")
def confirm_recovery_handover(
    claim_id: int,
    confirm_in: HandoverConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Recovery case not found")

    is_claimant = claim.claimant_id == current_user.id
    is_finder = claim.item and claim.item.reporter_id == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_claimant or is_finder or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to confirm handover for this case")

    if is_finder or is_admin:
        claim.finder_confirmed = True
    if is_claimant or is_admin:
        claim.owner_confirmed = True

    if confirm_in.handover_notes:
        claim.handover_meeting_notes = confirm_in.handover_notes
    claim.handover_date = datetime.datetime.utcnow()

    # If both sides confirmed (or admin confirms on behalf of participants)
    if (claim.finder_confirmed and claim.owner_confirmed) or is_admin:
        claim.status = "RETURN_CONFIRMED"
        claim.item.status = "RETURNED"
        claim.closed_at = datetime.datetime.utcnow()

        # Award +150 Points to the Finder!
        if not claim.points_awarded and claim.item.reporter:
            finder_user = claim.item.reporter
            trust_service.award_points(
                db=db,
                user=finder_user,
                amount=settings.POINTS_RECOVERY_CONFIRMED,
                transaction_type="RETURN_COMPLETED_REWARD",
                description=f"Reward for successfully returning item '{claim.item.title}' to verified owner",
                related_item_id=claim.item.id,
                related_claim_id=claim.id
            )
            claim.points_awarded = True

        audit_service.log_action(
            db=db,
            actor=current_user,
            action="RECOVERY_COMPLETED",
            resource_type="claim",
            resource_id=claim.id,
            details=f"Item #{claim.item_id} successfully reunited and returned"
        )

    db.commit()
    db.refresh(claim)

    return {
        "message": "Handover confirmation recorded successfully",
        "finder_confirmed": claim.finder_confirmed,
        "owner_confirmed": claim.owner_confirmed,
        "case_status": claim.status
    }
