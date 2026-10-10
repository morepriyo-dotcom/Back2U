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
            query_cat = (query_item.category or "").lower().strip()
            cand_cat = (candidate.category or "").lower().strip()
            if query_cat == cand_cat:
                category_multiplier = 1.05
            elif "other" in query_cat or "other" in cand_cat:
                category_multiplier = 0.85
            else:
                # Incompatible categories penalize overall ranking score
                category_multiplier = 0.60

            # Dynamic weight renormalization when image is missing
            if has_images:
                w_img = self.w_image
                w_txt = self.w_text
                w_loc = self.w_loc
                w_dt = self.w_date
            else:
                # Renormalize modalities without image so weights always sum to 1.0
                sum_weights = self.w_text + self.w_loc + self.w_date
                if sum_weights > 0:
                    w_img = 0.0
                    w_txt = self.w_text / sum_weights
                    w_loc = self.w_loc / sum_weights
                    w_dt = self.w_date / sum_weights
                else:
                    w_img, w_txt, w_loc, w_dt = 0.0, 1.0, 0.0, 0.0

            raw_score = (
                (w_img * img_sim) +
                (w_txt * text_sim) +
                (w_loc * loc_sim) +
                (w_dt * date_sim)
            ) * category_multiplier

            # Ranking score: explicitly treated as ranking relevance, never probability of ownership
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
                        "same_category": query_cat == cand_cat
                    },
                    "safe_summary": f"{candidate.category} item reported near {candidate.location_name}.",
                    "suggested_next_action": "Verify distinguishing features through an ownership challenge."
                })

        # Sort descending by ranking score
        ranked_results.sort(key=lambda x: x["match_score"], reverse=True)
        return ranked_results

    def evaluate_ranking(self, evaluation_dataset: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Measures ranking quality on a labelled evaluation dataset.
        Computes Mean Reciprocal Rank (MRR), Hit@1, and Hit@3.
        Do not fabricate metrics - computes directly from test pairs.
        Each entry in evaluation_dataset:
          {
            "query_item": Item,
            "candidates": List[Item],
            "ground_truth_id": int
          }
        """
        if not evaluation_dataset:
            return {"mrr": 0.0, "hit_at_1": 0.0, "hit_at_3": 0.0, "total_queries": 0}

        reciprocal_ranks = []
        hits_1 = 0
        hits_3 = 0

        for sample in evaluation_dataset:
            q_item = sample["query_item"]
            cands = sample["candidates"]
            gt_id = sample["ground_truth_id"]

            ranked = self.rank_candidates(q_item, cands, min_score=0.0)
            ranked_ids = [r["candidate_item_id"] for r in ranked]

            if gt_id in ranked_ids:
                rank = ranked_ids.index(gt_id) + 1 # 1-based rank
                reciprocal_ranks.append(1.0 / rank)
                if rank == 1:
                    hits_1 += 1
                if rank <= 3:
                    hits_3 += 1
            else:
                reciprocal_ranks.append(0.0)

        n = len(evaluation_dataset)
        return {
            "mrr": round(float(sum(reciprocal_ranks) / n), 4),
            "hit_at_1": round(float(hits_1 / n), 4),
            "hit_at_3": round(float(hits_3 / n), 4),
            "total_queries": n
        }

matching_engine = AIMatchingEngine()

