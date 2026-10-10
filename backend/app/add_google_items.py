import datetime
import json
from app.database import SessionLocal
from app.models.item import Item
from app.ai.embeddings import generate_text_embedding

def add_google_demo_items():
    db = SessionLocal()
    now = datetime.datetime.utcnow()
    existing_titles = [it.title for it in db.query(Item).all()]

    google_items = [
        {
            "report_type": "LOST",
            "title": "Google Pixel 8 Pro (Obsidian Black, 128GB)",
            "category": "Electronics",
            "description": "Lost my matte black Google Pixel 8 Pro flagship smartphone. Left on the study desk in the Library silent zone (Level 3). Device has a horizontal camera bar with dual-SIM enabled and Google 'G' logo on rear.",
            "location_name": "Library Level 3",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "incident_date": now - datetime.timedelta(hours=3),
            "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80",
            "brand": "Google",
            "model": "Pixel 8 Pro",
            "private_clues": "IMEI 1 is 358291104829104, IMEI 2 is 358291104829112. Lock screen displays wallpaper of Yosemite Valley and emergency contact phone ending in 9421.",
            "custody_status": "IN_POSSESSION",
            "status": "REPORTED",
            "reporter_id": 3
        },
        {
            "report_type": "FOUND",
            "title": "Found Google Pixel Smartphone in Obsidian Case",
            "category": "Electronics",
            "description": "Recovered an Obsidian black Google Pixel phone with triple camera visor bar from a study table next to the north window in Library Level 3.",
            "location_name": "Library Level 3",
            "latitude": 37.7750,
            "longitude": -122.4193,
            "incident_date": now - datetime.timedelta(hours=2, minutes=15),
            "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80",
            "brand": "Google",
            "model": "Pixel 8 Pro",
            "private_clues": "Black silicone bumper case with faint scuff near USB-C port. Device requires ownership PIN or hardware IMEI check before release.",
            "custody_status": "SECURITY_DESK",
            "status": "REPORTED",
            "reporter_id": 2
        },
        {
            "report_type": "FOUND",
            "title": "Google Pixel Buds Pro Wireless Earbuds (Charcoal Case)",
            "category": "Electronics",
            "description": "Found an oval white/charcoal wireless charging case containing Google Pixel Buds Pro noise-cancelling earbuds on a dining booth bench.",
            "location_name": "Campus Dining Hall",
            "latitude": 37.7732,
            "longitude": -122.4198,
            "incident_date": now - datetime.timedelta(hours=5),
            "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80",
            "brand": "Google",
            "model": "Pixel Buds Pro",
            "private_clues": "Charging case interior lid has hardware Serial Number 39041JDAF00291. Left earbud has medium silicone tip, right has small tip.",
            "custody_status": "CAMPUS_OFFICE",
            "status": "REPORTED",
            "reporter_id": 4
        },
        {
            "report_type": "LOST",
            "title": "Google Pixel Watch 2 (Matte Black Aluminum / Obsidian Active Band)",
            "category": "Electronics",
            "description": "Misplaced my circular Google Pixel Watch 2 with domed glass and black active sports band in the gym locker room or near the indoor running track.",
            "location_name": "Sports Complex Locker Room",
            "latitude": 37.7782,
            "longitude": -122.4148,
            "incident_date": now - datetime.timedelta(days=1),
            "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=80",
            "brand": "Google",
            "model": "Pixel Watch 2",
            "private_clues": "Serial number 3A181FQEG00128 engraved along the curved inner sensor ring. Paired with Fitbit account.",
            "custody_status": "IN_POSSESSION",
            "status": "REPORTED",
            "reporter_id": 4
        },
        {
            "report_type": "FOUND",
            "title": "Google Pixelbook Go 13.3-inch Touchscreen Chromebook (Just Black)",
            "category": "Electronics",
            "description": "Found a thin lightweight Google Chromebook with ribbed easy-grip bottom casing left on a desk in Student Union Room 204.",
            "location_name": "Student Union Room 204",
            "latitude": 37.7756,
            "longitude": -122.4184,
            "incident_date": now - datetime.timedelta(days=2),
            "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80",
            "brand": "Google",
            "model": "Pixelbook Go",
            "private_clues": "Model G021A, Serial 01271DABC9824. Distinctive ribbed wavy rubber underside.",
            "custody_status": "CAMPUS_OFFICE",
            "status": "UNDER_CLAIM",
            "reporter_id": 2
        }
    ]

    added = 0
    for data in google_items:
        if data["title"] not in existing_titles:
            text_content = f"{data['title']} {data['category']} {data['description']} {data['location_name']}"
            text_emb = generate_text_embedding(text_content)
            item = Item(
                report_type=data["report_type"],
                title=data["title"],
                category=data["category"],
                description=data["description"],
                location_name=data["location_name"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                incident_date=data["incident_date"],
                image_url=data["image_url"],
                brand=data["brand"],
                model=data["model"],
                private_clues=data["private_clues"],
                custody_status=data["custody_status"],
                status=data["status"],
                text_embedding=json.dumps(text_emb),
                image_embedding=None,
                is_demo_seed=True,
                reporter_id=data["reporter_id"]
            )
            db.add(item)
            added += 1

    db.commit()
    print(f"Successfully added {added} authentic Google demo items to local database!")
    db.close()

if __name__ == "__main__":
    add_google_demo_items()
