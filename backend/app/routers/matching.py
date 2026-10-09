from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.item import Item
from app.ai.matching_engine import matching_engine

router = APIRouter(prefix="/api/matching", tags=["AI Matching"])

@router.get("/item/{item_id}")
def get_ai_matches(item_id: int, db: Session = Depends(get_db)):
    """
    Executes the multi-modal AI matching pipeline for a specific item.
    Retrieves candidates of opposite status (LOST vs FOUND) and calculates
    ranked similarity scores using image, text, location and date proximity.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    opposite_type = "FOUND" if item.report_type == "LOST" else "LOST"
    candidates = db.query(Item).filter(
        Item.report_type == opposite_type,
        Item.status.in_(["REPORTED", "UNDER_CLAIM", "RECOVERY_IN_PROGRESS"]),
        Item.is_flagged == False
    ).all()

    ranked_matches = matching_engine.rank_candidates(query_item=item, candidate_items=candidates)

    return {
        "query_item": {
            "id": item.id,
            "title": item.title,
            "category": item.category,
            "report_type": item.report_type,
            "location_name": item.location_name
        },
        "total_potential_matches": len(ranked_matches),
        "matches": ranked_matches
    }
