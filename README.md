# JobHunter (Personal Edition)

JobHunter is an AI-powered job search and application assistant designed to streamline the process of finding and applying for roles. This version is a standalone personal tool that stores all data locally using SQLite.

## 🚀 Key Features

### 1. Intelligent AI Job Scanning
JobHunter doesn't just search for keywords; it understands job descriptions.
- **Multi-Source Fetching:** Aggregates live job listings from Adzuna and JSearch.
- **Smart Scoring:** Every job is assigned a fit score (0-100) based on your parsed CV, seniority level, work style (remote/hybrid/on-site), and salary requirements.
- **Behavioral Calibration:** The system learns from your past actions. If you skip or apply to certain roles, the AI adjusts future scoring to better match your preferences.

### 2. Automated CV Parsing
- **PDF Extraction:** Uses `unpdf` for high-performance text extraction from PDF resumes.
- **AI Synthesis:** Automatically identifies skills, experience, and projects to build a searchable profile.

### 3. Tailored Cover Letter Generation
- **Context-Aware:** Generates cover letters that reference specific job requirements and your unique achievements.
- **Success Patterns:** The AI identifies patterns from your previously successful applications and incorporates those elements into new drafts.

---

## 🛠️ Technical Architecture

### Database: SQLite + Drizzle
This version uses a local **SQLite** database managed by **Drizzle ORM**.
- **Location:** `data/jobhunter.sqlite`
- **Privacy:** Your data is 100% private and stays on your machine.
- **Zero Configuration:** The database is automatically initialized on the first run.

### AI Engine (Groq & LLaMA 3.3)
JobHunter utilizes the **Groq LLaMA 3.3 70B** model for all natural language tasks.

---

## 💻 Tech Stack

- **Framework:** Next.js 16.1.7 (App Router)
- **Database:** SQLite with Drizzle ORM
- **AI Inference:** Groq SDK (LLaMA 3.3 70B)
- **Styling:** Tailwind CSS 4
- **Email:** Resend
- **PDF Processing:** unpdf

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 20+
- API Keys for Groq, Adzuna, and JSearch

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/jobhunter.git
   cd jobhunter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env.local` file in the root and add the following:
   ```env
   # AI & External APIs
   GROQ_API_KEY=your_groq_key
   ADZUNA_APP_ID=your_adzuna_id
   ADZUNA_API_KEY=your_adzuna_key
   JSEARCH_API_KEY=your_jsearch_key
   RESEND_API_KEY=your_resend_key

   # Site Context
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   CRON_SECRET=your_random_string
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

### Running Tests
```bash
npm test
```

---

## 🛡️ Privacy & Security
All your profiles, applications, and learned AI signals are stored in the `data/` directory. This data is never sent to a central server, except for the necessary prompts sent to Groq for AI processing.
