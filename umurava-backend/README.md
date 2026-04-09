# Umurava AI Hackathon — Backend API

AI-powered talent screening system built for the Umurava AI Hackathon.
Built by **Debug Thugs** team.

---

## What This Does

This is the backend server that powers the Umurava AI Screening Tool.
It handles:
- Recruiter authentication
- Job creation and management
- Applicant data ingestion (CSV, PDF, Umurava profiles)
- AI-powered candidate screening using Gemini API
- Ranked shortlist generation with explanations

---



## Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js + TypeScript | Backend server |
| Express.js | API framework |
| MongoDB + Mongoose | Database |
| Google Gemini API | AI screening |
| JWT | Authentication |
| Multer | File uploads |
| csv-parser | CSV file reading |
| pdf-parse | PDF resume reading |

---

## Project Structure
```
backend/
├── src/
│   ├── config/          # Database and Gemini setup
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route definitions
│   ├── controllers/     # Route logic
│   ├── services/        # AI, CSV, PDF services
│   ├── middleware/      # Auth and upload middleware
│   ├── prompts/         # Gemini AI prompts
│   ├── types/           # TypeScript types
│   ├── utils/           # Validators and parsers
│   ├── seed/            # Fake data for testing
│   └── index.ts         # Main server file
└── uploads/             # Temporary uploaded files
```

---

## API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Create recruiter account |
| POST | /api/auth/login | Login and get token |
| GET | /api/auth/me | Get logged in user |

### Jobs
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/jobs | Get all jobs |
| POST | /api/jobs | Create new job |
| GET | /api/jobs/:id | Get one job |
| PUT | /api/jobs/:id | Update a job |
| DELETE | /api/jobs/:id | Delete a job |

### Applicants
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/applicants/:jobId | Get applicants for a job |
| GET | /api/applicants/umurava | Get all Umurava profiles |
| POST | /api/applicants/upload/csv | Upload CSV file |
| POST | /api/applicants/upload/pdf | Upload PDF resume |
| POST | /api/applicants/select | Select Umurava profiles |

### Screening
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/screening/run/:jobId | Run AI screening |
| GET | /api/screening/results/:jobId | Get screening results |
| POST | /api/screening/compare | Compare candidates |

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourteam/umurava-backend.git
cd umurava-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create .env file
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/umurava_db
JWT_SECRET=your_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

### 4. Seed the database
```bash
npm run seed
```

### 5. Start the server
```bash
npm run dev
```

Server runs on: http://localhost:5000

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default 5000) | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | Secret key for JWT tokens | Yes |
| GEMINI_API_KEY | Google Gemini API key | Yes |
| NODE_ENV | development or production | Yes |

---

## AI System — How It Works

### Scoring Weights
```
Skills Match        → 40 points
Years of Experience → 25 points
Education Level     → 20 points
Location/Languages  → 15 points
─────────────────────────────
Total               → 100 points
```

### Screening Flow
```
1. Recruiter creates a job
2. Applicants are added (CSV, PDF, or Umurava profiles)
3. Recruiter triggers AI screening
4. Backend sends job + applicants to Gemini API
5. Gemini scores and ranks all candidates
6. Top 10 candidates returned with explanations
7. Results saved to database
8. Frontend displays ranked shortlist
```

### AI Output Per Candidate
- Rank (1 to 10)
- Score (0 to 100)
- Strengths (why they are a good fit)
- Gaps (what they are missing)
- Recommendation (final advice)
- Skills Matched (list)
- Skills Missing (list)

---

## AI Assumptions and Limitations

- AI scoring is based only on information provided in the profile
- Soft skills and personality cannot be assessed by AI
- PDF parsing extracts text only — formatting may affect results
- Gemini API responses may vary slightly between calls
- Final hiring decisions must always be made by human recruiters

---

## Bias Notice

> ⚠️ This AI screening tool is a decision-support system only.
> Final hiring decisions must always be made by qualified human
> recruiters. AI may not capture soft skills, cultural fit, or
> personal context. Always review candidates holistically.

---

## Deployment

- Backend hosted on: Railway
- Database hosted on: MongoDB Atlas
- Live URL: https://umurava-backend.up.railway.app

---

## Team — Debug Thugs

Built with ❤️ for the Umurava AI Hackathon 2026