import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database

# Import routers
from app.routers import (
    auth,
    items,
    matching,
    claims,
    recovery,
    rewards,
    marketplace,
    notifications,
    admin,
    upload,
    firebase_sync
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # In production, migrations manage schema; create_all is used only in development/testing
    if settings.APP_ENV != "production":
        Base.metadata.create_all(bind=engine)
        
        # Run seed data if enabled
        if settings.ENABLE_AUTO_SEED:
            db = SessionLocal()
            try:
                seed_database(db)
            finally:
                db.close()
        
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Back2U AI-Powered Lost & Found Platform REST API",
    version="1.0.0",
    lifespan=lifespan
)

# 1. Rate Limiting Middleware (Security hardening against brute-force, claims spam, and upload flood)
request_history = defaultdict(list)

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    path = request.url.path
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Configure per-route thresholds: (prefix, max_requests_per_minute)
    throttled_paths = [
        ("/api/auth/", 60),
        ("/api/claims", 15),
        ("/api/upload", 15)
    ]
    
    for prefix, max_req in throttled_paths:
        if path.startswith(prefix):
            key = f"{client_ip}:{prefix}"
            request_history[key] = [t for t in request_history[key] if now - t < 60]
            if len(request_history[key]) >= max_req:
                return JSONResponse(
                    status_code=429,
                    content={"detail": f"Rate limit exceeded for {prefix}. Maximum {max_req} requests per minute. Please try again shortly."}
                )
            request_history[key].append(now)
            break

    return await call_next(request)

# 2. Strict Security Headers Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# 3. Global Exception Handler (Suppress stack traces in production)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact the administrator."}
    )

# 4. Strict CORS Configuration (Restricted to configured origins, credentials allowed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Static file serving for public uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(items.router)
app.include_router(matching.router)
app.include_router(claims.router)
app.include_router(recovery.router)
app.include_router(rewards.router)
app.include_router(marketplace.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(upload.router)
app.include_router(firebase_sync.router)

@app.get("/api/health")
def health_check():
    from app.ai.embeddings import get_ai_engine_info
    ai_info = get_ai_engine_info()
    return {
        "status": "healthy",
        "service": "Back2U Backend API",
        "environment": settings.APP_ENV,
        "security": {
            "rate_limiting": "active",
            "security_headers": "enforced",
            "cors_origins": settings.cors_origins_list,
            "statutory_compliance": "Police Act Sec 66 & Contract Act Sec 168/169"
        },
        "ai_engine": {
            "status": "online",
            "text_model": ai_info.get("text_model"),
            "image_model": ai_info.get("image_model"),
            "engine_mode": ai_info.get("mode"),
            "weights": {
                "image_similarity": settings.WEIGHT_IMAGE,
                "text_similarity": settings.WEIGHT_TEXT,
                "location_proximity": settings.WEIGHT_LOCATION,
                "date_proximity": settings.WEIGHT_DATE
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

