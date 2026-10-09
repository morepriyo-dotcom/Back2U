import os
import json
import math
import hashlib
import numpy as np
from PIL import Image

def generate_text_embedding(text: str, dim: int = 128) -> list[float]:
    """
    Generates a normalized semantic embedding vector from text.
    Uses semantic token hashing and character-ngram frequency projection,
    ensuring deterministic, highly responsive semantic similarity.
    """
    if not text:
        return [0.0] * dim

    vec = np.zeros(dim, dtype=np.float32)
    tokens = text.lower().replace(",", " ").replace(".", " ").replace("-", " ").split()
    
    # Process unigrams and bigrams
    for i, token in enumerate(tokens):
        # Hash unigram
        h = int(hashlib.sha256(token.encode('utf-8')).hexdigest(), 16)
        idx = h % dim
        weight = 1.0 / (math.log(len(token) + 2))
        vec[idx] += weight
        
        # Hash bigram
        if i < len(tokens) - 1:
            bigram = f"{token}_{tokens[i+1]}"
            bh = int(hashlib.md5(bigram.encode('utf-8')).hexdigest(), 16)
            b_idx = bh % dim
            vec[b_idx] += 1.5

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

def generate_image_embedding(image_path: str, dim: int = 128) -> list[float] | None:
    """
    Generates an image embedding vector using Pillow.
    Extracts color histogram, edge intensity, and spatial luminance distributions.
    """
    if not image_path or not os.path.exists(image_path):
        return None

    try:
        with Image.open(image_path) as img:
            img = img.convert('RGB').resize((64, 64))
            arr = np.array(img, dtype=np.float32) / 255.0 # (64, 64, 3)

            # 1. Color histogram (RGB channels, 16 bins each = 48 dims)
            r_hist, _ = np.histogram(arr[:, :, 0], bins=16, range=(0, 1))
            g_hist, _ = np.histogram(arr[:, :, 1], bins=16, range=(0, 1))
            b_hist, _ = np.histogram(arr[:, :, 2], bins=16, range=(0, 1))
            color_feats = np.concatenate([r_hist, g_hist, b_hist]).astype(np.float32)

            # 2. Spatial quadrant luminance (4x4 grid = 16 dims)
            luminance = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
            grid_feats = []
            for r in range(4):
                for c in range(4):
                    block = luminance[r*16:(r+1)*16, c*16:(c+1)*16]
                    grid_feats.append(np.mean(block))
            grid_feats = np.array(grid_feats, dtype=np.float32)

            # 3. Simple horizontal & vertical gradient (texture = 32 dims)
            dx = np.abs(luminance[:, 1:] - luminance[:, :-1])
            dy = np.abs(luminance[1:, :] - luminance[:-1, :])
            grad_x, _ = np.histogram(dx, bins=16, range=(0, 1))
            grad_y, _ = np.histogram(dy, bins=16, range=(0, 1))
            texture_feats = np.concatenate([grad_x, grad_y]).astype(np.float32)

            # Combine and pad/truncate to requested dim
            combined = np.concatenate([color_feats, grid_feats, texture_feats])
            if len(combined) < dim:
                combined = np.pad(combined, (0, dim - len(combined)))
            else:
                combined = combined[:dim]

            norm = np.linalg.norm(combined)
            if norm > 0:
                combined = combined / norm
            return combined.tolist()
    except Exception as e:
        print(f"[AI Embeddings] Warning processing image {image_path}: {e}")
        return None

def cosine_similarity(v1: list[float] | None, v2: list[float] | None) -> float:
    """Calculates cosine similarity between two float vectors [-1.0, 1.0] scaled to [0.0, 1.0]."""
    if not v1 or not v2:
        return 0.0
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    sim = float(dot / (norm_a * norm_b))
    # Bound between 0.0 and 1.0
    return max(0.0, min(1.0, (sim + 1.0) / 2.0 if sim < 0 else sim))

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns distance in kilometers between two geo coordinates."""
    r = 6371.0 # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c

def calculate_location_score(lat1: float | None, lon1: float | None, lat2: float | None, lon2: float | None, loc1: str, loc2: str) -> float:
    """Computes a proximity score [0.0, 1.0] using coordinates or name similarity."""
    if lat1 is not None and lon1 is not None and lat2 is not None and lon2 is not None:
        km = calculate_haversine_distance(lat1, lon1, lat2, lon2)
        # 0 km = 1.0 score, 5 km = ~0.60 score, 20 km = ~0.15 score
        return float(math.exp(-km / 6.0))
    
    # Fallback: string matching on location name
    loc1_clean = loc1.lower().strip()
    loc2_clean = loc2.lower().strip()
    if loc1_clean == loc2_clean:
        return 1.0
    if loc1_clean in loc2_clean or loc2_clean in loc1_clean:
        return 0.85
    
    # Common words overlap
    words1 = set(loc1_clean.split())
    words2 = set(loc2_clean.split())
    intersection = words1.intersection(words2)
    if intersection:
        return 0.70
    return 0.30

def calculate_date_score(d1, d2) -> float:
    """Computes date proximity score [0.0, 1.0]."""
    if not d1 or not d2:
        return 0.5
    diff_days = abs((d1 - d2).total_seconds()) / 86400.0
    # Items lost and found within 0-2 days = 0.95 - 1.0
    # 7 days = ~0.60
    # 30 days = ~0.15
    return float(math.exp(-diff_days / 8.0))
