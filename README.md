# Back2U : AI-Powered Lost & Found Recovery Platform

> *“Lost Today. Found Tomorrow.”*  
> *“Lost it? Let AI bring it Back2U.”*

Back2U transforms traditional, passive lost-and-found noticeboards into an intelligent, proactive recovery network. It combines **multi-modal AI matching (images, semantic text, location, and time proximity)** with **privacy-preserving ownership verification** and a **community incentives system (Back2U Points & Trust Scores)**.

---

## 📸 Visual Identity & UI Design

Inspired directly by the approved Back2U visual mockup:
- **Theme**: Premium dark-mode space aesthetic (deep navy `#070B14`, electric blue `#3B82F6`, cyan `#38BDF8`, indigo `#6366F1`).
- **Floating Space Debris**: Subtle everyday objects (water bottles, earbuds, keys, wallets, phones, backpacks, sunglasses) drifting smoothly in the background with delicate blue rim lighting.
- **Logo Animation**: Smooth entrance animation that reveals the Back2U wordmark and fades into the platform.
- **Responsive Layout**: Designed for Desktop, Tablet, and Mobile with collapsible navigation, full-width forms, and interactive cards.

---

## 🏗️ Architecture & Technology Stack

```
   [ React Frontend (Vite + Tailwind + TanStack Query + React Router) ]
                                 │
                                 ▼
                     [ FastAPI REST Backend ]
                    /           │            \
                   /            │             \
  [ PostgreSQL / SQLite ] [ Uploads / Storage ] [ AI Multi-Modal Engine ]
  • Users, Roles, Trust   • Photos & Receipts   • OpenCLIP / Visual embeddings
  • Lost & Found Items                          • Sentence Transformers (Text)
  • Claims & Disputes                           • Weighted Ranking Service
  • Back2U Points Ledger                        • Location & Date Proximity
```

### Frontend (`/frontend`)
- **React 18** with **TypeScript** and **Vite**
- **Tailwind CSS** with custom dark-space tokens and animations
- **React Router v6** with route protection and full RBAC
- **Lucide React** icons
- **Canvas Confetti** for successful recovery celebrations

### Backend (`/backend`)
- **Python 3.11+** with **FastAPI**
- **SQLAlchemy 2.0 ORM** with flexible SQLite/PostgreSQL engine
- **Pydantic v2** validation models
- **Bcrypt & JWT Auth** + Firebase Token Verification Adapter
- **Multi-Modal AI Ranking Engine**:
  - Image Similarity (40%)
  - Semantic Text Similarity (35%)
  - Location Proximity (15%)
  - Date & Time Proximity (10%)

---

## 🚀 Quick Start (Local Development)

### 1. Backend Server
```powershell
cd c:\Users\morep\OneDrive\Desktop\Back2U\backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run FastAPI with Uvicorn
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): **http://127.0.0.1:8000/docs**  
Health Check: **http://127.0.0.1:8000/api/health**

### 2. Frontend Development Server
```powershell
cd c:\Users\morep\OneDrive\Desktop\Back2U\frontend

# Start Vite dev server
npm run dev -- --host 127.0.0.1 --port 5173
```
Open **http://127.0.0.1:5173** in your browser.

---

## 👥 Demo Accounts (1-Click Login)

The platform seeds realistic demo data matching the project presentation slides and mockup. You can switch personas instantly using the **"Demo Accounts"** button in the top navigation bar:

| Persona | Email | Role | Profile Summary |
| :--- | :--- | :--- | :--- |
| **Rohan (Finder)** | `rohan@back2u.org` | Finder | Found AirPods and wallet. Reviews incoming ownership challenges. |
| **Priya (Owner)** | `priya@back2u.org` | Owner | Lost AirPods Pro in Library. Receives 94% AI potential match alerts. |
| **Vikram (Claimant)** | `vikram@back2u.org` | Claimant | Contested claim on leather wallet. Tests anti-fraud & penalty flows. |
| **Alex (Admin)** | `admin@back2u.org` | Admin | Full control over dispute mediation, unclaimed auctions, and audit logs. |

*(All demo accounts use password: `password123`)*

---

## 🔒 Privacy & Anti-Fraud Security Rules

1. **Private Distinguishing Clues**:
   - Hidden marks, secret compartments, engravings, and receipts are **never exposed** through search results or public APIs.
   - Claimants must supply matching answers in a challenge-response workflow before approval.
2. **Dispute Detection**:
   - Multiple claimants on the same found item automatically lock the item into a **Disputed Case** state, preventing unilateral handover until an administrator evaluates both parties' evidence.
3. **Trust & Penalty Points**:
   - Genuine report of found item: **+50 Points**
   - Verified return to owner: **+150 Points** & Trust Score boost
   - False ownership claim: **−10 Points** penalty
   - Fraudulent abuse: **−25 Points** and account restriction
4. **Legitimate "Request to Buy"**:
   - Users who want an unclaimed item cannot falsely claim ownership; they can submit a legitimate purchase offer through the Marketplace.

---

## 🌐 Routes Overview

| Route | Page Purpose | Access Level |
| :--- | :--- | :--- |
| `/` | Landing page (Hero search, Floating debris, Recent cards) | Public |
| `/search` | Advanced search & discovery with multi-filter controls | Public |
| `/items/:id` | Item details, AI match scan, claim modal, buy request | Public-safe |
| `/report/lost` | Submit lost item report with private clue protection | Authenticated |
| `/report/found` | Submit found item report & custody status (+50 pts) | Authenticated |
| `/my-reports` | Manage submitted reports, edit, or close | Authenticated |
| `/claims` | Review evidence or track outgoing claims | Authenticated |
| `/recovery/:id` | Handover coordination & dual return confirmation | Authorized |
| `/rewards` | Points wallet, trust score gauge, transaction ledger | Authenticated |
| `/marketplace` | Unclaimed item auctions & buy requests | Authenticated |
| `/notifications`| Real-time alerts for AI matches and claims | Authenticated |
| `/profile` | User identity & reputation standing | Authenticated |
| `/admin` | Admin dashboard with real platform statistics | Admin Only |
| `/admin/claims` | Review disputed and high-risk claims | Admin Only |
| `/admin/items` | Route unclaimed belongings to auction, donation, police | Admin Only |
| `/admin/users` | Manage abuse reports and apply penalty points | Admin Only |
| `/admin/audit-logs` | Chronological immutable security audit logs | Admin Only |
