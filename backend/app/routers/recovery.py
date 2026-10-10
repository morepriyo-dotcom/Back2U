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

    if claim.status not in ["APPROVED", "HANDOVER_PENDING", "RETURN_CONFIRMED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot confirm handover for claim in '{claim.status}' state. Evidence must be approved and handover pending."
        )

    # Idempotent response if already confirmed
    if claim.status == "RETURN_CONFIRMED" and claim.finder_confirmed and claim.owner_confirmed:
        return {
            "message": "Handover was already completed and confirmed",
            "finder_confirmed": True,
            "owner_confirmed": True,
            "case_status": "RETURN_CONFIRMED"
        }

    if is_finder:
        claim.finder_confirmed = True
    if is_claimant:
        claim.owner_confirmed = True
    if is_admin:
        claim.finder_confirmed = True
        claim.owner_confirmed = True

    if confirm_in.handover_notes:
        claim.handover_meeting_notes = confirm_in.handover_notes
    claim.handover_date = datetime.datetime.utcnow()

    # Handover is complete only when both parties have confirmed (or admin override)
    both_confirmed = claim.finder_confirmed and claim.owner_confirmed
    if both_confirmed:
        claim.status = "RETURN_CONFIRMED"
        claim.item.status = "RETURNED"
        claim.closed_at = datetime.datetime.utcnow()

        # Check if verified ownership proof was submitted
        has_verified_proof = bool(
            (claim.serial_number_provided and len(claim.serial_number_provided.strip()) >= 4)
            or claim.purchase_receipt_url
            or (claim.challenge_answers and len(claim.challenge_answers.strip()) >= 15)
        )

        # Award points to Finder strictly once if verified ownership proof was provided
        # In-person return without submitted proof is allowed, but awards 0 Back2U Points
        if not claim.points_awarded and claim.item.reporter and has_verified_proof:
            claim.points_awarded = True
            finder_user = claim.item.reporter
            trust_service.award_points(
                db=db,
                user=finder_user,
                amount=settings.POINTS_RECOVERY_CONFIRMED,
                transaction_type="RETURN_COMPLETED_REWARD",
                description=f"Reward for verified documented recovery of item '{claim.item.title}'",
                related_item_id=claim.item.id,
                related_claim_id=claim.id
            )
        else:
            # Documented return without proof: 0 points awarded
            claim.points_awarded = False

        audit_service.log_action(
            db=db,
            actor=current_user,
            action="RECOVERY_COMPLETED",
            resource_type="claim",
            resource_id=claim.id,
            details=f"Item #{claim.item_id} successfully reunited and returned via dual-confirmation"
        )

    db.commit()
    db.refresh(claim)

    try:
        from app.services.firebase_db import sync_recovery_to_firestore
        sync_recovery_to_firestore({
            "claim_id": claim.id,
            "item_id": claim.item_id,
            "status": claim.status,
            "finder_confirmed": claim.finder_confirmed,
            "owner_confirmed": claim.owner_confirmed,
            "handover_notes": claim.handover_meeting_notes,
            "handover_date": claim.handover_date
        })
    except Exception:
        pass

    return {
        "message": "Handover confirmation recorded successfully" if both_confirmed else "Confirmation recorded. Awaiting confirmation from other party.",
        "finder_confirmed": claim.finder_confirmed,
        "owner_confirmed": claim.owner_confirmed,
        "case_status": claim.status
    }
