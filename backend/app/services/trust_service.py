from sqlalchemy.orm import Session
from app.models.user import User
from app.models.reward import PointTransaction
from app.config import settings

class TrustService:
    @staticmethod
    def award_points(
        db: Session,
        user: User,
        amount: int,
        transaction_type: str,
        description: str,
        related_item_id: int = None,
        related_claim_id: int = None
    ) -> PointTransaction:
        user.points_balance += amount
        # Slight trust score boost on positive contributions (capped at 150)
        if amount > 0 and user.trust_score < 150:
            user.trust_score = min(150, user.trust_score + 2)

        tx = PointTransaction(
            user_id=user.id,
            amount=amount,
            transaction_type=transaction_type,
            description=description,
            related_item_id=related_item_id,
            related_claim_id=related_claim_id
        )
        db.add(tx)
        db.commit()
        db.refresh(user)
        return tx

    @staticmethod
    def apply_penalty(
        db: Session,
        user: User,
        penalty_amount: int,
        reason: str,
        related_claim_id: int = None
    ) -> PointTransaction:
        user.penalty_points += penalty_amount
        user.trust_score = max(0, user.trust_score - penalty_amount)
        # Deduct corresponding points if balance allows
        points_deducted = min(user.points_balance, penalty_amount * 2)
        user.points_balance = max(0, user.points_balance - points_deducted)

        # Check restriction trigger
        if user.penalty_points >= 50 or user.trust_score < 30:
            user.is_restricted = True
            user.restriction_reason = f"Automated anti-fraud threshold reached: {reason}"

        tx = PointTransaction(
            user_id=user.id,
            amount=-points_deducted,
            transaction_type="PENALTY_DEDUCTION",
            description=f"Penalty applied: {reason} (+{penalty_amount} penalty pts)",
            related_claim_id=related_claim_id
        )
        db.add(tx)
        db.commit()
        db.refresh(user)
        return tx

    @staticmethod
    def get_user_tier(points: int) -> str:
        if points >= 1000:
            return "Platinum Legend"
        elif points >= 500:
            return "Gold Guardian"
        elif points >= 200:
            return "Silver Finder"
        return "Bronze Helper"

trust_service = TrustService()
