# 🧠 Umurava AI — Talent Screening Platform

> AI-powered candidate screening built for Rwanda's growing workforce.
> Screen, rank, and shortlist top candidates in seconds — not days.

Built by **Debug Thugs** · Umurava AI Hackathon 2026 · Kigali, Rwanda

---

## 🔗 Live Links

| | URL |
|--|--|
| 🌐 Frontend (Vercel) | https://ai-umurava.vercel.app |
| ⚙️ Backend API (Railway) | https://ai-recruiter-production-c6b5.up.railway.app |
| 📁 GitHub | https://github.com/D-Audit/ai-recruiter |

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [AI Decision Flow](#3-ai-decision-flow)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [Setup Instructions](#6-setup-instructions)
7. [Environment Variables](#7-environment-variables)
8. [API Reference](#8-api-reference)
9. [Deployment Guide](#9-deployment-guide)
10. [Assumptions and Limitations](#10-assumptions-and-limitations)
11. [Team](#11-team)

---

## 1. Project Overview

### The Problem

Rwandan recruiters face two critical challenges every hiring cycle:

1. **Volume** — Hundreds of CVs to review manually for every job posting
2. **Consistency** — No structured way to compare candidates objectively across diverse backgrounds and formats

### What We Built

Umurava AI is a full-stack recruiter platform that lets hiring teams:

- Post job listings with required skills, experience levels, education requirements, and location
- Ingest candidates from **five different sources** in any format (Umurava pool, CSV, Excel, PDF/DOCX resumes, manual form entry, URL import)
- Run **Google Gemini AI** to automatically score every candidate 0–100 on a transparent rubric
- View a **ranked Top 10 or Top 20 shortlist** with detailed AI explanations per candidate
- **Compare 2–3 finalists** side-by-side with an AI verdict and per-category reasoning
- **Chat with an AI assistant** about any screening result at any time
- Always keep **humans in control** of final hiring decisions — AI is decision-support only

### Hackathon Scenario Coverage

| Scenario | Status | Implementation |
|----------|--------|----------------|
| Scenario 1: Umurava platform profiles | ✅ Full | Select from seeded Umurava talent pool following official schema |
| Scenario 2: External candidates — CSV/Excel | ✅ Full | Bulk upload, column auto-detection, duplicate skipping |
| Scenario 2: External candidates — PDF/DOCX resumes | ✅ Full | Gemini AI parsing, staged upload with confirm button |
| Scenario 2: External candidates — Manual entry | ✅ Full | Multi-section form (skills, experience, education, certs, projects) |
| Scenario 2: External candidates — URL import | ✅ Full | Fetches and parses PDF/CSV/HTML at any URL |
| AI ranked shortlist Top 10 / Top 20 | ✅ Full | Configurable, batch-processed, re-rankable |
| AI explainability per candidate | ✅ Full | Strengths, gaps, upskilling paths, adjacent roles per result |
| Side-by-side candidate comparison | ✅ Full | Up to 3 finalists, AI winner verdict with evidence |
| Conversational AI assistant | ✅ Full | Ask anything about results in plain language |
| Bias awareness | ✅ Full | Bias notice shown on every screening run |
| Human-led decisions | ✅ Full | AI never auto-selects; recruiter controls all final decisions |

---

## 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND  (Next.js 16 · Vercel)                      │
│                                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Landing  │ │Dashboard │ │  Jobs    │ │Screening │ │   Candidates  │  │
│  │  Page    │ │  Page    │ │  Pages   │ │  Pages   │ │     Pages     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │     Redux Store (auth · jobs · applicants · screening)           │    │
│  │     screeningSlice → localStorage persistence per jobId         │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │     Axios HTTP Client + JWT Bearer Interceptor                   │    │
│  └──────────────────────────┬─────────────────────────────────────┘     │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │  HTTPS + Bearer Token
┌──────────────────────────────▼──────────────────────────────────────────┐
│                  BACKEND  (Node.js + Express · Railway)                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Helmet  │  Rate Limiter (100/min global · 20/min AI)              │  │
│  │  CORS    │  Morgan Logger  │  express-rate-limit                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────┐ ┌─────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │  /auth  │ │  /jobs  │ │/applicants │ │  /screening  │ │  /chat   │  │
│  └─────────┘ └─────────┘ └────────────┘ └──────┬───────┘ └────┬─────┘  │
│                                                 │              │        │
│  ┌──────────────────────────────────────────────▼──────────────▼──────┐  │
│  │                    AI Service Layer                                  │  │
│  │  ai.service.ts → screening.prompt.ts → ai.parser.ts                │  │
│  │                                      → ai.validator.ts             │  │
│  │  Batch processing: 20 candidates per Gemini call                   │  │
│  │  Retry logic: 3 retries · delays 2s / 4s / 6s on 503              │  │
│  │  Semantic cache: SHA256(jobId+candidateIds+weights) · 24h TTL      │  │
│  └────────────────────────────────────┬────────────────────────────────┘  │
│                                       │                                  │
│  ┌────────────────────────────────────┘                                  │
│  │  File Parsing Services                                               │
│  │  csv.service.ts  · xlsx.service.ts  · pdf.service.ts                │
│  │  resume.service.ts (DOCX/TXT/URL) · Gemini-powered extraction       │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │
              ┌────────────────────────┤
              │                        │
┌─────────────▼──────────┐   ┌────────▼─────────────────────┐
│   MongoDB Atlas         │   │   Google Gemini AI            │
│                         │   │   gemini-2.5-flash-preview    │
│  users                 │   │                               │
│  jobs                  │   │  Input:  Job + Candidates     │
│  applicants            │   │  Output: Ranked JSON          │
│  screeningresults      │   │  Temp:   0.3 (consistent)     │
│  caches (24h TTL)      │   └───────────────────────────────┘
└────────────────────────┘
```

---

## 3. AI Decision Flow

### Step-by-Step Process

```
STEP 1  Recruiter posts a job
        → title, description, requiredSkills[], yearsOfExperience,
          educationLevel, location, jobType saved to MongoDB

STEP 2  Recruiter adds candidates via any of 5 sources:
        → Option A: Select from Umurava platform talent pool
        → Option B: Upload CSV / Excel spreadsheet (bulk)
        → Option C: Upload PDF / DOCX / TXT resumes (staged confirm flow)
        → Option D: Fill in manual profile form
        → Option E: Paste a URL (resume link / spreadsheet / profile page)
        All candidates saved to MongoDB applicants collection
        with jobIds[] array linking them to the job.
        Real applicantsCount synced from Applicant.countDocuments()
        — never from $inc to prevent negative counts.

STEP 3  Recruiter clicks "Run AI Screening"
        → POST /api/screening/run/:jobId

STEP 4  Backend checks semantic cache
        → Cache key = SHA256(jobId + sorted applicantIds + scoring weights)
        → Cache HIT  → return stored result immediately (0 Gemini calls)
        → Cache MISS → proceed to Gemini

STEP 5  Backend fetches job + all applicants from MongoDB

STEP 6  Candidates split into batches of 20
        → Each batch sent to Gemini separately
        → 1-second delay between batches (rate-limit protection)
        → Retry: 503/429 errors retried 3× with 2s/4s/6s exponential delays

STEP 7  Build Gemini prompt (screening.prompt.ts) for each batch:
        → Job details section (title, skills, experience, education, location)
        → Candidates as formatted readable text — NOT raw JSON
        → Scoring weights: Skills 40% · Experience 25% · Education 20% · Extras 15%
        → Scores spread instructions (force meaningful gaps, no ties)
        → Strict JSON-only output instruction with schema definition
        → Request upskilling paths and adjacent roles per candidate
        → Bias awareness instruction

STEP 8  Gemini returns ranked JSON for each batch

STEP 9  Parse response (ai.parser.ts):
        → Strip markdown code fences
        → Extract JSON array
        → Fallback: manual field extraction if JSON.parse fails
        → Sanitize: join array strengths/gaps to readable strings

STEP 10 Validate response (ai.validator.ts):
        → Check all scores in 0–100 range
        → Normalise: round to whole numbers, enforce min/max
        → Verify candidate IDs exist in our database

STEP 11 Merge all batch results
        → Sort by score descending
        → Take top 10 (configurable: 10, 20, or all)
        → Re-assign sequential ranks 1 → N

STEP 12 Persist AI scores to each applicant record
        → applicant.aiScore field
        → applicant.confidenceLevel field (High / Medium / Low)

STEP 13 Upsert ScreeningResult document in MongoDB
        (replaces any previous result for this job)

STEP 14 Save full result to semantic cache (24h TTL)

STEP 15 Return ranked results to frontend + persist to localStorage
        (results survive page navigation without re-running screening)

STEP 16 Human recruiter reviews, compares finalists, uses AI chat
        → AI does NOT make the final hiring decision
        → Recruiter has full context + AI reasoning for each candidate
```

### Scoring Rubric

```
╔═══════════════════════════════════════════════════════════╗
║              SCORING BREAKDOWN (Total: 100 pts)           ║
╠═══════════════════════╦══════════╦═══════════════════════╣
║ Criteria              ║ Weight   ║ How Scored            ║
╠═══════════════════════╬══════════╬═══════════════════════╣
║ Skills Match          ║ 40 pts   ║ Count + proficiency   ║
║ Work Experience       ║ 25 pts   ║ Years + relevance     ║
║ Education             ║ 20 pts   ║ Degree level + field  ║
║ Location + Languages  ║ 15 pts   ║ Match bonuses + certs ║
╠═══════════════════════╬══════════╬═══════════════════════╣
║ TOTAL                 ║ 100 pts  ║                       ║
╚═══════════════════════╩══════════╩═══════════════════════╝

Shortlist   ≥ 70 pts
Consider    50–69 pts
Not Selected  < 50 pts
```

### AI Output Per Candidate

```json
{
  "candidateId": "664abc123...",
  "rank": 1,
  "score": 87,
  "confidence": "High",
  "strengths": "Strong React and TypeScript expertise directly matching all 4 required skills. 4 years experience exceeds the 3-year requirement.",
  "gaps": "No MongoDB experience listed. AWS certification would strengthen cloud readiness.",
  "recommendation": "Shortlist",
  "skillsMatched": ["React", "TypeScript", "Node.js"],
  "skillsMissing": ["MongoDB"],
  "upskillingPaths": [
    {
      "skill": "MongoDB",
      "reason": "Required for this role",
      "suggestedResource": "MongoDB University free course at university.mongodb.com"
    }
  ],
  "adjacentRoles": ["Frontend Architect", "React Native Developer", "Technical Lead"]
}
```

---

## 4. Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| TypeScript | 5.x | Type-safe development |
| Redux Toolkit | 2.x | Global state management + localStorage persistence |
| Tailwind CSS | 3.x | Utility-first styling |
| Axios | 1.x | HTTP client with JWT interceptors |
| Lucide React | 0.x | Icon library |
| React Hot Toast | 2.x | Toast notifications |
| React Dropzone | 14.x | Drag-and-drop file uploads with staged confirm flow |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime environment |
| TypeScript | 5.x | Type-safe development |
| Express.js | 4.x | REST API framework |
| MongoDB + Mongoose | 7.x + 8.x | Database and ODM |
| Google Gemini API | gemini-2.5-flash-preview | AI screening + resume parsing + chat |
| JWT + Bcryptjs | 9.x + 3.x | Auth and password hashing |
| Google OAuth 2.0 | GSI | Social sign-in (login/register with Google) |
| Multer | 2.x | File upload handling (PDF, DOCX, CSV, XLSX) |
| csv-parser | 3.x | CSV file processing |
| pdf-parse | 2.x | PDF text extraction |
| xlsx | 0.18.x | Excel file processing |
| mammoth | 1.x | DOCX text extraction |
| express-rate-limit | 8.x | API rate limiting (100/min global, 20/min AI) |
| helmet | 8.x | HTTP security headers |
| morgan | 1.x | Request logging |
| zod | 4.x | Runtime schema validation |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting with automatic CI/CD |
| Railway | Backend hosting with environment variable management |
| MongoDB Atlas | Cloud database with 24h TTL index for screening cache |

---

## 5. Project Structure

```
ai-recruiter/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                      # Landing page (public)
│   │   │   ├── layout.tsx                    # Root HTML layout + Google GSI preload
│   │   │   ├── globals.css                   # CSS design tokens + dark mode + animations
│   │   │   ├── providers.tsx                 # Redux + Toast providers
│   │   │   ├── login/page.tsx                # Login (email + Google OAuth)
│   │   │   ├── register/page.tsx             # Register (email + Google OAuth)
│   │   │   ├── dashboard/page.tsx            # Main dashboard with real-data charts
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx                  # Jobs list
│   │   │   │   ├── create/page.tsx           # Create job form
│   │   │   │   └── [id]/page.tsx             # Job detail hub
│   │   │   ├── applicants/
│   │   │   │   ├── page.tsx                  # Upload candidates (5 methods, staged PDF)
│   │   │   │   └── screenings/page.tsx       # Legacy redirect to /screenings
│   │   │   ├── screenings/
│   │   │   │   └── page.tsx                  # Screenings list + results (auto-load)
│   │   │   ├── candidates/
│   │   │   │   ├── page.tsx                  # All candidates list
│   │   │   │   ├── [id]/page.tsx             # Candidate detail profile
│   │   │   │   └── compare/page.tsx          # Side-by-side AI comparison
│   │   │   ├── profile/page.tsx              # Recruiter profile (updateProfile)
│   │   │   └── settings/page.tsx             # Settings + theme + changePassword
│   │   ├── components/
│   │   │   ├── Sidebar.tsx                   # Navigation sidebar (dark navy)
│   │   │   ├── AppHeader.tsx                 # Page header + user dropdown
│   │   │   ├── FloatingAI.tsx                # Bottom-right AI chat bubble
│   │   │   ├── ScreeningResults.tsx          # Ranked candidates + compare UI
│   │   │   ├── LoadingSpinner.tsx            # Shared loading component
│   │   │   └── AnimatedLogo.tsx              # Animated brand logo component
│   │   ├── store/
│   │   │   ├── index.ts                      # Redux store
│   │   │   └── slices/
│   │   │       ├── authSlice.ts              # Auth (email + Google OAuth)
│   │   │       ├── jobSlice.ts               # Jobs + syncJobCount (real DB count)
│   │   │       ├── applicantSlice.ts         # Applicant state
│   │   │       └── screeningSlice.ts         # Screening + localStorage persistence
│   │   ├── services/
│   │   │   ├── api.ts                        # Axios base + JWT interceptor
│   │   │   ├── authService.ts                # login, register, updateProfile, changePassword
│   │   │   ├── jobService.ts
│   │   │   ├── applicantService.ts
│   │   │   ├── screeningService.ts           # runScreening, getResults, compareApplicants
│   │   │   └── chatService.ts
│   │   ├── types/index.ts                    # TypeScript interfaces
│   │   └── utils/screeningChatContext.ts     # AI chat context builder
│   ├── .env.local                            # Frontend environment variables
│   └── package.json
│
├── umurava-backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts                         # MongoDB connection
│   │   │   └── gemini.ts                     # Gemini AI model config
│   │   ├── models/
│   │   │   ├── User.model.ts                 # Recruiter accounts
│   │   │   ├── Job.model.ts                  # Job postings
│   │   │   ├── Applicant.model.ts            # Candidate profiles (Umurava schema)
│   │   │   └── ScreeningResult.model.ts      # AI results + upskilling paths
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── job.routes.ts
│   │   │   ├── applicant.routes.ts           # Fixed: uploadResume + uploadCSV only
│   │   │   ├── screening.routes.ts
│   │   │   └── chat.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts            # email auth + Google OAuth JWT
│   │   │   ├── job.controller.ts
│   │   │   ├── applicant.controller.ts       # syncApplicantsCount — never negative
│   │   │   ├── screening.controller.ts       # Semantic cache + batch AI
│   │   │   └── chat.controller.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts                 # Core Gemini AI + batch + retry
│   │   │   ├── cache.service.ts              # SHA256 semantic cache (24h TTL)
│   │   │   ├── csv.service.ts                # CSV + XLSX parsing
│   │   │   ├── pdf.service.ts                # PDF text extraction
│   │   │   ├── xlsx.service.ts               # Excel parsing
│   │   │   └── resume.service.ts             # DOCX + TXT + URL + Gemini extraction
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts            # JWT protect middleware
│   │   │   └── upload.middleware.ts          # Multer (CSV/PDF/XLSX/DOCX/TXT)
│   │   ├── prompts/
│   │   │   └── screening.prompt.ts           # Gemini prompt engineering (documented)
│   │   ├── types/index.ts
│   │   ├── utils/
│   │   │   ├── ai.parser.ts                  # JSON extraction + fallback + sanitizer
│   │   │   ├── ai.validator.ts               # Score validation + normalisation
│   │   │   └── ai.test.ts                    # 4-test AI verification suite
│   │   ├── seed/seedData.ts                  # 5 Umurava-schema test profiles
│   │   └── index.ts                          # Express server entry point
│   ├── uploads/                              # Temp file storage (.gitkeep)
│   ├── .env                                  # Backend environment variables
│   └── package.json
│
└── README.md                                 # This file (root)
```

---

## 6. Setup Instructions

### Prerequisites

- Node.js 18 or higher
- MongoDB running locally OR a MongoDB Atlas account
- Google Gemini API key (free) from https://aistudio.google.com/apikey
- Google OAuth Client ID (optional, for Google sign-in) from https://console.cloud.google.com

### Step 1 — Clone

```bash
git clone https://github.com/D-Audit/ai-recruiter.git
cd ai-recruiter
```

### Step 2 — Backend Setup

```bash
cd umurava-backend
npm install
```

Create `.env` file:

```bash
# Windows
copy nul .env

# Mac / Linux
touch .env
```

Fill in the values from Section 7 below, then:

```bash
# Seed database with 5 Umurava-schema test profiles
npm run seed

# (Optional) Test Gemini AI connection
npm run test:ai

# Start development server
npm run dev
```

Backend runs at: `http://localhost:5000`

Health check: `GET http://localhost:5000/` → `{ "status": "ok" }`

### Step 3 — Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Step 4 — Test the Full Flow

```
1. Go to http://localhost:3000
2. Click "Get started free" → Register an account
3. Login (email or Google)
4. Dashboard → "Post a Job" → fill in job + required skills
5. Go to Applicants → Upload File tab
   - CSV tab: upload a candidate spreadsheet
   - PDF tab: drop resumes → staged list → click "Upload X Files"
6. Umurava Talent tab: select seeded profiles
7. Click "Run AI Screening"
8. View ranked shortlist with scores and explanations
9. Select 2–3 candidates → "Compare Side-by-Side" → view AI verdict
10. Use "Assistant AI" chat bubble → ask about results in plain language
```

---

## 7. Environment Variables

### Backend — `umurava-backend/.env`

```env
# ── Server ───────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ─────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/umurava_db
# Atlas (production):
# MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/umurava_db?retryWrites=true&w=majority

# ── Authentication ────────────────────────────────────────────
JWT_SECRET=debugthugs_umurava_ai_hackathon_2026_secret_key_very_long_random

# ── Google Gemini AI ──────────────────────────────────────────
# Free key from: https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaSy_your_key_here

# ── Google OAuth (optional — enables Google sign-in) ─────────
GOOGLE_CLIENT_ID=your_google_client_id_here

# ── CORS (required for production) ───────────────────────────
FRONTEND_URL=http://localhost:3000
```

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default 5000) | Yes |
| NODE_ENV | `development` or `production` | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | Token signing secret (32+ chars) | Yes |
| GEMINI_API_KEY | Google Gemini AI key | Yes |
| GOOGLE_CLIENT_ID | Google OAuth client ID | Optional |
| FRONTEND_URL | Allowed CORS origin | Yes in production |

### Frontend — `frontend/.env.local`

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Google OAuth client ID (same as backend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

---

## 8. API Reference

All protected routes require: `Authorization: Bearer <token>`

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Create recruiter account | No |
| POST | /api/auth/login | Login, returns JWT | No |
| POST | /api/auth/google | Google OAuth — verify credential, return JWT | No |
| GET | /api/auth/me | Get current user | Yes |
| PUT | /api/auth/me | Update profile (updateProfile) | Yes |
| POST | /api/auth/change-password | Change password | Yes |

### Jobs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/jobs | All jobs for this recruiter | Yes |
| POST | /api/jobs | Create job posting | Yes |
| GET | /api/jobs/:id | Get one job | Yes |
| PUT | /api/jobs/:id | Update job | Yes |
| DELETE | /api/jobs/:id | Delete job | Yes |

### Applicants

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/applicants/umurava | Umurava talent pool profiles | Yes |
| GET | /api/applicants/profile/:id | Single applicant by ID | Yes |
| GET | /api/applicants/:jobId | All applicants for a job | Yes |
| POST | /api/applicants/select | Add Umurava profiles to job | Yes |
| POST | /api/applicants/manual | Add candidate manually | Yes |
| POST | /api/applicants/upload/csv | Upload CSV or Excel file | Yes |
| POST | /api/applicants/upload/pdf | Upload PDF (maps to uploadResume) | Yes |
| POST | /api/applicants/upload/xlsx | Upload XLSX (maps to uploadCSV) | Yes |
| POST | /api/applicants/upload/resume | Upload PDF/DOCX/DOC/TXT (multi) | Yes |
| POST | /api/applicants/upload/url | Import candidate from URL | Yes |
| DELETE | /api/applicants/:jobId/applicant/:applicantId | Remove from job (syncs real count) | Yes |

### Screening

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/screening/run/:jobId | Run AI screening | Yes |
| GET | /api/screening/results/:jobId | Get latest results | Yes |
| POST | /api/screening/compare | Compare 2–3 candidates | Yes |
| GET | /api/screening/all | All screenings for recruiter | Yes |

### Chat

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/chat | Ask AI about screening results | Yes |

---

## 9. Deployment Guide

### Frontend (Vercel)

```bash
# From project root
cd frontend
vercel --prod
```

Set these environment variables in the Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend (Railway)

1. Push code to GitHub
2. Connect Railway project to your GitHub repo
3. Set root directory to `umurava-backend`
4. Add environment variables in Railway dashboard (all from Section 7)
5. Deploy

### Database (MongoDB Atlas)

1. Create free cluster at https://cloud.mongodb.com
2. Create database user and whitelist Railway IP (`0.0.0.0/0` for simplicity)
3. Copy connection string to `MONGODB_URI` env var in Railway

---

## 10. Assumptions and Limitations

### Assumptions

1. **Data quality** — AI scoring accuracy depends on profile completeness. Sparse profiles score lower because there is less structured data to evaluate — not because the candidate is unqualified.

2. **Self-reported skills** — The system trusts candidate-provided skills. No external skill-verification mechanism exists.

3. **Umurava schema** — The Applicant model follows the official Umurava Talent Profile Schema. Core fields are not modified.

4. **Internet connectivity** — Gemini API requires active internet. Screening fails without connectivity to Google's servers.

5. **English-optimised** — The AI prompt is optimised for English. Non-English profiles may produce lower-accuracy scoring.

6. **Single recruiter accounts** — Designed for individual recruiter accounts. Multi-user organisation access is not implemented.

### Limitations

1. **Soft skills** — AI cannot assess communication ability, attitude, creativity, or cultural fit. Human evaluation required.

2. **PDF parsing** — Heavily designed PDFs, multi-column layouts, or image-based scanned resumes may not parse perfectly. Gemini fallback parser handles most edge cases.

3. **Gemini API rate limits** — Free tier has request quotas. Very high-volume screening in short intervals may trigger temporary rate limits. The system retries automatically.

4. **Potential AI bias** — Language models may reflect biases present in training data. Every screening result includes a visible bias notice.

5. **Score variance** — Despite temperature 0.3, Gemini responses may vary slightly between identical requests due to the probabilistic nature of LLMs.

6. **No credential verification** — The system cannot verify claimed degrees, job titles, or certifications.

7. **Shortlist limit** — Configurable at 10, 20, or all candidates. Very large batches (100+) increase Gemini processing time.

### Ethical Statement

> ⚠️ **This AI screening tool is a decision-support system only.**
> Final hiring decisions must **always** be made by qualified human recruiters.
> AI may not capture soft skills, cultural fit, or personal context.
> Never use AI scores as the sole basis for rejecting a candidate.
> Always review the full candidate profile and conduct a human interview.

---

## 11. Team — Debug Thugs

Built with ❤️ for the Umurava AI Hackathon 2026 · Kigali, Rwanda

| Member | Role | Responsibility |
|--------|------|----------------|
| KAYIRANGA Don Jesus | Team Lead · AI + Backend | Gemini AI integration, backend APIs, screening logic, database architecture |
| IMPANO Umuhoza Hope | Frontend Developer | UI/UX, dashboard, screening results, candidate comparison pages |
| SANGWA Marius | Backend Developer | REST routes, data processing, file upload services, applicant management |
| UTUJE Cadeau Isabelle | Full Stack Support | Integration testing, deployment, documentation, QA |

---

## Scripts Reference

### Backend

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Start with hot reload (ts-node-dev) |
| Build | `npm run build` | Compile TypeScript |
| Production | `npm start` | Run compiled JS |
| Seed DB | `npm run seed` | Insert 5 Umurava test profiles |
| Test AI | `npm run test:ai` | Run 4-test Gemini verification suite |

### Frontend

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Start Next.js dev server |
| Build | `npm run build` | Production build |
| Production | `npm start` | Serve production build |
| Lint | `npm run lint` | ESLint check |

---

*Last updated: April 2026 · Debug Thugs · Umurava AI Hackathon*