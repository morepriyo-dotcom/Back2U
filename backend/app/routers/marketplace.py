import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.item import Item
from app.models.user import User
from app.models.marketplace import RequestToBuy, AuctionListing
from app.schemas.marketplace import (
    RequestToBuyCreate, RequestToBuyResponse,
    AuctionListingResponse, BidCreate
)
from app.services.auth_service import get_current_user
from app.services.trust_service import trust_service

router = APIRouter(prefix="/api/marketplace", tags=["Marketplace & Auctions"])

@router.get("/unclaimed", response_model=List[AuctionListingResponse])
def get_marketplace_listings(db: Session = Depends(get_db)):
    """
    Returns eligible unclaimed items approved for Back2U Auction.
    """
    listings = db.query(AuctionListing).filter(
        AuctionListing.status == "ACTIVE",
        AuctionListing.admin_approved == True
    ).order_by(desc(AuctionListing.created_at)).all()

    results = []
    for l in listings:
        results.append(AuctionListingResponse(
            id=l.id,
            item_id=l.item_id,
            item_title=l.item.title if l.item else "Unknown Item",
            item_category=l.item.category if l.item else "General",
            item_image_url=l.item.image_url if l.item else None,
            starting_points=l.starting_points,
            current_bid_points=l.current_bid_points,
            current_highest_bidder_id=l.current_highest_bidder_id,
            resolution_type=l.resolution_type,
            admin_approved=l.admin_approved,
            status=l.status,
            end_date=l.end_date,
            created_at=l.created_at
        ))
    return results

@router.post("/request-to-buy", response_model=RequestToBuyResponse, status_code=status.HTTP_201_CREATED)
def create_request_to_buy(
    req_in: RequestToBuyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == req_in.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.reporter_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request to buy your own reported item")

    new_req = RequestToBuy(
        item_id=item.id,
        requester_id=current_user.id,
        offer_amount=req_in.offer_amount,
        currency_type=req_in.currency_type,
        message=req_in.message,
        status="PENDING"
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    return RequestToBuyResponse(
        id=new_req.id,
        item_id=new_req.item_id,
        requester_id=new_req.requester_id,
        requester_name=current_user.full_name,
        offer_amount=new_req.offer_amount,
        currency_type=new_req.currency_type,
        message=new_req.message,
        status=new_req.status,
        finder_response=new_req.finder_response,
        created_at=new_req.created_at,
        item_title=item.title,
        item_image_url=item.image_url
    )

@router.get("/my-requests", response_model=List[RequestToBuyResponse])
def get_my_requests_to_buy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reqs = db.query(RequestToBuy).filter(
        RequestToBuy.requester_id == current_user.id
    ).order_by(desc(RequestToBuy.created_at)).all()

    results = []
    for r in reqs:
        results.append(RequestToBuyResponse(
            id=r.id,
            item_id=r.item_id,
            requester_id=r.requester_id,
            requester_name=current_user.full_name,
            offer_amount=r.offer_amount,
            currency_type=r.currency_type,
            message=r.message,
            status=r.status,
            finder_response=r.finder_response,
            created_at=r.created_at,
            item_title=r.item.title if r.item else None,
            item_image_url=r.item.image_url if r.item else None
        ))
    return results

@router.post("/auctions/{auction_id}/bid")
def place_bid(
    auction_id: int,
    bid_in: BidCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    auction = db.query(AuctionListing).filter(AuctionListing.id == auction_id).first()
    if not auction or auction.status != "ACTIVE":
        raise HTTPException(status_code=404, detail="Auction not active or found")

    if current_user.points_balance < bid_in.bid_points:
        raise HTTPException(status_code=400, detail="Insufficient Back2U Points balance")

    if bid_in.bid_points <= auction.current_bid_points:
        raise HTTPException(status_code=400, detail=f"Bid must be higher than current bid of {auction.current_bid_points} points")

    auction.current_bid_points = bid_in.bid_points
    auction.current_highest_bidder_id = current_user.id
    db.commit()

    return {
        "message": "Bid successfully placed!",
        "new_highest_bid": auction.current_bid_points,
        "highest_bidder": current_user.full_name
    }
