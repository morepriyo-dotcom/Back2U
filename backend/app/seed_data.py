import json
import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.item import Item
from app.models.claim import Claim
from app.models.reward import PointTransaction
from app.models.marketplace import AuctionListing
from app.models.notification import Notification
from app.services.auth_service import get_password_hash
from app.ai.embeddings import generate_text_embedding

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).count() > 0:
        return

    print("[Seed Data] Seeding realistic demo users, items, and transactions...")

    # 1. Seed Demo Users
    hashed_pwd = get_password_hash("password123")
    
    admin_user = User(
        email="admin@back2u.org",
        full_name="Alex Administrator",
        hashed_password=hashed_pwd,
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        role="admin",
        trust_score=150,
        penalty_points=0,
        points_balance=600
    )
    
    rohan_user = User( # Matches Rohan from back2u.jpeg UI reference
        email="rohan@back2u.org",
        full_name="Rohan",
        hashed_password=hashed_pwd,
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        role="user",
        trust_score=125,
        penalty_points=0,
        points_balance=350
    )
    
    priya_user = User( # Matches Priya from slide 02 narrative
        email="priya@back2u.org",
        full_name="Priya Patel",
        hashed_password=hashed_pwd,
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        role="user",
        trust_score=110,
        penalty_points=0,
        points_balance=180
    )
    
    vikram_user = User(
        email="vikram@back2u.org",
        full_name="Vikram Mehta",
        hashed_password=hashed_pwd,
        avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        role="user",
        trust_score=95,
        penalty_points=5,
        points_balance=90
    )

    db.add_all([admin_user, rohan_user, priya_user, vikram_user])
    db.commit()
    db.refresh(admin_user)
    db.refresh(rohan_user)
    db.refresh(priya_user)
    db.refresh(vikram_user)

    # 2. Seed Realistic Items matching back2u.jpeg & presentation slides
    now = datetime.datetime.utcnow()
    
    demo_items = [
        # AirPods (Matches hero card #1)
        {
            "report_type": "LOST",
            "title": "AirPods Pro 2nd Gen in White MagSafe Case",
            "category": "Electronics",
            "description": "Lost my AirPods Pro white case on 2nd floor silent reading zone near college library desk.",
            "location_name": "Library",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "incident_date": now - datetime.timedelta(hours=2),
            "image_url": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=80",
            "brand": "Apple",
            "model": "AirPods Pro 2",
            "private_clues": "Tiny sticker of a red rocket on the rear hinge. Serial ending in W79.",
            "custody_status": "IN_POSSESSION",
            "status": "REPORTED",
            "reporter_id": priya_user.id
        },
        # AirPods Found counterpart for high AI match
        {
            "report_type": "FOUND",
            "title": "White Apple Earbuds Case found on library desk",
            "category": "Electronics",
            "description": "Found a white charging case for AirPods near the corner study desks in library.",
            "location_name": "Library",
            "latitude": 37.7751,
            "longitude": -122.4192,
            "incident_date": now - datetime.timedelta(hours=1, minutes=30),
            "image_url": "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=500&auto=format&fit=crop&q=80",
            "brand": "Apple",
            "model": "AirPods",
            "private_clues": "Has a red sticker on the back hinge and faint scratch near the lid.",
            "custody_status": "SECURITY_DESK",
            "status": "REPORTED",
            "reporter_id": rohan_user.id
        },
        # Black Wallet (Matches hero card #2)
        {
            "report_type": "LOST",
            "title": "Black Bi-fold Leather Wallet",
            "category": "Wallets and bags",
            "description": "Black leather wallet with credit cards and student ID card lost in Main Building hallway.",
            "location_name": "Main Building",
            "latitude": 37.7760,
            "longitude": -122.4180,
            "incident_date": now - datetime.timedelta(hours=5),
            "image_url": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=80",
            "brand": "Bellroy",
            "model": "Slim Sleeve",
            "private_clues": "Driver license under flap, $20 folded bill inside hidden coin pouch.",
            "custody_status": "IN_POSSESSION",
            "status": "UNDER_CLAIM",
            "reporter_id": vikram_user.id
        },
        # Black Wallet Found counterpart
        {
            "report_type": "FOUND",
            "title": "Dark Men's Leather Wallet found on bench",
            "category": "Wallets and bags",
            "description": "Dark leather wallet recovered from ground floor bench near Main Building entrance.",
            "location_name": "Main Building",
            "latitude": 37.7762,
            "longitude": -122.4178,
            "incident_date": now - datetime.timedelta(hours=4),
            "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80",
            "brand": "Bellroy",
            "model": "Leather Wallet",
            "private_clues": "Contains Vikram student ID card and folded bill in secret slot.",
            "custody_status": "IN_POSSESSION",
            "status": "UNDER_CLAIM",
            "reporter_id": rohan_user.id
        },
        # Water Bottle (Matches hero card #3)
        {
            "report_type": "LOST",
            "title": "Hydro Flask Blue Insulated Water Bottle",
            "category": "Bottles and containers",
            "description": "32oz cobalt blue Hydro Flask with flex straw cap lost near indoor gym court.",
            "location_name": "Sports Complex",
            "latitude": 37.7780,
            "longitude": -122.4150,
            "incident_date": now - datetime.timedelta(hours=6),
            "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80",
            "brand": "Hydro Flask",
            "model": "Wide Mouth 32oz",
            "private_clues": "National Park decal sticker on side, dent on bottom base rim.",
            "custody_status": "IN_POSSESSION",
            "status": "REPORTED",
            "reporter_id": priya_user.id
        },
        # Keys (Matches hero card #4)
        {
            "report_type": "FOUND",
            "title": "Keychain with 3 Brass Keys and Blue Tag",
            "category": "Keys",
            "description": "Found a key ring with two door keys and one mailbox key by cafeteria register #2.",
            "location_name": "Cafeteria",
            "latitude": 37.7730,
            "longitude": -122.4200,
            "incident_date": now - datetime.timedelta(hours=8),
            "image_url": "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&auto=format&fit=crop&q=80",
            "brand": "Schlage",
            "model": "Brass Key",
            "private_clues": "Blue rubber tag has number '408' etched into it.",
            "custody_status": "CAMPUS_OFFICE",
            "status": "REPORTED",
            "reporter_id": rohan_user.id
        },
        # ThinkPad Laptop (High-value item for admin review)
        {
            "report_type": "FOUND",
            "title": "Lenovo ThinkPad X1 Carbon 14-inch Laptop",
            "category": "Electronics",
            "description": "Matte black laptop left behind in Computer Science Lab 302 on Monday evening.",
            "location_name": "CS Lab 302",
            "latitude": 37.7745,
            "longitude": -122.4170,
            "incident_date": now - datetime.timedelta(days=2),
            "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=80",
            "brand": "Lenovo",
            "model": "ThinkPad X1",
            "private_clues": "Linux Tux penguin sticker on left palm rest. Asset tag #CS-2024-918.",
            "custody_status": "CAMPUS_OFFICE",
            "status": "UNDER_CLAIM",
            "reporter_id": rohan_user.id
        },
        # Ray-Ban Sunglasses
        {
            "report_type": "LOST",
            "title": "Ray-Ban Classic Clubmaster Sunglasses",
            "category": "Accessories",
            "description": "Tortoise shell frame sunglasses with gold bridge left near Student Union lounge sofa.",
            "location_name": "Student Center",
            "latitude": 37.7755,
            "longitude": -122.4185,
            "incident_date": now - datetime.timedelta(days=1),
            "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=80",
            "brand": "Ray-Ban",
            "model": "Clubmaster",
            "private_clues": "Right lens has subtle engraving 'RB' on outer edge.",
            "custody_status": "IN_POSSESSION",
            "status": "REPORTED",
            "reporter_id": vikram_user.id
        },
        # Swiss Military Backpack
        {
            "report_type": "FOUND",
            "title": "Black Heavy-Duty Travel Backpack",
            "category": "Wallets and bags",
            "description": "Multi-compartment nylon backpack found after the evening orientation event in Auditorium A.",
            "location_name": "Auditorium",
            "latitude": 37.7765,
            "longitude": -122.4160,
            "incident_date": now - datetime.timedelta(days=3),
            "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80",
            "brand": "Swiss Military",
            "model": "Commuter Pack",
            "private_clues": "Internal zipper pocket holds a TI-84 Plus CE calculator and blue spiral notebook.",
            "custody_status": "SECURITY_DESK",
            "status": "REPORTED",
            "reporter_id": rohan_user.id
        },
        # Successfully Returned Item (Demonstrates completed return and recovery rate)
        {
            "report_type": "FOUND",
            "title": "TI-84 Plus Graphing Calculator (Reunited)",
            "category": "Electronics",
            "description": "Graphing calculator found in Math hall room 104, returned to owner.",
            "location_name": "Science Block",
            "latitude": 37.7770,
            "longitude": -122.4165,
            "incident_date": now - datetime.timedelta(days=7),
            "image_url": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=80",
            "brand": "Texas Instruments",
            "model": "TI-84",
            "private_clues": "Name initials scratched on battery cover.",
            "custody_status": "IN_POSSESSION",
            "status": "RETURNED",
            "reporter_id": rohan_user.id
        }
    ]

    seeded_item_objs = []
    for item_data in demo_items:
        text_content = f"{item_data['title']} {item_data['category']} {item_data['description']} {item_data['location_name']}"
        text_emb = generate_text_embedding(text_content)
        
        item_obj = Item(
            report_type=item_data["report_type"],
            title=item_data["title"],
            category=item_data["category"],
            description=item_data["description"],
            location_name=item_data["location_name"],
            latitude=item_data["latitude"],
            longitude=item_data["longitude"],
            incident_date=item_data["incident_date"],
            image_url=item_data["image_url"],
            brand=item_data.get("brand"),
            model=item_data.get("model"),
            private_clues=item_data.get("private_clues"),
            custody_status=item_data["custody_status"],
            status=item_data["status"],
            text_embedding=json.dumps(text_emb),
            image_embedding=None,
            is_demo_seed=True, # Label demo data clearly
            reporter_id=item_data["reporter_id"]
        )
        db.add(item_obj)
        seeded_item_objs.append(item_obj)

    db.commit()
    for obj in seeded_item_objs:
        db.refresh(obj)

    # 3. Seed Realistic Demo Claims
    # Find the Black Wallet found item and seed Vikram's claim
    found_wallet = next((it for it in seeded_item_objs if "Dark Men's Leather Wallet" in it.title), None)
    if found_wallet:
        claim_wallet = Claim(
            item_id=found_wallet.id,
            claimant_id=vikram_user.id,
            status="EVIDENCE_REVIEW",
            challenge_answers="It is a Bellroy Slim Sleeve in charcoal black. The internal slot contains my Vikram Mehta student card #9421 and a folded emergency $20 bill in the coin slot.",
            evidence_photos=json.dumps(["https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=80"]),
            serial_number_provided="BELLROY-SLIM-BLK",
            supporting_notes="Lost right outside the main hall after my 2 PM statistics lecture.",
            risk_score=0.15,
            is_disputed=False,
            finder_confirmed=False,
            owner_confirmed=False
        )
        db.add(claim_wallet)

    # Find the ThinkPad found item and seed a disputed claim
    thinkpad = next((it for it in seeded_item_objs if "ThinkPad" in it.title), None)
    if thinkpad:
        claim_laptop_1 = Claim(
            item_id=thinkpad.id,
            claimant_id=priya_user.id,
            status="MANUAL_REVIEW",
            challenge_answers="It's my research laptop with dual boot Ubuntu and Windows. Sticker of Linux Tux on the keyboard palm rest.",
            serial_number_provided="PF2918X1C",
            supporting_notes="Used for my AI senior design project.",
            risk_score=0.35,
            is_disputed=True,
            finder_confirmed=False,
            owner_confirmed=False
        )
        claim_laptop_2 = Claim(
            item_id=thinkpad.id,
            claimant_id=vikram_user.id,
            status="MANUAL_REVIEW",
            challenge_answers="Black ThinkPad laptop left in lab.",
            risk_score=0.75, # High risk due to vague answer
            is_disputed=True,
            finder_confirmed=False,
            owner_confirmed=False
        )
        db.add_all([claim_laptop_1, claim_laptop_2])

    # 4. Seed Unclaimed Item Auction
    unclaimed_backpack = next((it for it in seeded_item_objs if "Heavy-Duty Travel Backpack" in it.title), None)
    if unclaimed_backpack:
        auction = AuctionListing(
            item_id=unclaimed_backpack.id,
            starting_points=60,
            current_bid_points=120,
            current_highest_bidder_id=priya_user.id,
            resolution_type="AUCTION",
            admin_approved=True,
            status="ACTIVE",
            end_date=now + datetime.timedelta(days=4)
        )
        db.add(auction)

    # 5. Seed Point Transactions Ledger
    tx1 = PointTransaction(
        user_id=rohan_user.id,
        amount=50,
        transaction_type="FOUND_REPORT_REWARD",
        description="Reward for reporting found item 'White Apple Earbuds Case'",
        created_at=now - datetime.timedelta(hours=2)
    )
    tx2 = PointTransaction(
        user_id=rohan_user.id,
        amount=150,
        transaction_type="RETURN_COMPLETED_REWARD",
        description="Reward for successfully reuniting 'TI-84 Plus Graphing Calculator'",
        created_at=now - datetime.timedelta(days=7)
    )
    tx3 = PointTransaction(
        user_id=priya_user.id,
        amount=100,
        transaction_type="WELCOME_BONUS",
        description="Welcome to Back2U community bonus",
        created_at=now - datetime.timedelta(days=10)
    )
    db.add_all([tx1, tx2, tx3])

    # 6. Seed In-app Notifications
    n1 = Notification(
        user_id=rohan_user.id,
        title="New Ownership Claim Received",
        message="Vikram Mehta has submitted an ownership claim for the Dark Men's Leather Wallet you found.",
        notification_type="CLAIM_UPDATE",
        link_url="/claims"
    )
    n2 = Notification(
        user_id=priya_user.id,
        title="AI Potential Match Discovered (94%)",
        message="Our AI identified a 94% potential match for your lost AirPods Pro in Library.",
        notification_type="AI_MATCH",
        link_url="/search"
    )
    db.add_all([n1, n2])

    db.commit()
    print("[Seed Data] Database successfully seeded with demo items and users!")
