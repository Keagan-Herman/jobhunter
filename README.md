# JobHunter

JobHunter is an AI-powered job search and application assistant designed to streamline the process of finding and applying for roles. By leveraging advanced LLMs and real-time job data, JobHunter helps developers find the perfect match for their skills and preferences while automating the tedious parts of the application process.

## 🚀 Key Features

### 1. Intelligent AI Job Scanning
JobHunter doesn't just search for keywords; it understands job descriptions.
- **Multi-Source Fetching:** Aggregates live job listings from Adzuna and JSearch.
- **Smart Scoring:** Every job is assigned a fit score (0-100) based on your parsed CV, seniority level, work style (remote/hybrid/on-site), and salary requirements.
- **Behavioral Calibration:** The system learns from your past actions. If you skip or apply to certain roles, the AI adjusts future scoring to better match your preferences.

### 2. Automated CV Parsing
- **PDF Extraction:** Uses `unpdf` for high-performance, serverless-friendly text extraction from PDF resumes.
- **AI Synthesis:** Automatically identifies skills, experience, and projects to build a searchable profile and generate optimized search terms.

### 3. Tailored Cover Letter Generation
- **Context-Aware:** Generates cover letters that reference specific job requirements and your unique achievements.
- **Style Control:** Choose your preferred tone (Professional, Conversational, Creative) and length.
- **Success Patterns:** The AI identifies patterns from your previously successful applications (those that led to interviews) and incorporates those elements into new drafts.

---

## 🛠️ Technical Deep Dive

### AI Engine (Groq & LLaMA 3.3)
JobHunter utilizes the **Groq LLaMA 3.3 70B** model for all natural language tasks.
- **High Performance:** Groq's LPU™ Inference Engine provides near-instantaneous responses, ensuring the UI remains snappy even during complex scoring or parsing tasks.
- **Precision Prompting:** We use sophisticated system prompts to ensure the AI remains calibrated, avoiding clichés and focusing on quantifiable achievements.

### Matching Logic
The scoring algorithm combines hard filters and soft AI analysis:
1. **Hard Filters:** Immediate disqualification for mismatched work styles (e.g., on-site when remote-only is requested) or significant salary gaps.
2. **Technical Overlap:** A calculated percentage match between the job's tech stack and the candidate's skill set.
3. **AI Nuance:** The LLM evaluates the qualitative aspects of the job description against the candidate's experience summary.

---

## 💻 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **AI Inference:** [Groq SDK](https://groq.com/) (LLaMA 3.3 70B)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Email:** [Resend](https://resend.com/)
- **PDF Processing:** [unpdf](https://github.com/unjs/unpdf)
- **Testing:** [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 20+
- A Supabase project
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
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # AI & External APIs
   GROQ_API_KEY=your_groq_key
   ADZUNA_APP_ID=your_adzuna_id
   ADZUNA_API_KEY=your_adzuna_key
   JSEARCH_API_KEY=your_jsearch_key
   RESEND_API_KEY=your_resend_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

### Running Tests
We maintain high code quality through comprehensive testing.
```bash
npm test
```
The test suite includes unit tests for the matching logic, API route integration tests, and component tests.

---

## 🛡️ CI/CD
This project uses **GitHub Actions** to automatically run the test suite on every push and pull request to the `main` branch, ensuring that no regressions are introduced.
