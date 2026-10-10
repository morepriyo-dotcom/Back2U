import json
import datetime
from app.models.item import Item
from app.ai.matching_engine import matching_engine
from app.ai.embeddings import (
    generate_text_embedding,
    calculate_location_score,
    calculate_date_score,
    cosine_similarity,
    get_ai_engine_info
)

def _make_dummy_item(
    id: int,
    report_type: str,
    title: str,
    category: str,
    location_name: str,
    incident_date: datetime.datetime,
    lat: float = None,
    lon: float = None,
    image_emb: list = None
) -> Item:
    text_content = f"{title} {category} {location_name}"
    text_emb = generate_text_embedding(text_content)
    item = Item(
        id=id,
        report_type=report_type,
        title=title,
        category=category,
        description=title,
        location_name=location_name,
        latitude=lat,
        longitude=lon,
        incident_date=incident_date,
        text_embedding=json.dumps(text_emb),
        image_embedding=json.dumps(image_emb) if image_emb else None,
        status="REPORTED",
        is_flagged=False
    )
    return item

def test_engine_info_reports_honest_status():
    info = get_ai_engine_info()
    assert "mode" in info
    assert "text_model" in info
    assert "image_model" in info
    assert isinstance(info["is_fallback"], bool)

def test_identical_items_score_high():
    now = datetime.datetime.utcnow()
    query = _make_dummy_item(1, "LOST", "Apple AirPods Pro 2nd Gen", "Electronics", "Library", now, 28.5, 77.2)
    cand_match = _make_dummy_item(2, "FOUND", "Apple AirPods Pro 2nd Gen Case", "Electronics", "Library", now, 28.5, 77.2)
    cand_unrelated = _make_dummy_item(3, "FOUND", "Black Umbrella", "Accessories", "Gym", now - datetime.timedelta(days=20), 28.6, 77.3)

    results = matching_engine.rank_candidates(query, [cand_match, cand_unrelated], min_score=0.1)
    assert len(results) >= 1
    # Candidate match must be top-ranked
    assert results[0]["candidate_item_id"] == 2
    assert results[0]["match_score"] >= 75
    assert results[0]["label"] == "Potential Match" # NEVER "Confirmed Match"

def test_unrelated_items_score_low():
    now = datetime.datetime.utcnow()
    query = _make_dummy_item(10, "LOST", "Blue Hydro Flask Water Bottle", "Bottles and containers", "Gym", now)
    cand = _make_dummy_item(11, "FOUND", "Silver Diamond Engagement Ring", "Accessories", "Auditorium", now - datetime.timedelta(days=40))

    results = matching_engine.rank_candidates(query, [cand], min_score=0.0)
    assert len(results) == 1
    assert results[0]["match_score"] < 45

def test_missing_photo_renormalizes_weights_properly():
    now = datetime.datetime.utcnow()
    # Neither query nor candidate has image embedding
    query = _make_dummy_item(20, "LOST", "HP Pavilion Laptop", "Electronics", "CS Lab", now, 28.54, 77.19, image_emb=None)
    cand = _make_dummy_item(21, "FOUND", "HP Pavilion 15 Laptop", "Electronics", "CS Lab", now, 28.54, 77.19, image_emb=None)

    results = matching_engine.rank_candidates(query, [cand], min_score=0.0)
    assert len(results) == 1
    # Weight was renormalized without error; signals contain null for image
    assert results[0]["match_signals"]["image_similarity_percent"] is None
    assert results[0]["match_score"] > 60

def test_missing_coordinates_uses_text_location_fallback():
    # Both lack coordinates, but match location name
    score_match = calculate_location_score(None, None, None, None, "Campus Center", "Campus Center")
    score_diff = calculate_location_score(None, None, None, None, "Campus Center", "West Stadium")
    assert score_match >= 0.85
    assert score_diff <= 0.35

def test_category_incompatibility_penalized():
    now = datetime.datetime.utcnow()
    query = _make_dummy_item(30, "LOST", "Warm Fleece Winter Jacket", "Clothing", "Cafeteria", now)
    cand_same = _make_dummy_item(31, "FOUND", "Warm Fleece Winter Jacket", "Clothing", "Cafeteria", now)
    cand_diff = _make_dummy_item(32, "FOUND", "Warm Fleece Winter Jacket", "Electronics", "Cafeteria", now)

    res_same = matching_engine.rank_candidates(query, [cand_same], min_score=0.0)[0]["match_score"]
    res_diff = matching_engine.rank_candidates(query, [cand_diff], min_score=0.0)[0]["match_score"]
    assert res_same > res_diff

def test_temporal_proximity_decay():
    now = datetime.datetime.utcnow()
    d_same = calculate_date_score(now, now)
    d_week = calculate_date_score(now, now - datetime.timedelta(days=7))
    d_month = calculate_date_score(now, now - datetime.timedelta(days=35))
    assert d_same > d_week > d_month
    assert d_same >= 0.99
    assert d_month < 0.20

def test_evaluate_ranking_quality_on_labelled_dataset():
    """
    Evaluates real ranking quality metrics (MRR, Hit@1, Hit@3) on a labelled benchmark dataset.
    """
    now = datetime.datetime.utcnow()
    q1 = _make_dummy_item(101, "LOST", "Bose QuietComfort 45 Headphones", "Electronics", "Library 3rd Floor", now)
    c1_true = _make_dummy_item(201, "FOUND", "Bose QC45 Noise Cancelling Headphones", "Electronics", "Library", now)
    c1_distract1 = _make_dummy_item(202, "FOUND", "Calculus Textbook 9th Edition", "Documents", "Dining Hall", now)
    c1_distract2 = _make_dummy_item(203, "FOUND", "Keys with Red Lanyard", "Keys", "Parking Lot A", now)

    q2 = _make_dummy_item(102, "LOST", "Brown Leather Bi-fold Wallet", "Wallets and bags", "Student Union", now)
    c2_true = _make_dummy_item(204, "FOUND", "Brown Men's Leather Wallet", "Wallets and bags", "Student Union Food Court", now)
    c2_distract1 = _make_dummy_item(205, "FOUND", "Black Umbro Gym Bag", "Wallets and bags", "Sports Field", now)
    c2_distract2 = _make_dummy_item(206, "FOUND", "Casio Scientific Calculator", "Electronics", "CS Lab 1", now)

    evaluation_benchmark = [
        {
            "query_item": q1,
            "candidates": [c1_distract1, c1_true, c1_distract2],
            "ground_truth_id": 201
        },
        {
            "query_item": q2,
            "candidates": [c2_distract1, c2_distract2, c2_true],
            "ground_truth_id": 204
        }
    ]

    metrics = matching_engine.evaluate_ranking(evaluation_benchmark)
    assert metrics["total_queries"] == 2
    assert metrics["mrr"] == 1.0 # Both true items ranked #1
    assert metrics["hit_at_1"] == 1.0
    assert metrics["hit_at_3"] == 1.0
