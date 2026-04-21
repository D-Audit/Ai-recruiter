# 🧠 Umurava AI — Talent Screening Platform

> AI-powered candidate screening built for Rwanda's growing workforce.
> Screen, rank, and shortlist top candidates in seconds — not days.

Built by **Debug Thugs** · Umurava AI Hackathon 2026 · Kigali, Rwanda

---

## 🔗 Live Links

| | URL |
|--|--|
| 🌐 Frontend (Vercel) | https://ai-umurava.vercel.app |
| ⚙️ Backend API (Railway) | https://ai-recruiter-production-c6b5.up.railway.app/ |
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
2. **Consistency** — No structured way to compare candidates objectively across diverse backgrounds

### What We Built

Umurava AI is a full-stack recruiter platform that lets hiring teams:

- Post job listings with required skills, experience levels, and education
- Ingest candidates from multiple sources in any format
- Run Google Gemini AI to automatically score every candidate 0–100
- View a ranked Top 10 shortlist with detailed AI explanations per candidate
- Compare 2–3 finalists side-by-side with an AI verdict
- Chat with an AI assistant about any candidate at any time
- Always keep humans in control of final hiring decisions

### Hackathon Scenario Coverage

| Scenario | Implementation |
|----------|---------------|
| Scenario 1: Umurava platform profiles | Select from seeded Umurava talent pool, official schema |
| Scenario 2: External candidates | CSV upload, Excel (.xlsx), PDF resumes, DOCX, manual form entry |



---

## 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                     FRONTEND  (Next.js 14 · Vercel)                  │
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Landing  │ │Dashboard │ │  Jobs    │ │Screening │ │ Candidates │  │
│  │  Page    │ │  Page    │ │  Pages   │ │  Pages   │ │   Pages    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │           Redux Store (auth · jobs · applicants · screening)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │           Axios HTTP Client + JWT Interceptor                    │  │
│  └────────────────────────────┬─────────────────────────────────────┘  │
└───────────────────────────────┼────────────────────────────────────────┘
                                │  HTTPS + Bearer Token
┌───────────────────────────────▼────────────────────────────────────────┐
│                  BACKEND  (Node.js + Express · Railway)                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Helmet  │  Rate Limiter (100/min global · 20/min AI)            │   │
│  │  CORS    │  Morgan Logger  │  express.json()                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────┐ ┌─────────┐ ┌────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │  /auth  │ │  /jobs  │ │/applicants │ │  /screening  │ │  /chat   │  │
│  └─────────┘ └─────────┘ └────────────┘ └──────┬───────┘ └──────────┘  │
│                                                  │                       │
│  ┌───────────────────────────────────────────────▼────────────────────┐  │
│  │                    AI Service Layer                                  │  │
│  │  ai.service.ts → screening.prompt.ts → ai.parser.ts                │  │
│  │                                      → ai.validator.ts             │  │
│  │  Batch processing: 20 per Gemini call                               │  │
│  │  Retry logic: 3 retries with 2s/4s/6s delays on 503                │  │
│  └──────────────────────────────┬──────────────────────────────────────┘  │
│                                  │                                        │
│  ┌────────────┐ ┌──────────────┐ │  ┌──────────────────────────────────┐  │
│  │csv.service │ │ pdf.service  │ │  │    cache.service (Semantic Cache) │  │
│  │xlsx.service│ │resume.service│ │  │    SHA256 hash · 24h MongoDB TTL  │  │
│  └────────────┘ └──────────────┘ │  └──────────────────────────────────┘  │
└──────────────────────────────────┼────────────────────────────────────────┘
                                   │
          ┌────────────────────────┤
          │                        │
┌─────────▼──────────┐   ┌────────▼────────────────────┐
│   MongoDB Atlas     │   │   Google Gemini AI          │
│                     │   │   gemini-2.5-flash-lite     │
│  users             │   │                             │
│  jobs              │   │  Input:  Job + Candidates   │
│  applicants        │   │  Output: Ranked JSON        │
│  screeningresults  │   │  Temp:   0.3 (consistent)   │
│  caches (TTL)      │   └─────────────────────────────┘
└────────────────────┘
```

---

## 3. AI Decision Flow

### Step-by-Step Process

```
STEP 1  Recruiter posts a job
        → title, description, requiredSkills[], yearsOfExperience,
          educationLevel, location, jobType saved to MongoDB

STEP 2  Recruiter adds candidates (any of these):
        → Option A: Select from Umurava platform profiles
        → Option B: Upload CSV / Excel spreadsheet
        → Option C: Upload PDF / DOCX / TXT resume
        → Option D: Fill in manual profile form
        → Option E: Paste a URL (LinkedIn / GitHub / Portfolio)
        All candidates saved to MongoDB applicants collection
        with jobIds[] array linking them to the job

STEP 3  Recruiter clicks "Screen Candidates"
        → POST /api/screening/run/:jobId

STEP 4  Backend checks semantic cache
        → Cache key = SHA256(jobId + sorted applicantIds + weights)
        → Cache hit → return stored result immediately (no Gemini call)
        → Cache miss → proceed to AI

STEP 5  Backend fetches job + applicants from MongoDB

STEP 6  Candidates are split into batches of 20
        → Each batch sent to Gemini separately
        → 1-second delay between batches (rate limit protection)
        → Retry logic: 503 errors retried 3× with 2s/4s/6s delays

STEP 7  For each batch, build Gemini prompt (screening.prompt.ts):
        → Job details section
        → Candidates as formatted readable text (not raw JSON)
        → Scoring weights: skills 40%, experience 25%,
          education 20%, location/languages/certs 15%
        → Strict JSON-only output instruction
        → Upskilling paths and adjacent roles requested

STEP 8  Gemini returns ranked JSON for each batch

STEP 9  Parse response (ai.parser.ts):
        → Strip markdown code blocks
        → Extract JSON array
        → Fallback: manual field extraction if JSON.parse fails
        → Sanitize: strengths/gaps arrays joined to strings

STEP 10 Validate response (ai.validator.ts):
        → Check scores are 0-100 range
        → Normalise: round to whole numbers, enforce min/max
        → Check candidate IDs exist in our database

STEP 11 Combine all batch results
        → Sort by score descending
        → Take top 10 (or fewer if less than 10 candidates)
        → Re-assign ranks 1 to N

STEP 12 Save AI scores back to each applicant record
        → aiScore field
        → confidenceLevel field (High/Medium/Low)

STEP 13 Upsert ScreeningResult document in MongoDB
        (replaces previous result for this job)

STEP 14 Save result to semantic cache (24h TTL)

STEP 15 Return ranked results to frontend
        → Each candidate has: rank, score, confidence, strengths,
          gaps, recommendation, skillsMatched, skillsMissing,
          upskillingPaths, adjacentRoles

STEP 16 Human recruiter reviews, compares, and decides
        → AI does NOT make the final hiring decision
```

### Scoring Weights

```
╔═══════════════════════════════════════════════════════════╗
║              SCORING BREAKDOWN (Total: 100 pts)           ║
╠═══════════════════════╦══════════╦═══════════════════════╣
║ Criteria              ║ Weight   ║ How Scored            ║
╠═══════════════════════╬══════════╬═══════════════════════╣
║ Skills Match          ║ 40 pts   ║ Count + proficiency   ║
║ Work Experience       ║ 25 pts   ║ Years + relevance     ║
║ Education             ║ 20 pts   ║ Degree level + field  ║
║ Location/Languages/   ║ 15 pts   ║ Match bonuses         ║
║ Certifications        ║          ║                       ║
╠═══════════════════════╬══════════╬═══════════════════════╣
║ TOTAL                 ║ 100 pts  ║                       ║
╚═══════════════════════╩══════════╩═══════════════════════╝
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
| Next.js | 14.x | React framework with App Router |
| TypeScript | 5.x | Type-safe development |
| Redux Toolkit | 2.x | Global state management |
| Tailwind CSS | 3.x | Utility-first styling |
| Axios | 1.x | HTTP client with JWT interceptors |
| Lucide React | 0.x | Icon library |
| React Hot Toast | 2.x | Toast notifications |
| React Dropzone | 14.x | Drag-and-drop file uploads |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime environment |
| TypeScript | 5.x | Type-safe development |
| Express.js | 4.x | REST API framework |
| MongoDB + Mongoose | 7.x + 8.x | Database and ODM |
| Google Gemini API | gemini-2.5-flash-lite | AI screening engine  |
| JWT + Bcryptjs | 9.x + 3.x | Auth and password hashing |
| Multer | 2.x | File upload handling |
| csv-parser | 3.x | CSV file processing |
| pdf-parse | 2.x | PDF text extraction |
| xlsx | 0.18.x | Excel file processing |
| mammoth | 1.x | DOCX text extraction |
| express-rate-limit | 8.x | API rate limiting |
| helmet | 8.x | HTTP security headers |
| morgan | 1.x | Request logging |
| zod | 4.x | Runtime schema validation |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting and deployment |
| Railway | Backend hosting and deployment |
| MongoDB Atlas | Cloud database hosting |

---

## 5. Project Structure

```
ai-recruiter/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                      # Landing page
│   │   │   ├── layout.tsx                    # Root HTML layout
│   │   │   ├── globals.css                   # CSS design tokens + animations
│   │   │   ├── providers.tsx                 # Redux + Toast providers
│   │   │   ├── login/page.tsx                # Login page
│   │   │   ├── register/page.tsx             # Register page
│   │   │   ├── dashboard/page.tsx            # Main dashboard
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx                  # Jobs list
│   │   │   │   ├── create/page.tsx           # Create job form
│   │   │   │   └── [id]/page.tsx             # Job hub (upload + screen)
│   │   │   ├── applicants/
│   │   │   │   ├── page.tsx                  # Applicants list
│   │   │   │   ├── upload/page.tsx           # Upload candidates (4 tabs)
│   │   │   │   └── screenings/page.tsx       # Applicant screenings view
│   │   │   ├── screenings/
│   │   │   │   ├── page.tsx                  # All screenings list
│   │   │   │   └── [jobId]/page.tsx          # Screening results for job
│   │   │   ├── candidates/
│   │   │   │   ├── page.tsx                  # All candidates list
│   │   │   │   ├── [id]/page.tsx             # Candidate detail profile
│   │   │   │   └── compare/page.tsx          # Side-by-side comparison
│   │   │   ├── profile/page.tsx              # Recruiter profile
│   │   │   └── settings/page.tsx             # Settings + theme + password
│   │   ├── components/
│   │   │   ├── Sidebar.tsx                   # Navigation + sign out modal
│   │   │   ├── AppHeader.tsx                 # Page header + user dropdown
│   │   │   ├── FloatingAI.tsx                # Bottom-right AI chat bubble
│   │   │   ├── ScreeningResults.tsx          # Ranked candidates component
│   │   │   ├── LoadingSpinner.tsx            # Shared loading spinner
│   │   │   └── UploadSuccessBanner.tsx       # Post-upload success banner
│   │   ├── store/
│   │   │   ├── index.ts                      # Redux store
│   │   │   └── slices/
│   │   │       ├── authSlice.ts
│   │   │       ├── jobSlice.ts
│   │   │       ├── applicantSlice.ts
│   │   │       └── screeningSlice.ts
│   │   ├── services/
│   │   │   ├── api.ts                        # Axios base + JWT interceptor
│   │   │   ├── authService.ts
│   │   │   ├── jobService.ts
│   │   │   ├── applicantService.ts
│   │   │   ├── screeningService.ts
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
│   │   │   ├── applicant.routes.ts
│   │   │   ├── screening.routes.ts
│   │   │   └── chat.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── job.controller.ts
│   │   │   ├── applicant.controller.ts
│   │   │   ├── screening.controller.ts       # Includes semantic cache logic
│   │   │   └── chat.controller.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts                 # Core Gemini AI + batch + retry
│   │   │   ├── cache.service.ts              # Semantic SHA256 cache (24h TTL)
│   │   │   ├── csv.service.ts
│   │   │   ├── pdf.service.ts
│   │   │   ├── xlsx.service.ts
│   │   │   └── resume.service.ts             # DOCX + TXT + URL extraction
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts            # JWT protect
│   │   │   └── upload.middleware.ts          # Multer (CSV/PDF/XLSX/DOCX/TXT)
│   │   ├── prompts/
│   │   │   └── screening.prompt.ts           # Gemini prompt engineering
│   │   ├── types/index.ts
│   │   ├── utils/
│   │   │   ├── ai.parser.ts                  # JSON extraction + sanitizer
│   │   │   ├── ai.validator.ts               # Score validation + normalisation
│   │   │   └── ai.test.ts                    # 4-test AI verification suite
│   │   ├── seed/seedData.ts                  # 5 Umurava-schema test profiles
│   │   └── index.ts                          # Express server entry point
│   ├── uploads/                              # Temp file storage (.gitkeep)
│   ├── .env                                  # Backend environment variables
│   └── package.json
│
└── README.md                                 # This file
```

---

## 6. Setup Instructions

### Prerequisites

- Node.js 18 or higher
- MongoDB running locally OR a MongoDB Atlas account
- Google Gemini API key from Google AI Studio (free)

### Step 1 — Clone

```bash
git clone https://D-Audit/ai-recruiter.git
cd ai-recruiter
```

### Step 2 — Backend Setup

```bash
cd umurava-backend
npm install
```

Create `.env` file (see Section 7 for all variables):

```bash
# Windows
copy nul .env

# Mac / Linux
touch .env
```

Fill in the `.env` values (see Section 7).

```bash
# Seed database with 5 Umurava test profiles
npm run seed

# Test Gemini AI connection (optional but recommended)
npm run test:ai

# Start development server
npm run dev
```

Backend runs at: `http://localhost:5000`

Health check: `http://localhost:5000/` → should return `{ "status": "ok" }`

### Step 3 — Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Step 4 — Test the full flow

```
1. Go to http://localhost:3000
2. Click "Get started free" → Register an account
3. Login with your account
4. Dashboard → "Post a Job"
5. Fill in job details and required skills
6. Go to the job → "Upload Applicants"
7. Select Umurava profiles tab → Select all 5 seeded profiles
8. Click "Screen Candidates"
9. View ranked shortlist
10. Select 2 candidates → Click "Compare Side-by-Side"
11. Use the AI chat to ask about candidates
```

---

## 7. Environment Variables

### Backend — `umurava-backend/.env`

```env
# ── Server ───────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ─────────────────────────────────────────────────
# Local:
MONGODB_URI=mongodb://localhost:27017/umurava_db
# Atlas (use this for production):
# MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/umurava_db?retryWrites=true&w=majority

# ── Authentication ────────────────────────────────────────────
# Must be at least 32 characters for security
JWT_SECRET=debugthugs_umurava_ai_hackathon_2026_secret_key_very_long

# ── Google Gemini AI ──────────────────────────────────────────
# Get free key from: https://aistudio.google.com/apikey
GEMINI_API_KEY=AIzaSy_your_key_here

# ── CORS (required for production) ───────────────────────────
# Set to your Vercel URL when deployed
FRONTEND_URL=http://localhost:3000
```

| Variable | Description | Required | Where to Get |
|----------|-------------|----------|--------------|
| PORT | Server port (default 5000) | Yes | Set to 5000 |
| NODE_ENV | Environment mode | Yes | development or production |
| MONGODB_URI | MongoDB connection string | Yes | MongoDB Atlas or local |
| JWT_SECRET | Secret for signing tokens | Yes | Any long random string (32+ chars) |
| GEMINI_API_KEY | Google Gemini AI key | Yes | https://aistudio.google.com/apikey |
| FRONTEND_URL | Allowed frontend origin | Yes in production | Your Vercel URL |

### Frontend — `frontend/.env.local`

```env
# ── API ──────────────────────────────────────────────────────
# Local development:
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Production (set this in Vercel dashboard):
# NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
```

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_API_URL | Backend API base URL | Yes |

---

## 8. API Reference

All protected routes require: `Authorization: Bearer <token>`

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Create recruiter account | No |
| POST | /api/auth/login | Login, get JWT token | No |
| GET | /api/auth/me | Get current user info | Yes |
| PUT | /api/auth/me | Update profile | Yes |
| POST | /api/auth/change-password | Change password | Yes |

### Jobs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/jobs | Get all jobs (owned by recruiter) | Yes |
| POST | /api/jobs | Create new job posting | Yes |
| GET | /api/jobs/:id | Get one job | Yes |
| PUT | /api/jobs/:id | Update job | Yes |
| DELETE | /api/jobs/:id | Delete job | Yes |

### Applicants

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/applicants/umurava | Get all Umurava platform profiles | Yes |
| GET | /api/applicants/:jobId | Get applicants for a specific job | Yes |
| POST | /api/applicants/select | Select Umurava profiles for a job | Yes |
| POST | /api/applicants/manual | Add applicant manually | Yes |
| POST | /api/applicants/upload/csv | Upload CSV / Excel file | Yes |
| POST | /api/applicants/upload/resume | Upload PDF / DOCX / TXT resume | Yes |
| POST | /api/applicants/upload/url | Import from URL | Yes |

### Screening

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/screening/run/:jobId | Run AI screening | Yes |
| GET | /api/screening/results/:jobId | Get latest screening results | Yes |
| POST | /api/screening/compare | Compare 2–3 candidates | Yes |
| GET | /api/screening/all | Get all screenings for recruiter | Yes |

### Chat

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/chat | Ask AI about candidates | Yes |

### Example Request — Run Screening

```bash
curl -X POST https://umurava-backend.up.railway.app/api/screening/run/JOB_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Example Request — AI Chat

```bash
curl -X POST https://umurava-backend.up.railway.app/api/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Who is the best candidate for React work?", "context": {}}'
```
---

## 10. Assumptions and Limitations

### Assumptions

1. **Candidate data quality** — AI scoring accuracy depends on completeness of profiles. Incomplete profiles receive lower scores not because the candidate is unqualified but because there is insufficient structured data to evaluate.

2. **Self-reported skills** — The system trusts that candidates accurately list their skills. There is no skill verification mechanism.

3. **Umurava schema** — The applicant model follows the official Umurava Talent Profile Schema specification provided for the hackathon. Core fields are not modified.

4. **Internet connectivity** — Gemini API requires an active internet connection. Screening fails without connectivity to Google's servers.

5. **English language** — The AI prompt is optimised for English. Non-English profiles may produce lower-accuracy scoring.

6. **Single recruiter per account** — The current system is designed for individual recruiter accounts. Multi-user organisation access is not implemented.

### Limitations

1. **Soft skills** — AI cannot assess communication ability, attitude, creativity, or cultural fit. These require human evaluation.

2. **PDF parsing** — The parser extracts raw text. Heavily designed PDFs, multi-column layouts, or image-based scanned resumes may not parse correctly.

3. **Gemini API rate limits** — The free tier has request quotas. Screening many jobs repeatedly in a short time period may trigger temporary limits (model: gemini-2.5-flash-lite).

4. **Potential AI bias** — Language models may reflect biases present in training data. Every screening result includes a bias notice.

5. **Score variance** — Despite using temperature 0.3, Gemini responses may vary slightly between identical requests due to the probabilistic nature of large language models.

6. **No credential verification** — The system cannot verify claimed degrees, job titles, or certifications.

7. **Top 10 limit** — The system shortlists up to 10 candidates or 20. For jobs with more applicants, only the highest-scoring 10 or 20 are displayed.

### Ethical Statement

> ⚠️ This AI screening tool is a **decision-support system only**.
> Final hiring decisions must **always** be made by qualified human recruiters.
> AI may not capture soft skills, cultural fit, or personal context.
> Never use AI scores as the sole basis for rejecting a candidate.
> Always review the full candidate profile and conduct a human interview.

---

## 11. Team — Debug Thugs

Built with ❤️ for the Umurava AI Hackathon 2026 · Kigali, Rwanda

| Member | Role | Responsibility |
|--------|------|----------------|
| KAYIRANGA Don Jesus | Team Lead · AI + Backend | Gemini AI integration, backend APIs, database architecture |
| IMPANO Umuhoza Hope | Frontend Developer | UI/UX, dashboard, screening results pages |
| SANGWA Marius | Backend Developer | Routes, data processing, file upload services |
| UTUJE Cadeau Isabelle | Full Stack Support | Integration testing, deployment, documentation |

---

## Scripts Reference

### Backend Scripts

```bash
npm run dev       # Start with hot reload (development)
npm run build     # Compile TypeScript to dist/
npm start         # Run compiled production build
npm run seed      # Seed 5 Umurava test profiles into database
npm run test:ai   # Run 4-test AI connection and screening suite
```

### Frontend Scripts

```bash
npm run dev       # Start development server at localhost:3000
npm run build     # Build for production (required before deploy)
npm start         # Run production build
npm run lint      # Run ESLint type checks
```

---

*© 2026 Umurava AI — Debug Thugs — Kigali, Rwanda*
*Powered by Google Gemini AI · Built on the Umurava Talent Platform*