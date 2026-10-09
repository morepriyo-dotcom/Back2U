"""
High-capacity synthetic data generator for stress-testing Back2U with 50,000+ items.
Usage:
    python -m app.scripts.seed_volume --count 1000
    python -m app.scripts.seed_volume --count 50000
"""

import sys
import argparse
import random
import datetime
import json
from app.database import SessionLocal
from app.models.item import Item
from app.models.user import User

CATEGORIES = [
    "Electronics", "Wallets and bags", "Keys", "Documents", 
    "Clothing", "Accessories", "Bottles and containers", "Other"
]

LOCATIONS = [
    "Central Library", "Computer Science Block", "Sports Complex", 
    "Student Union Hall", "Cafeteria", "Main Auditorium", 
    "Science Lab 101", "Parking Lot B", "Metro Station Exit 2", 
    "Campus Gate #1", "Administration Wing", "Health Center"
]

ITEM_TEMPLATES = {
    "Electronics": ["iPhone 14 Pro", "Samsung Galaxy S23", "Sony WH-1000XM4 Headphones", "Dell XPS 13", "iPad Air 5", "Anker PowerBank 20000mAh", "Kindle Paperwhite"],
    "Wallets and bags": ["Leather Bifold Wallet", "Canvas Backpack", "Fossil Cardholder", "Tote Bag", "Gym Duffle Bag", "Travel Messenger Bag"],
    "Keys": ["Keyring with 3 brass keys", "Car Key Fob (Honda)", "Bike U-Lock Key", "Hostel Room Key with blue tag"],
    "Documents": ["Student Identity Card", "Aadhaar Card copy in folder", "PAN Card in plastic cover", "Driving License", "University Degree Certificate"],
    "Clothing": ["Navy Blue Windbreaker", "Grey Fleece Hoodie", "Denim Jacket", "Woolen Scarf"],
    "Accessories": ["Ray-Ban Wayfarer Sunglasses", "Titan Analog Watch", "Silver Chain Bracelet", "Titanium Frame Eyeglasses"],
    "Bottles and containers": ["Hydro Flask 32oz", "Milton Stainless Steel Flask", "Tupperware Lunchbox", "Yeti Rambler Tumbler"],
    "Other": ["Scientific Calculator (Casio)", "Black Umbrella", "Lab Coat with name tag", "Sports Water Bottle"]
}

def seed_volume(target_count: int = 1000, batch_size: int = 1000):
    db = SessionLocal()
    try:
        reporter = db.query(User).first()
        if not reporter:
            print("Error: Please run seed_data first to create a default user.")
            return

        current_count = db.query(Item).count()
        print(f"Current total items in database: {current_count}")
        needed = target_count - current_count
        if needed <= 0:
            print(f"Database already contains {current_count} items (>= target {target_count}).")
            return

        print(f"Generating {needed} high-volume items in batches of {batch_size}...")
        now = datetime.datetime.utcnow()

        batch = []
        for i in range(1, needed + 1):
            category = random.choice(CATEGORIES)
            template = random.choice(ITEM_TEMPLATES.get(category, ["Generic Item"]))
            report_type = random.choice(["LOST", "FOUND"])
            location = random.choice(LOCATIONS)
            days_ago = random.randint(0, 90)
            incident_date = now - datetime.timedelta(days=days_ago, minutes=random.randint(0, 1440))
            lr_num = f"B2U-LR-2026-{(current_count + i):06d}"
            
            is_doc = category == "Documents"
            masked_id = f"XXXX-XXXX-{random.randint(1000, 9999)}" if is_doc else None

            item = Item(
                report_type=report_type,
                title=f"{template} #{current_count + i}",
                category=category,
                description=f"Synthetic test item: {template} reported near {location}.",
                location_name=location,
                latitude=37.7749 + random.uniform(-0.05, 0.05),
                longitude=-122.4194 + random.uniform(-0.05, 0.05),
                incident_date=incident_date,
                image_url=None,
                brand="SampleBrand",
                model="ModelV1",
                custody_status="IN_POSSESSION" if report_type == "FOUND" else "IN_POSSESSION",
                status="REPORTED",
                lr_number=lr_num,
                is_govt_id=is_doc,
                govt_id_type="Aadhaar" if is_doc else None,
                masked_identifier=masked_id,
                text_embedding=None,
                image_embedding=None,
                is_demo_seed=True,
                reporter_id=reporter.id,
                created_at=incident_date,
                updated_at=incident_date
            )
            batch.append(item)

            if len(batch) >= batch_size:
                db.bulk_save_objects(batch)
                db.commit()
                print(f"  Inserted batch... Total seeded so far: {current_count + i}/{target_count}")
                batch = []

        if batch:
            db.bulk_save_objects(batch)
            db.commit()

        final_count = db.query(Item).count()
        print(f"Completed! Total items now in database: {final_count}")

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=1000, help="Target total item count")
    args = parser.parse_args()
    seed_volume(args.count)
