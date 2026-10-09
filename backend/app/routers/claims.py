import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.claim import Claim
from app.models.item import Item
from app.models.user import User
from app.schemas.claim import ClaimCreate, ClaimStatusUpdate, ClaimResponse
from app.services.auth_service import get_current_user
from app.services.trust_service import trust_service
from app.services.audit_service import audit_service
from app.config import settings

router = APIRouter(prefix="/api/claims", tags=["Ownership Claims"])

@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def submit_claim(
    claim_in: ClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.is_restricted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has active restrictions due to previous penalty points."
        )

    item = db.query(Item).filter(Item.id == claim_in.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.reporter_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot submit an ownership claim on an item you reported yourself"
        )

    # Check if this user already has an active claim on this item
    existing_user_claim = db.query(Claim).filter(
        Claim.item_id == item.id,
        Claim.claimant_id == current_user.id,
        Claim.status.notin_(["REJECTED", "CLOSED"])
    ).first()
    if existing_user_claim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active claim pending for this item"
        )

    # Check for multiple claimants -> dispute detection
    other_claims_count = db.query(Claim).filter(
        Claim.item_id == item.id,
        Claim.status.notin_(["REJECTED", "CLOSED"])
    ).count()

    is_disputed = other_claims_count > 0

    # Basic heuristic risk scoring (0.0 to 1.0)
    risk = 0.15
    if is_disputed:
        risk += 0.35
    if not claim_in.purchase_receipt_url and not claim_in.serial_number_provided:
        risk += 0.15
    if current_user.penalty_points > 0:
        risk += 0.20
    if len(claim_in.challenge_answers.strip()) < 15:
        risk += 0.20
    risk = min(0.95, risk)

    new_claim = Claim(
        item_id=item.id,
        claimant_id=current_user.id,
        status="SUBMITTED",
        challenge_answers=claim_in.challenge_answers,
        evidence_photos=json.dumps(claim_in.evidence_photos or []),
        purchase_receipt_url=claim_in.purchase_receipt_url,
        serial_number_provided=claim_in.serial_number_provided,
        supporting_notes=claim_in.supporting_notes,
        risk_score=round(risk, 2),
        is_disputed=is_disputed
    )
    db.add(new_claim)

    # Update item status to UNDER_CLAIM
    item.status = "UNDER_CLAIM"
    db.commit()
    db.refresh(new_claim)

    # If now disputed, flag existing claims as disputed too
    if is_disputed:
        db.query(Claim).filter(
            Claim.item_id == item.id,
            Claim.id != new_claim.id
        ).update({"is_disputed": True})
        db.commit()

    audit_service.log_action(
        db=db,
        actor=current_user,
        action="CLAIM_SUBMITTED",
        resource_type="claim",
        resource_id=new_claim.id,
        details=f"Claim submitted for item #{item.id} '{item.title}', risk: {risk}"
    )

    return _format_claim_response(new_claim, current_user)

@router.get("/my")
def get_my_claims(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Claims I submitted
    submitted = db.query(Claim).filter(Claim.claimant_id == current_user.id).order_by(desc(Claim.created_at)).all()
    
    # Claims received on items I reported as finder
    my_item_ids = [i.id for i in current_user.items]
    received = db.query(Claim).filter(Claim.item_id.in_(my_item_ids)).order_by(desc(Claim.created_at)).all() if my_item_ids else []

    return {
        "submitted_claims": [_format_claim_response(c, current_user) for c in submitted],
        "received_claims": [_format_claim_response(c, current_user) for c in received]
    }

@router.get("/{claim_id}")
def get_claim_detail(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    is_claimant = claim.claimant_id == current_user.id
    is_finder = claim.item and claim.item.reporter_id == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_claimant or is_finder or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to view this claim")

    return _format_claim_response(claim, current_user)

@router.put("/{claim_id}/status", response_model=ClaimResponse)
def update_claim_status(
    claim_id: int,
    status_update: ClaimStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    is_finder = claim.item and claim.item.reporter_id == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_finder or is_admin):
        raise HTTPException(status_code=403, detail="Only finder or admin can update claim status")

    target_status = status_update.status.upper()
    valid_statuses = [
        "SUBMITTED", "EVIDENCE_REVIEW", "MORE_EVIDENCE_REQUIRED",
        "MANUAL_REVIEW", "APPROVED", "REJECTED", "HANDOVER_PENDING",
        "RETURN_CONFIRMED", "ESCALATED", "CLOSED"
    ]
    if target_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid claim status: {target_status}")

    # Disputed items cannot be approved unilaterally by finder
    if target_status == "APPROVED" and claim.is_disputed and not is_admin:
        raise HTTPException(
            status_code=400,
            detail="Disputed items with multiple claimants require administrator review before approval."
        )

    claim.status = target_status
    if status_update.admin_notes:
        claim.admin_notes = status_update.admin_notes
    if status_update.rejection_reason:
        claim.rejection_reason = status_update.rejection_reason

    # State machine side-effects
    if target_status == "APPROVED":
        claim.status = "HANDOVER_PENDING"
        claim.item.status = "RECOVERY_IN_PROGRESS"
    elif target_status == "REJECTED":
        # Check if rejected due to false claim
        if status_update.rejection_reason and "fraud" in status_update.rejection_reason.lower():
            trust_service.apply_penalty(
                db=db,
                user=claim.claimant,
                penalty_amount=settings.PENALTY_FALSE_CLAIM,
                reason=f"Rejected claim on item #{claim.item_id}: {status_update.rejection_reason}",
                related_claim_id=claim.id
            )
        # Revert item status if no other active claims
        other_active = db.query(Claim).filter(
            Claim.item_id == claim.item_id,
            Claim.id != claim.id,
            Claim.status.notin_(["REJECTED", "CLOSED"])
        ).first()
        if not other_active:
            claim.item.status = "REPORTED"

    db.commit()
    db.refresh(claim)

    audit_service.log_action(
        db=db,
        actor=current_user,
        action=f"CLAIM_STATUS_{target_status}",
        resource_type="claim",
        resource_id=claim.id,
        details=f"Status set to {target_status} by {current_user.email}. Reason: {status_update.rejection_reason or ''}"
    )

    return _format_claim_response(claim, current_user)

def _format_claim_response(claim: Claim, user: Optional[User]) -> dict:
    is_claimant = user and claim.claimant_id == user.id
    is_finder = user and claim.item and claim.item.reporter_id == user.id
    is_admin = user and user.role == "admin"

    return {
        "id": claim.id,
        "item_id": claim.item_id,
        "claimant_id": claim.claimant_id,
        "status": claim.status,
        "challenge_answers": claim.challenge_answers if (is_claimant or is_finder or is_admin) else None,
        "evidence_photos": claim.evidence_photos,
        "purchase_receipt_url": claim.purchase_receipt_url if (is_claimant or is_finder or is_admin) else None,
        "serial_number_provided": claim.serial_number_provided if (is_claimant or is_finder or is_admin) else None,
        "supporting_notes": claim.supporting_notes,
        "risk_score": claim.risk_score,
        "is_disputed": claim.is_disputed,
        "admin_notes": claim.admin_notes if is_admin else None,
        "rejection_reason": claim.rejection_reason,
        "finder_confirmed": claim.finder_confirmed,
        "owner_confirmed": claim.owner_confirmed,
        "handover_meeting_notes": claim.handover_meeting_notes,
        "handover_date": claim.handover_date,
        "points_awarded": claim.points_awarded,
        "created_at": claim.created_at,
        "updated_at": claim.updated_at,
        "closed_at": claim.closed_at,
        "item_title": claim.item.title if claim.item else None,
        "item_category": claim.item.category if claim.item else None,
        "item_image_url": claim.item.image_url if claim.item else None,
        "item_location": claim.item.location_name if claim.item else None,
        "claimant_name": claim.claimant.full_name if claim.claimant else None,
        "claimant_trust_score": claim.claimant.trust_score if claim.claimant else None,
        "finder_id": claim.item.reporter_id if claim.item else None,
        "finder_name": claim.item.reporter.full_name if claim.item and claim.item.reporter else None
    }
