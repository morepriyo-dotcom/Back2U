import json
from typing import List, Dict, Any
from app.config import settings
from app.ai.embeddings import (
    cosine_similarity,
    calculate_location_score,
    calculate_date_score
)
from app.models.item import Item

class AIMatchingEngine:
    def __init__(
        self,
        weight_image: float = settings.WEIGHT_IMAGE,
        weight_text: float = settings.WEIGHT_TEXT,
        weight_location: float = settings.WEIGHT_LOCATION,
        weight_date: float = settings.WEIGHT_DATE
    ):
        self.w_image = weight_image
        self.w_text = weight_text
        self.w_loc = weight_location
        self.w_date = weight_date

    def rank_candidates(self, query_item: Item, candidate_items: List[Item], min_score: float = 0.35) -> List[Dict[str, Any]]:
        """
        Ranks opposite-status candidates (e.g. query is LOST, candidates are FOUND)
        using multi-modal similarity with configurable weights.
        """
        ranked_results = []

        query_text_emb = json.loads(query_item.text_embedding) if query_item.text_embedding else None
        query_img_emb = json.loads(query_item.image_embedding) if query_item.image_embedding else None

        for candidate in candidate_items:
            # Skip same report type or closed items
            if candidate.report_type == query_item.report_type:
                continue
            if candidate.id == query_item.id:
                continue

            cand_text_emb = json.loads(candidate.text_embedding) if candidate.text_embedding else None
            cand_img_emb = json.loads(candidate.image_embedding) if candidate.image_embedding else None

            # 1. Text Similarity
            text_sim = cosine_similarity(query_text_emb, cand_text_emb) if (query_text_emb and cand_text_emb) else 0.40
            
            # Additional title keyword bonus if matching
            query_keywords = set(query_item.title.lower().split())
            cand_keywords = set(candidate.title.lower().split())
            keyword_overlap = len(query_keywords.intersection(cand_keywords))
            if keyword_overlap > 0:
                text_sim = min(1.0, text_sim + 0.15 * keyword_overlap)

            # 2. Image Similarity
            has_images = bool(query_img_emb and cand_img_emb)
            img_sim = cosine_similarity(query_img_emb, cand_img_emb) if has_images else 0.0

            # 3. Location Proximity
            loc_sim = calculate_location_score(
                query_item.latitude, query_item.longitude,
                candidate.latitude, candidate.longitude,
                query_item.location_name, candidate.location_name
            )

            # 4. Date Proximity
            date_sim = calculate_date_score(query_item.incident_date, candidate.incident_date)

            # 5. Category compatibility multiplier
            category_multiplier = 1.0
            if query_item.category.lower() == candidate.category.lower():
                category_multiplier = 1.05
            else:
                # Incompatible categories penalize overall score
                category_multiplier = 0.65

            # Dynamic weight renormalization when image is missing
            if has_images:
                w_img = self.w_image
                w_txt = self.w_text
                w_loc = self.w_loc
                w_dt = self.w_date
            else:
                # Renormalize without image
                sum_weights = self.w_text + self.w_loc + self.w_date
                w_img = 0.0
                w_txt = self.w_text / sum_weights
                w_loc = self.w_loc / sum_weights
                w_dt = self.w_date / sum_weights

            raw_score = (
                (w_img * img_sim) +
                (w_txt * text_sim) +
                (w_loc * loc_sim) +
                (w_dt * date_sim)
            ) * category_multiplier

            # Clamp between 0.0 and 0.99 (Never 100% or absolute proof)
            final_score = max(0.0, min(0.98, raw_score))
            score_percentage = int(round(final_score * 100))

            if final_score >= min_score:
                ranked_results.append({
                    "candidate_item_id": candidate.id,
                    "title": candidate.title,
                    "category": candidate.category,
                    "location_name": candidate.location_name,
                    "incident_date": candidate.incident_date.isoformat() if candidate.incident_date else None,
                    "image_url": candidate.image_url,
                    "report_type": candidate.report_type,
                    "status": candidate.status,
                    "match_score": score_percentage,
                    "label": "Potential Match", # As required: NEVER 'Confirmed Match'
                    "match_signals": {
                        "text_similarity_percent": int(round(text_sim * 100)),
                        "image_similarity_percent": int(round(img_sim * 100)) if has_images else None,
                        "location_proximity_percent": int(round(loc_sim * 100)),
                        "date_proximity_percent": int(round(date_sim * 100)),
                        "same_category": query_item.category.lower() == candidate.category.lower()
                    },
                    "safe_summary": f"{candidate.category} item reported near {candidate.location_name}.",
                    "suggested_next_action": "Verify distinguishing features through an ownership challenge."
                })

        # Sort descending by match score
        ranked_results.sort(key=lambda x: x["match_score"], reverse=True)
        return ranked_results

matching_engine = AIMatchingEngine()
