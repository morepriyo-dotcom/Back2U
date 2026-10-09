import os
import json
import secrets
import hashlib
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from app.database import get_db
from app.models.item import Item
from app.models.user import User
from app.schemas.item import (
    ItemCreate, ItemUpdate, ItemPublicResponse, ItemDetailResponse,
    ItemPaginatedResponse, OfficialCertificateResponse
)
from app.services.auth_service import get_current_user, get_current_user_optional
from app.services.trust_service import trust_service
from app.ai.embeddings import generate_text_embedding, generate_image_embedding
from app.config import settings

router = APIRouter(prefix="/api/items", tags=["Items"])

@router.get("", response_model=List[ItemPublicResponse])
def get_items(
    query: Optional[str] = Query(None, description="Keywords search"),
    category: Optional[str] = Query(None, description="Item category filter"),
    report_type: Optional[str] = Query(None, description="LOST or FOUND"),
    location: Optional[str] = Query(None, description="Area or location"),
    status_filter: Optional[str] = Query(None, alias="status"),
    is_demo: Optional[bool] = Query(None, description="Filter demo seed vs real data"),
    sort_by: str = Query("recent", description="'recent' or 'title'"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    q = db.query(Item).filter(Item.is_flagged == False)

    if report_type and report_type.upper() in ["LOST", "FOUND"]:
        q = q.filter(Item.report_type == report_type.upper())

    if category and category.lower() != "all":
        q = q.filter(Item.category.ilike(f"%{category}%"))

    if location:
        q = q.filter(Item.location_name.ilike(f"%{location}%"))

    if status_filter:
        q = q.filter(Item.status == status_filter)
    else:
        q = q.filter(Item.status != "CLOSED")

    if is_demo is not None:
        q = q.filter(Item.is_demo_seed == is_demo)

    if query and query.strip():
        term = f"%{query.strip()}%"
        q = q.filter(
            or_(
                Item.title.ilike(term),
                Item.description.ilike(term),
                Item.category.ilike(term),
                Item.location_name.ilike(term),
                Item.brand.ilike(term),
                Item.model.ilike(term),
                Item.lr_number.ilike(term)
            )
        )

    if sort_by == "recent":
        q = q.order_by(desc(Item.incident_date), desc(Item.created_at))
    else:
        q = q.order_by(Item.title.asc())

    return q.offset(offset).limit(limit).all()

@router.get("/paginated", response_model=ItemPaginatedResponse)
def get_paginated_items(
    query: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    report_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    sort_by: str = Query("recent"),
    db: Session = Depends(get_db)
):
    """
    High-capacity paginated retrieval engineered to handle 50,000+ items with index support.
    """
    q = db.query(Item).filter(Item.is_flagged == False)

    if report_type and report_type.upper() in ["LOST", "FOUND"]:
        q = q.filter(Item.report_type == report_type.upper())

    if category and category.lower() != "all":
        q = q.filter(Item.category.ilike(f"%{category}%"))

    if location:
        q = q.filter(Item.location_name.ilike(f"%{location}%"))

    if status_filter:
        q = q.filter(Item.status == status_filter)
    else:
        q = q.filter(Item.status != "CLOSED")

    if query and query.strip():
        term = f"%{query.strip()}%"
        q = q.filter(
            or_(
                Item.title.ilike(term),
                Item.description.ilike(term),
                Item.category.ilike(term),
                Item.location_name.ilike(term),
                Item.brand.ilike(term),
                Item.model.ilike(term),
                Item.lr_number.ilike(term)
            )
        )

    total_count = q.count()
    total_pages = max(1, (total_count + limit - 1) // limit)
    offset = (page - 1) * limit

    if sort_by == "recent":
        items = q.order_by(desc(Item.incident_date), desc(Item.created_at)).offset(offset).limit(limit).all()
    else:
        items = q.order_by(Item.title.asc()).offset(offset).limit(limit).all()

    return ItemPaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@router.get("/recent")
def get_recent_items(db: Session = Depends(get_db)):
    lost = db.query(Item).filter(
        Item.report_type == "LOST",
        Item.status.in_(["REPORTED", "UNDER_CLAIM", "RECOVERY_IN_PROGRESS"]),
        Item.is_flagged == False
    ).order_by(desc(Item.incident_date)).limit(6).all()

    found = db.query(Item).filter(
        Item.report_type == "FOUND",
        Item.status.in_(["REPORTED", "UNDER_CLAIM", "RECOVERY_IN_PROGRESS"]),
        Item.is_flagged == False
    ).order_by(desc(Item.incident_date)).limit(6).all()

    return {
        "recently_lost": lost,
        "recently_found": found
    }

@router.get("/my/reports", response_model=List[ItemPublicResponse])
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Item).filter(Item.reporter_id == current_user.id).order_by(desc(Item.created_at)).all()

@router.get("/{item_id}", response_model=ItemDetailResponse)
def get_item_detail(
    item_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    is_owner_or_admin = current_user and (current_user.id == item.reporter_id or current_user.role == "admin")

    return ItemDetailResponse(
        id=item.id,
        report_type=item.report_type,
        title=item.title,
        category=item.category,
        description=item.description,
        location_name=item.location_name,
        latitude=item.latitude,
        longitude=item.longitude,
        incident_date=item.incident_date,
        image_url=item.image_url,
        brand=item.brand,
        model=item.model,
        custody_status=item.custody_status,
        status=item.status,
        lr_number=item.lr_number,
        is_govt_id=item.is_govt_id or False,
        govt_id_type=item.govt_id_type,
        masked_identifier=item.masked_identifier,
        is_demo_seed=item.is_demo_seed,
        created_at=item.created_at,
        reporter_id=item.reporter_id,
        reporter_name=item.reporter.full_name if item.reporter else "Anonymous",
        reporter_trust_score=item.reporter.trust_score if item.reporter else 100,
        private_clues=item.private_clues if is_owner_or_admin else None,
        has_private_clues=bool(item.private_clues)
    )

@router.get("/{item_id}/certificate", response_model=OfficialCertificateResponse)
def get_official_lost_certificate(
    item_id: int,
    db: Session = Depends(get_db)
):
    """
    Generates a digitally verifiable Lost Article Report Intimation Certificate,
    compliant with Delhi Police / State Police Online Lost Article guidelines and
    Sections 168/169 of the Indian Contract Act, 1872.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Generate verification digital hash
    hash_payload = f"{item.id}:{item.lr_number}:{item.created_at.isoformat()}:back2u_integrity"
    verif_hash = hashlib.sha256(hash_payload.encode()).hexdigest()[:24].upper()

    legal_notice = (
        "STATUTORY LEGAL NOTICE: This document is an informational Digital Lost Article Report acknowledgment "
        "issued pursuant to citizen lost property registration guidelines (compatible with Section 66/67 of the Police Act, 1878 "
        "and Sections 168 & 169 of the Indian Contract Act, 1872 regarding bailment and rights of finders). "
        "THIS IS NOT A FIRST INFORMATION REPORT (FIR) FOR A COGNIZABLE CRIME OR THEFT. "
        "For stolen articles, cyber extortion, or criminal loss, the reporter must immediately register an e-FIR with the local jurisdictional Police Station."
    )

    next_steps = [
        "Present this Lost Report (LR) Reference to telecom service providers for SIM card re-issuance.",
        "Submit this certificate to university, municipal, or licensing authorities when applying for duplicate government identity cards.",
        "Keep confidential distinguishing marks private; claimants will be prompted to answer challenge verifications before handover.",
        "Under Section 168 of the Indian Contract Act, finders of goods are quasi-bailees entitled to retention of goods for announced rewards or reasonable care expenses."
    ]

    return OfficialCertificateResponse(
        lr_number=item.lr_number or f"B2U-LR-2026-{item.id:06d}",
        item_id=item.id,
        report_type=item.report_type,
        title=item.title,
        category=item.category,
        description=item.description,
        location_name=item.location_name,
        incident_date=item.incident_date,
        reported_date=item.created_at,
        reporter_name=item.reporter.full_name if item.reporter else "Verified Citizen",
        masked_identifier=item.masked_identifier,
        custody_status=item.custody_status,
        status=item.status,
        verification_hash=verif_hash,
        legal_statutory_notice=legal_notice,
        guidelines_and_next_steps=next_steps
    )

@router.post("", response_model=ItemPublicResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    item_in: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Generate text embedding
    text_content = f"{item_in.title} {item_in.category} {item_in.description} {item_in.brand or ''} {item_in.model or ''} {item_in.location_name}"
    text_emb = generate_text_embedding(text_content)

    # 2. Generate image embedding if local path exists
    img_emb = None
    if item_in.image_url:
        local_path = item_in.image_url.lstrip("/")
        if os.path.exists(local_path):
            img_emb = generate_image_embedding(local_path)

    # 3. Generate Official LR Reference (e.g. B2U-LR-2026-849201)
    year = datetime.datetime.utcnow().year
    rand_code = str(secrets.randbelow(900000) + 100000)
    lr_number = f"B2U-LR-{year}-{rand_code}"

    # 4. Mask Government ID if applicable to prevent identity fraud
    masked_id = None
    if item_in.is_govt_id and item_in.masked_identifier:
        raw = item_in.masked_identifier.strip()
        if len(raw) > 4:
            masked_id = "X" * (len(raw) - 4) + raw[-4:]
        else:
            masked_id = raw

    new_item = Item(
        report_type=item_in.report_type.upper(),
        title=item_in.title,
        category=item_in.category,
        description=item_in.description,
        location_name=item_in.location_name,
        latitude=item_in.latitude,
        longitude=item_in.longitude,
        incident_date=item_in.incident_date or datetime.datetime.utcnow(),
        image_url=item_in.image_url,
        brand=item_in.brand,
        model=item_in.model,
        private_clues=item_in.private_clues,
        custody_status=item_in.custody_status or "IN_POSSESSION",
        status="REPORTED",
        lr_number=lr_number,
        is_govt_id=item_in.is_govt_id or False,
        govt_id_type=item_in.govt_id_type,
        masked_identifier=masked_id,
        text_embedding=json.dumps(text_emb),
        image_embedding=json.dumps(img_emb) if img_emb else None,
        is_demo_seed=False,
        reporter_id=current_user.id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # If user reported a FOUND item, reward them with +50 Back2U points
    if new_item.report_type == "FOUND":
        trust_service.award_points(
            db=db,
            user=current_user,
            amount=settings.POINTS_FOUND_REPORT,
            transaction_type="FOUND_REPORT_REWARD",
            description=f"Reward for reporting found item '{new_item.title}'",
            related_item_id=new_item.id
        )

    return new_item

@router.put("/{item_id}", response_model=ItemPublicResponse)
def update_item(
    item_id: int,
    item_in: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this report")

    if item_in.title is not None:
        item.title = item_in.title
    if item_in.category is not None:
        item.category = item_in.category
    if item_in.description is not None:
        item.description = item_in.description
    if item_in.location_name is not None:
        item.location_name = item_in.location_name
    if item_in.custody_status is not None:
        item.custody_status = item_in.custody_status
    if item_in.status is not None:
        item.status = item_in.status
    if item_in.private_clues is not None:
        item.private_clues = item_in.private_clues

    text_content = f"{item.title} {item.category} {item.description} {item.location_name}"
    item.text_embedding = json.dumps(generate_text_embedding(text_content))

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_or_close_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to close this report")

    item.status = "CLOSED"
    db.commit()
    return {"message": "Report successfully closed", "item_id": item_id}
