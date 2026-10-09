from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User
from app.models.reward import PointTransaction
from app.models.item import Item
from app.schemas.reward import RewardsSummaryResponse, PointTransactionResponse
from app.services.auth_service import get_current_user
from app.services.trust_service import trust_service

router = APIRouter(prefix="/api/rewards", tags=["Rewards & Points"])

@router.get("/summary", response_model=RewardsSummaryResponse)
def get_rewards_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_reported = db.query(Item).filter(Item.reporter_id == current_user.id).count()
    total_returned = db.query(Item).filter(
        Item.reporter_id == current_user.id,
        Item.status == "RETURNED"
    ).count()

    tier = trust_service.get_user_tier(current_user.points_balance)

    return RewardsSummaryResponse(
        points_balance=current_user.points_balance,
        trust_score=current_user.trust_score,
        penalty_points=current_user.penalty_points,
        tier_name=tier,
        total_items_returned=total_returned,
        total_items_reported=total_reported
    )

@router.get("/transactions", response_model=List[PointTransactionResponse])
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(PointTransaction).filter(
        PointTransaction.user_id == current_user.id
    ).order_by(desc(PointTransaction.created_at)).all()
