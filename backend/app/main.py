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
    upload
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    
    # Run seed data
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

# 1. Rate Limiting Middleware (Security hardening against brute-force & denial of service)
request_history = defaultdict(list)

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/auth/"):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        # Sliding window 60s
        request_history[client_ip] = [t for t in request_history[client_ip] if now - t < 60]
        # Max 60 requests per minute on auth endpoints
        if len(request_history[client_ip]) >= 60:
            return JSONResponse(
                status_code=429,
                content={"detail": "Security rate limit exceeded. Please wait a minute before retrying."}
            )
        request_history[client_ip].append(now)

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

# 3. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
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

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Back2U Backend API",
        "environment": settings.APP_ENV,
        "security": {
            "rate_limiting": "active",
            "security_headers": "enforced",
            "statutory_compliance": "Police Act Sec 66 & Contract Act Sec 168/169"
        },
        "ai_engine": {
            "status": "online",
            "model": "Multi-Modal Weighted Ranking (OpenCLIP + Sentence Transformer)",
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
