# Back2U : Intelligent AI-Powered Lost & Found Platform

> *"Lost Today. Found Tomorrow."*  
> *"A Smarter, Legally-Compliant Civil Property Recovery Ecosystem."*

Back2U transforms traditional lost-and-found noticeboards into an automated, legally compliant, proactive recovery platform. It integrates:
- **Multi-Modal AI Ranking Engine**: Weighted vector scoring combining semantic text embeddings (Sentence Transformers), image embeddings (OpenCLIP), Haversine geospatial proximity, and temporal decay, backed by an explicit deterministic baseline fallback.
- **Privacy-Preserving Ownership Challenges**: Secret distinguishing marks and receipts never leak through public search or unauthorized APIs.
- **Statutory Legal Compliance**: Generates digital Lost Article Report certificates compliant with Indian Police Act Section 66/67, Indian Contract Act Sections 168/169, and masked government ID safeguards.
- **Transactional State Machine**: Enforces multi-claim dispute detection, finder/admin authorization barriers, dual-party physical handover verification, and idempotent single-credit reward accounting.

---

## 🏗️ Architecture & Technology Stack

```
   [ React Frontend (Vite + TypeScript + Tailwind + React Router 7) ]
                                 │
                                 ▼
                     [ FastAPI REST Backend ]
                    /           │            \
                   /            │             \
  [ PostgreSQL with pgvector ] [ Uploads ]   [ Multi-Modal AI Engine ]
  • Users, Roles, RBAC         • Auth-Gated   • Sentence Transformers (all-MiniLM-L6-v2)
  • Items (>50k Index-tuned)   • Magic-Bytes  • OpenCLIP (ViT-B-32)
  • Claims & Disputes          • Safe Hashes  • Documented Baseline Fallback
  • Audit Ledger & Rewards                    • MRR & Ranking Benchmark Evaluation
```

---

## 🔒 Security Hardening & Audit Checklist

- **Strict Environment Validation**: `Settings` enforces that in `APP_ENV=production`, `SECRET_KEY` must be $\ge 32$ random characters, PostgreSQL must be used (SQLite prohibited), debug mode is disabled, and demo logins/seeding are locked out.
- **CORS Restriction**: CORS is restricted to explicitly configured `CORS_ORIGINS` (no `["*"]` with credentials).
- **Protected File Uploads**: Uploads require JWT authentication, reject SVG vectors to prevent stored XSS, validate image magic bytes and PIL decoding, enforce configurable size limits, and assign cryptographically random filenames.
- **Data Leakage & IDOR Prevention**: Private distinguishing clues (`private_clues`), serial numbers, purchase receipts, and claimant evidence photos are strictly restricted to the item's reporter, claimant, or administrator.
- **Multi-Path Sliding-Window Rate Limiting**:
  - `/api/auth/`: Maximum 60 requests/minute per IP.
  - `/api/claims`: Maximum 15 requests/minute per IP.
  - `/api/upload`: Maximum 15 requests/minute per IP.
- **Security Headers**: Enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security`.
- **Safe Error Responses**: Unhandled exceptions return generic sanitized JSON errors in production without exposing stack traces or database queries.

---

## 🤖 AI Multi-Modal Ranking Engine

$$\text{Ranking Score} = w_{\text{img}} S_{\text{img}} + w_{\text{txt}} S_{\text{txt}} + w_{\text{loc}} S_{\text{loc}} + w_{\text{date}} S_{\text{date}}$$

| Modality | Default Weight | Implementation |
| :--- | :--- | :--- |
| **Semantic Text** | **35%** | `SentenceTransformer("all-MiniLM-L6-v2")` with $L_2$ normalization |
| **Image Features** | **40%** | `open_clip.create_model_and_transforms("ViT-B-32")` |
| **Location Proximity** | **15%** | Haversine distance with exponential decay ($\exp(-\text{km} / 6.0)$) + name fallback |
| **Date Proximity** | **10%** | Exponential temporal decay ($\exp(-\Delta\text{days} / 8.0)$) |
| **Category Multiplier** | Multiplier | Identical category: $1.05\times$, related: $0.85\times$, incompatible: $0.60\times$ |

### Explicit Documented Baseline Fallback
If pretrained neural weights cannot be loaded (e.g. offline environments, minimal CPU containers), the system seamlessly runs `BaselineDeterministicEngine`:
- Text: 128-dimensional token SHA-256 and bigram MD5 frequency projections.
- Image: 128-dimensional RGB color histograms, quadrant spatial luminance, and gradient edge textures.
- The platform reports its active mode honestly via `/api/health` (`"Neural"`, `"Hybrid"`, or `"Baseline Fallback"`).
- Scores are strictly treated as **Ranking Relevance**, bounded at 98%, and labeled as `"Potential Match"` — never as absolute proof of ownership.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 2. Backend Setup
```bash
cd backend
# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

---

## 🧪 Automated Testing & Verification

Run the comprehensive pytest suite covering authentication, authorization, uploads, state machine transitions, disputes, handover, and AI ranking:

```bash
cd backend
pytest -v
```

Execution Result:
```
====================== 31 passed, 257 warnings in 11.91s ======================
```

Run frontend production build & TypeScript verification:
```bash
cd frontend
npm run build
```
Execution Result:
```
✓ built in 2.24s
0 TypeScript errors, 0 Vite errors.
```

---

## 🔥 Firebase Database & Realtime Sync Setup

Back2U supports dual-persistence and real-time event streaming powered by **Google Cloud Firestore** and **Firebase Realtime Database**.

### 1. Frontend Web Configuration (Real-Time Subscriptions & In-App Chat)
1. Go to the [Firebase Console](https://console.firebase.google.com/) and open or create your project.
2. Under **Project Settings > General > Your Apps**, click **Web (`</>`)** to register a web application.
3. In `frontend/.env` (or create from `frontend/.env.example`), paste your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   # Optional: Realtime Database
   VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
   ```
4. Click the **Firebase DB** indicator button in the top navigation bar to run an instant latency ping test.

### 2. Backend Admin SDK Configuration (Cloud Firestore Mirroring)
1. Under **Project Settings > Service Accounts**, click **Generate New Private Key**.
2. Save the downloaded JSON file as `backend/serviceAccountKey.json`.
3. In `backend/.env`, set:
   ```env
   FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
   ```
4. Now, any item reported or claim updated is automatically mirrored to Firestore in real-time.
5. To push all existing relational database items to Firestore, trigger:
   ```bash
   POST /api/firebase/sync-all
   ```

### 3. Firestore Collections Architecture
- `items`: Real-time public catalog feeds with geographic and status attributes.
- `claims`: Verification status and authorized audit logs.
- `items/{itemId}/messages`: Direct live messaging channel between finder and claimant.
- `users/{userId}/notifications`: Push-updated user alerts.

---

## 🐳 Docker & Production Deployment Guide

### 1. Production Docker Compose
Configure environment variables in `.env` (or pass via CI/CD secrets):
```bash
POSTGRES_DB=back2u
POSTGRES_USER=back2u_user
POSTGRES_PASSWORD=<STRONG_RANDOM_PASSWORD>
SECRET_KEY=<CRYPTOGRAPHICALLY_RANDOM_32_CHAR_SECRET>
APP_ENV=production
CORS_ORIGINS=https://yourdomain.com
VITE_API_URL=""
```

Build and launch containers:
```bash
docker-compose up -d --build
```

Container Topology:
1. `back2u-postgres`: PostgreSQL 16 with `pgvector`, persistent data volume, and `pg_isready` health check.
2. `back2u-backend`: FastAPI application, healthcheck on `/api/health`, volume-mounted uploads, starts only after database is healthy.
3. `back2u-frontend`: Nginx Alpine serving production Vite bundle with SPA routing fallback (`try_files $uri /index.html`), reverse-proxying `/api` and `/uploads` to the backend.

### 2. Database Migrations in Production
Before traffic goes live on a new release:
```bash
docker-compose exec backend alembic upgrade head
```

### 3. Database Backups
```bash
# Automated daily backup
docker-compose exec -T db pg_dump -U back2u_user -d back2u > backup_$(date +%F).sql
```

### 4. Rollback Strategy
```bash
# Revert last database migration if required
docker-compose exec backend alembic downgrade -1
# Revert to previous release image tag
docker-compose up -d --no-deps backend
```

---

## 🌐 External Services & Cost Analysis

| Service | Purpose | Recommended Provider | Estimated Cost |
| :--- | :--- | :--- | :--- |
| **Database** | Relational DB + pgvector | Managed PostgreSQL (Supabase / AWS RDS / Neon) | \$0 - \$25 / month |
| **SMS Gateway** | Phone OTP verification | Twilio / MSG91 / AWS SNS | ~\$0.0079 per SMS OTP |
| **File Storage** | Uploaded photos & evidence | AWS S3 / Cloudflare R2 / Local Volume | \$0.015 / GB-month |
| **Firebase Auth** | Google / Social sign-in (Optional) | Google Firebase Identity Platform | Free up to 50k MAUs |
| **Compute / VPS** | Backend + Frontend hosting | DigitalOcean / Hetzner / AWS EC2 (2 CPU, 4GB RAM) | \$12 - \$24 / month |

---

## 📋 Before & After Change Summary

| Area | Before Audit | After Audit & Fix |
| :--- | :--- | :--- |
| **Production Secrets** | Hardcoded JWT secret and DB password in code and Docker compose | Dynamic `.env` configuration, strict $>32$ char validator, no credentials committed |
| **Database Reliability** | Silent fallback to SQLite on connection errors | Hard failure in production; automated Alembic migration for all tables and composite indexes |
| **CORS Configuration** | `allow_origins=["*"]` with `credentials=True` | Restricted to explicit `CORS_ORIGINS` whitelist |
| **File Uploads** | Unauthenticated, permitted `.svg` (XSS), extension-only check | Authenticated, no SVGs, PIL magic-bytes format validation, 10MB limit, unique hex naming |
| **Data Privacy** | Private clues & claimant photos risked leakage | Backend filters `private_clues` and claimant evidence photos strictly to reporter/claimant/admin |
| **Rate Limiting** | Auth routes only | Expanded to `/api/auth/` (60/min), `/api/claims` (15/min), and `/api/upload` (15/min) |
| **Demo Accounts** | Always accessible, auto-seeded on every startup | Explicitly disabled and blocked with 403 Forbidden in `APP_ENV=production` |
| **Ownership Workflow** | No transition validation; disputed items could be approved by finders | Explicit transition state machine; multiple claimants flag dispute requiring admin review |
| **Recovery & Handover** | Single party could complete; duplicate points risked | Dual-party confirmation required; idempotent transactional single-credit reward accounting |
| **AI Matching** | Described as OpenCLIP but used handcrafted unigrams | Genuine SentenceTransformers and OpenCLIP inference with explicit documented baseline fallback |
| **Evaluation Metrics** | Fabricated percentages | Formal `evaluate_ranking()` computing genuine MRR, Hit@1, and Hit@3 on labelled benchmarks |
| **Docker & Nginx** | Single-stage, broken SPA routing, no healthchecks | Multi-stage build with SPA `nginx.conf`, API reverse proxy, healthchecks, and dependency ordering |
| **Automated Tests** | 0 automated tests | 25 automated tests executed via pytest covering all security, state, AI, and upload flows (100% pass) |
