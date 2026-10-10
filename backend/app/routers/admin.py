from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models.item import Item
from app.models.claim import Claim
from app.models.user import User
from app.models.audit import AuditLog
from app.models.marketplace import AuctionListing
from app.services.auth_service import get_current_admin_user
from app.services.trust_service import trust_service
from app.services.audit_service import audit_service
from app.routers.claims import _format_claim_response

router = APIRouter(prefix="/api/admin", tags=["Administration"])

class AdminClaimAction(BaseModel):
    action: str # 'APPROVE', 'REJECT', 'ESCALATE', 'REQUEST_MORE_EVIDENCE'
    reason: str
    admin_notes: Optional[str] = None

class AdminItemAction(BaseModel):
    action: str # 'FLAG', 'UNFLAG', 'UNCLAIMED_AUCTION', 'UNCLAIMED_DONATION', 'UNCLAIMED_POLICE', 'RETURN_TO_FINDER'
    reason: Optional[str] = None

class AdminPenaltyAction(BaseModel):
    penalty_points: int
    reason: str
    restrict_account: Optional[bool] = False

@router.get("/overview")
def get_admin_overview(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    total_items = db.query(Item).count()
    active_lost = db.query(Item).filter(Item.report_type == "LOST", Item.status != "CLOSED").count()
    active_found = db.query(Item).filter(Item.report_type == "FOUND", Item.status != "CLOSED").count()
    total_returned = db.query(Item).filter(Item.status == "RETURNED").count()
    
    total_claims = db.query(Claim).count()
    disputed_claims = db.query(Claim).filter(Claim.is_disputed == True, Claim.status != "CLOSED").count()
    pending_review_claims = db.query(Claim).filter(Claim.status.in_(["SUBMITTED", "EVIDENCE_REVIEW", "MANUAL_REVIEW"])).count()
    
    total_users = db.query(User).count()
    restricted_users = db.query(User).filter(User.is_restricted == True).count()
    avg_trust = db.query(func.avg(User.trust_score)).scalar() or 100.0

    recovery_rate = (total_returned / max(1, (active_lost + total_returned))) * 100.0

    return {
        "metrics": {
            "total_items": total_items,
            "active_lost": active_lost,
            "active_found": active_found,
            "total_returned": total_returned,
            "recovery_rate_percent": round(recovery_rate, 1),
            "total_claims": total_claims,
            "disputed_claims": disputed_claims,
            "pending_claims": pending_review_claims,
            "total_users": total_users,
            "restricted_users": restricted_users,
            "avg_trust_score": round(avg_trust, 1)
        }
    }

@router.get("/claims")
def get_admin_claims(
    disputed_only: bool = False,
    high_risk_only: bool = False,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    q = db.query(Claim).order_by(desc(Claim.created_at))
    if disputed_only:
        q = q.filter(Claim.is_disputed == True)
    if high_risk_only:
        q = q.filter(Claim.risk_score >= 0.5)

    claims = q.limit(50).all()
    return [_format_claim_response(c, admin) for c in claims]

@router.post("/claims/{claim_id}/resolve")
def resolve_claim(
    claim_id: int,
    action_in: AdminClaimAction,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    act = action_in.action.upper()
    if act == "APPROVE":
        claim.status = "HANDOVER_PENDING"
        claim.item.status = "RECOVERY_IN_PROGRESS"
    elif act == "REJECT":
        claim.status = "REJECTED"
        claim.rejection_reason = action_in.reason
        # Revert item status if no other active claims
        other_active = db.query(Claim).filter(
            Claim.item_id == claim.item_id,
            Claim.id != claim.id,
            Claim.status.notin_(["REJECTED", "CLOSED"])
        ).first()
        if not other_active:
            claim.item.status = "REPORTED"
    elif act == "ESCALATE":
        claim.status = "ESCALATED"
    elif act == "REQUEST_MORE_EVIDENCE":
        claim.status = "MORE_EVIDENCE_REQUIRED"

    claim.admin_notes = f"[{admin.email}] {action_in.reason}. {action_in.admin_notes or ''}"
    db.commit()

    audit_service.log_action(
        db=db,
        actor=admin,
        action=f"ADMIN_CLAIM_{act}",
        resource_type="claim",
        resource_id=claim.id,
        details=f"Admin decision: {act}. Reason: {action_in.reason}"
    )

    return {"message": f"Claim updated to {claim.status}", "claim_id": claim.id}

@router.get("/items")
def get_admin_items(
    flagged_only: bool = False,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    q = db.query(Item).order_by(desc(Item.created_at))
    if flagged_only:
        q = q.filter(Item.is_flagged == True)
    return q.limit(50).all()

@router.post("/items/{item_id}/action")
def take_admin_item_action(
    item_id: int,
    action_in: AdminItemAction,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    act = action_in.action.upper()
    if act == "FLAG":
        item.is_flagged = True
        item.flag_reason = action_in.reason
    elif act == "UNFLAG":
        item.is_flagged = False
        item.flag_reason = None
    elif act == "UNCLAIMED_AUCTION":
        # Check unclaimed waiting period: item must be at least 90 days old (3-6 months review)
        days_active = (datetime.datetime.utcnow() - item.created_at).days
        if days_active < 90 and not item.is_demo_seed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Item has only been reported for {days_active} days. Statutory unclaimed item review begins only after 90–180 days (3–6 months) without a successful claim."
            )

        # Valuable or sensitive items must NOT automatically enter auctions
        valuable_keywords = ["phone", "laptop", "bag", "wallet", "key", "vehicle", "document", "id", "electronic"]
        cat_lower = (item.category or "").lower()
        title_lower = (item.title or "").lower()
        if item.is_govt_id or any(k in cat_lower for k in valuable_keywords) or any(k in title_lower for k in ["iphone", "macbook", "passport", "aadhaar", "pan", "car key"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Valuable personal belongings (phones, bags, car keys, wallets, IDs) cannot be auctioned. They must be surrendered to the appropriate police/statutory authority under applicable legal requirements."
            )

        item.status = "UNCLAIMED_AUCTION"
        # Create auction listing if not exists
        existing_auction = db.query(AuctionListing).filter(AuctionListing.item_id == item.id).first()
        if not existing_auction:
            new_auction = AuctionListing(
                item_id=item.id,
                starting_points=50,
                current_bid_points=50,
                resolution_type="AUCTION",
                admin_approved=True,
                status="ACTIVE",
                end_date=datetime.datetime.utcnow() + datetime.timedelta(days=7)
            )
            db.add(new_auction)
    elif act == "UNCLAIMED_DONATION":
        item.status = "UNCLAIMED_DONATED"
    elif act == "UNCLAIMED_POLICE":
        item.status = "CLOSED"
        item.custody_status = "POLICE"
    elif act == "RETURN_TO_FINDER":
        item.status = "CLOSED"

    db.commit()

    audit_service.log_action(
        db=db,
        actor=admin,
        action=f"ADMIN_ITEM_{act}",
        resource_type="item",
        resource_id=item.id,
        details=f"Admin action: {act}. Reason: {action_in.reason or ''}"
    )

    return {"message": f"Action {act} applied successfully", "item_id": item.id}

@router.get("/users")
def get_admin_users(
    restricted_only: bool = False,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    q = db.query(User).order_by(desc(User.created_at))
    if restricted_only:
        q = q.filter(User.is_restricted == True)
    return q.limit(50).all()

@router.post("/users/{user_id}/penalty")
def apply_admin_penalty(
    user_id: int,
    pen_in: AdminPenaltyAction,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    trust_service.apply_penalty(
        db=db,
        user=target_user,
        penalty_amount=pen_in.penalty_points,
        reason=pen_in.reason
    )

    if pen_in.restrict_account:
        target_user.is_restricted = True
        target_user.restriction_reason = pen_in.reason
        db.commit()

    audit_service.log_action(
        db=db,
        actor=admin,
        action="ADMIN_PENALTY_APPLIED",
        resource_type="user",
        resource_id=target_user.id,
        details=f"Admin {admin.email} applied {pen_in.penalty_points} penalty pts. Reason: {pen_in.reason}"
    )

    return {
        "message": "Penalty applied successfully",
        "user_id": target_user.id,
        "new_trust_score": target_user.trust_score,
        "total_penalty_points": target_user.penalty_points,
        "is_restricted": target_user.is_restricted
    }

@router.get("/audit-logs")
def get_audit_logs(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(100).all()
