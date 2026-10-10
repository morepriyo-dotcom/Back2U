import os
import io
import math
import hashlib
from typing import List, Optional, Dict, Any
import numpy as np
from PIL import Image

from app.config import settings

# Global model state
_sentence_transformer_model = None
_sentence_transformer_error: Optional[str] = None

_open_clip_model = None
_open_clip_preprocess = None
_open_clip_error: Optional[str] = None

def _get_sentence_transformer():
    """Lazily loads the SentenceTransformer model or uses documented baseline fallback."""
    global _sentence_transformer_model, _sentence_transformer_error
    if not settings.USE_NEURAL_MODELS:
        return None
    if _sentence_transformer_model is not None:
        return _sentence_transformer_model
    if _sentence_transformer_error is not None:
        return None

    try:
        from sentence_transformers import SentenceTransformer
        _sentence_transformer_model = SentenceTransformer(settings.SENTENCE_TRANSFORMER_MODEL)
        print(f"[AI] Successfully loaded SentenceTransformer model: {settings.SENTENCE_TRANSFORMER_MODEL}")
        return _sentence_transformer_model
    except Exception as e:
        _sentence_transformer_error = str(e)
        print(f"[AI] Notice: SentenceTransformer could not be loaded ({e}). Using documented baseline text fallback.")
        return None

def _get_open_clip():
    """Lazily loads OpenCLIP model and preprocess transforms or uses documented baseline fallback."""
    global _open_clip_model, _open_clip_preprocess, _open_clip_error
    if not settings.USE_NEURAL_MODELS:
        return None, None
    if _open_clip_model is not None:
        return _open_clip_model, _open_clip_preprocess
    if _open_clip_error is not None:
        return None, None

    try:
        import open_clip
        import torch
        model, _, preprocess = open_clip.create_model_and_transforms(
            settings.OPENCLIP_MODEL,
            pretrained=settings.OPENCLIP_PRETRAINED
        )
        model.eval()
        _open_clip_model = model
        _open_clip_preprocess = preprocess
        print(f"[AI] Successfully loaded OpenCLIP model: {settings.OPENCLIP_MODEL} ({settings.OPENCLIP_PRETRAINED})")
        return _open_clip_model, _open_clip_preprocess
    except Exception as e:
        _open_clip_error = str(e)
        print(f"[AI] Notice: OpenCLIP could not be loaded ({e}). Using documented baseline image fallback.")
        return None, None

def get_ai_engine_info() -> Dict[str, Any]:
    """Returns technical details on currently active neural embedding models or baseline fallbacks."""
    st_model = _get_sentence_transformer()
    clip_model, _ = _get_open_clip()

    using_neural_text = st_model is not None
    using_neural_image = clip_model is not None

    if using_neural_text and using_neural_image:
        mode = "Neural (SentenceTransformer + OpenCLIP)"
    elif using_neural_text:
        mode = "Hybrid (SentenceTransformer + Baseline Image Fallback)"
    else:
        mode = "Baseline Fallback (Deterministic Token & Color Space)"

    return {
        "mode": mode,
        "is_fallback": not (using_neural_text and using_neural_image),
        "text_model": settings.SENTENCE_TRANSFORMER_MODEL if using_neural_text else "BaselineTokenHash (128-dim)",
        "image_model": f"{settings.OPENCLIP_MODEL} ({settings.OPENCLIP_PRETRAINED})" if using_neural_image else "BaselineColorSpatial (128-dim)",
        "text_error": _sentence_transformer_error,
        "image_error": _open_clip_error
    }

# =========================================================================
# 1. TEXT EMBEDDING PIPELINE
# =========================================================================

def _generate_baseline_text_embedding(text: str, dim: int = 128) -> List[float]:
    """
    Explicit baseline text embedding fallback:
    Deterministic semantic token hashing with character n-gram frequency projection.
    """
    if not text or not text.strip():
        return [0.0] * dim

    vec = np.zeros(dim, dtype=np.float32)
    tokens = text.lower().replace(",", " ").replace(".", " ").replace("-", " ").split()

    for i, token in enumerate(tokens):
        h = int(hashlib.sha256(token.encode('utf-8')).hexdigest(), 16)
        idx = h % dim
        weight = 1.0 / (math.log(len(token) + 2))
        vec[idx] += weight

        if i < len(tokens) - 1:
            bigram = f"{token}_{tokens[i+1]}"
            bh = int(hashlib.md5(bigram.encode('utf-8')).hexdigest(), 16)
            b_idx = bh % dim
            vec[b_idx] += 1.5

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

def generate_text_embedding(text: str) -> List[float]:
    """
    Generates an L2-normalized text embedding vector.
    Uses SentenceTransformer if available; otherwise uses deterministic baseline fallback.
    """
    if not text or not text.strip():
        return [0.0] * 128

    st = _get_sentence_transformer()
    if st is not None:
        try:
            emb = st.encode(text, normalize_embeddings=True)
            if hasattr(emb, "tolist"):
                emb = emb.tolist()
            # Validate output integrity
            arr = np.array(emb, dtype=np.float32)
            if np.isnan(arr).any() or np.isinf(arr).any():
                return _generate_baseline_text_embedding(text)
            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm
            return arr.tolist()
        except Exception as e:
            print(f"[AI] Warning running SentenceTransformer: {e}. Falling back to baseline.")
            return _generate_baseline_text_embedding(text)

    return _generate_baseline_text_embedding(text)

# =========================================================================
# 2. IMAGE EMBEDDING PIPELINE
# =========================================================================

def _generate_baseline_image_embedding(image_path: str, dim: int = 128) -> Optional[List[float]]:
    """
    Explicit baseline image embedding fallback:
    Color histogram (RGB 48 dims) + Spatial quadrant luminance (16 dims) + Gradient edge intensity (32 dims).
    """
    if not image_path or not os.path.exists(image_path):
        return None

    try:
        with Image.open(image_path) as img:
            img = img.convert('RGB').resize((64, 64))
            arr = np.array(img, dtype=np.float32) / 255.0

            r_hist, _ = np.histogram(arr[:, :, 0], bins=16, range=(0, 1))
            g_hist, _ = np.histogram(arr[:, :, 1], bins=16, range=(0, 1))
            b_hist, _ = np.histogram(arr[:, :, 2], bins=16, range=(0, 1))
            color_feats = np.concatenate([r_hist, g_hist, b_hist]).astype(np.float32)

            luminance = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
            grid_feats = []
            for r in range(4):
                for c in range(4):
                    block = luminance[r*16:(r+1)*16, c*16:(c+1)*16]
                    grid_feats.append(np.mean(block))
            grid_feats = np.array(grid_feats, dtype=np.float32)

            dx = np.abs(luminance[:, 1:] - luminance[:, :-1])
            dy = np.abs(luminance[1:, :] - luminance[:-1, :])
            grad_x, _ = np.histogram(dx, bins=16, range=(0, 1))
            grad_y, _ = np.histogram(dy, bins=16, range=(0, 1))
            texture_feats = np.concatenate([grad_x, grad_y]).astype(np.float32)

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
        print(f"[AI] Warning in baseline image processing: {e}")
        return None

def generate_image_embedding(image_path: str) -> Optional[List[float]]:
    """
    Generates an L2-normalized image embedding vector.
    Uses OpenCLIP if available; otherwise uses documented baseline image fallback.
    """
    if not image_path or not os.path.exists(image_path):
        return None

    clip_model, preprocess = _get_open_clip()
    if clip_model is not None and preprocess is not None:
        try:
            import torch
            with Image.open(image_path) as img:
                image_tensor = preprocess(img.convert("RGB")).unsqueeze(0)
                with torch.no_grad():
                    image_features = clip_model.encode_image(image_tensor)
                    image_features /= image_features.norm(dim=-1, keepdim=True)
                emb = image_features.squeeze(0).cpu().numpy().tolist()
                arr = np.array(emb, dtype=np.float32)
                if np.isnan(arr).any() or np.isinf(arr).any():
                    return _generate_baseline_image_embedding(image_path)
                return arr.tolist()
        except Exception as e:
            print(f"[AI] Warning running OpenCLIP: {e}. Falling back to baseline.")
            return _generate_baseline_image_embedding(image_path)

    return _generate_baseline_image_embedding(image_path)

# =========================================================================
# 3. MULTI-MODAL PROXIMITY CALCULATIONS
# =========================================================================

def cosine_similarity(v1: Optional[List[float]], v2: Optional[List[float]]) -> float:
    """Calculates cosine similarity between two float vectors, bounded to [0.0, 1.0]."""
    if not v1 or not v2:
        return 0.0
    if len(v1) != len(v2):
        # Handle dimension differences if mixed models by truncating to min
        min_dim = min(len(v1), len(v2))
        v1 = v1[:min_dim]
        v2 = v2[:min_dim]

    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    
    if np.isnan(a).any() or np.isnan(b).any():
        return 0.0

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0

    dot = float(np.dot(a, b))
    sim = dot / (norm_a * norm_b)
    return float(max(0.0, min(1.0, (sim + 1.0) / 2.0 if sim < 0 else sim)))

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns great-circle distance in kilometers between two geographic coordinates."""
    r = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c

def calculate_location_score(
    lat1: Optional[float], lon1: Optional[float],
    lat2: Optional[float], lon2: Optional[float],
    loc1: str, loc2: str
) -> float:
    """Computes a location proximity score [0.0, 1.0] using coordinates or name similarity."""
    if lat1 is not None and lon1 is not None and lat2 is not None and lon2 is not None:
        km = calculate_haversine_distance(lat1, lon1, lat2, lon2)
        return float(math.exp(-km / 6.0))

    # Fallback to text matching on location names
    loc1_clean = (loc1 or "").lower().strip()
    loc2_clean = (loc2 or "").lower().strip()
    if not loc1_clean or not loc2_clean:
        return 0.30
    if loc1_clean == loc2_clean:
        return 1.0
    if loc1_clean in loc2_clean or loc2_clean in loc1_clean:
        return 0.85

    words1 = set(loc1_clean.split())
    words2 = set(loc2_clean.split())
    intersection = words1.intersection(words2)
    if intersection:
        return 0.70
    return 0.30

def calculate_date_score(d1, d2) -> float:
    """Computes date proximity score [0.0, 1.0] with exponential temporal decay."""
    if not d1 or not d2:
        return 0.50
    diff_days = abs((d1 - d2).total_seconds()) / 86400.0
    return float(math.exp(-diff_days / 8.0))

