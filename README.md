# 🚀 InnoSphere AI – AI-Powered Student Innovation & Intelligent Resource Discovery Platform

> **Transforming Student Ideas into Practical Technology-Driven Solutions with Multi-Source Intelligence, Automated AI Reasoning, and 10-Phase Innovation Roadmaps.**

---

## 📋 Table of Contents
- [Problem Statement & Solution Concept](#-problem-statement--solution-concept)
- [System Architecture](#-system-architecture)
- [Core Workflow & Innovation Pipeline](#-core-workflow--innovation-pipeline)
- [Key Features & Capabilities](#-key-features--capabilities)
- [Multi-Source External Integrations](#-multi-source-external-integrations)
- [Pre-Seeded Demonstration Personas & Projects](#-pre-seeded-demonstration-personas--projects)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Installation & Quickstart](#-installation--quickstart)
- [Production Deployment](#-production-deployment)

---

## 🎯 Problem Statement & Solution Concept

Students frequently develop creative, high-impact project ideas for hackathons, final-year engineering projects, and research initiatives. However, they face significant barriers in discovering relevant academic papers, benchmark datasets, production APIs, open-source repositories, and technical frameworks needed to execute their vision. Information is fragmented across disparate platforms without contextual explainability.

**InnoSphere AI** provides a unified, intelligent research and innovation assistant that empowers students to:
1. **Submit & Formulate Innovative Ideas:** Describe problems, target beneficiaries, known skills, and expected impact across 15 domain categories.
2. **Automated Multi-Vector AI Reasoning:** Deconstruct technical requirements, estimate feasibility & innovation scores, identify critical bottlenecks, and formulate actionable suggestions.
3. **Multi-Source Intelligent Resource Discovery:** Semantically query arXiv, OpenAlex, GitHub, HuggingFace, and public datasets with AI relevance scoring (e.g. `94% Relevance`) and explainability (*"Why this resource is relevant to your idea"*).
4. **AI Insights & Strategic Gap Analysis:** Identify emerging industry technology trends, academic frontiers, competitive differentiators, and opportunity extensions.
5. **Interactive 10-Phase Milestone Roadmap:** Follow a customized development timeline from literature review to prototype development, testing, and deployment.
6. **Curated Personal Library & Resource Comparison Matrix:** Bookmark, tag, annotate, and compare candidate architectures side-by-side.
7. **Context-Aware Floating AI Innovation Assistant:** Always-available conversational mentor grounded in active project specifications.
8. **Faculty Mentorship & Evaluation Hub:** Enable research advisors and hackathon judges to review progress, verify milestones, and leave rubric evaluations.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             InnoSphere AI Platform                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
       ┌──────────────────────────────┴──────────────────────────────┐
       ▼                                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  Next.js 14 Frontend App     │              │  FastAPI Asynchronous Backend│
├──────────────────────────────┤              ├──────────────────────────────┤
│ • App Router Architecture    │ ◄──REST/JWT─►│ • RESTful API Routing        │
│ • Tailwind CSS & Lucide      │              │ • Pydantic v2 Type Safety    │
│ • Glassmorphism Design Theme │              │ • SQLAlchemy ORM Data Layer  │
│ • Floating AI Assistant Drawer│             │ • Dual SQLite/Postgres Engine│
│ • Interactive 10-Phase Roadmaps│            │ • Multi-Source Discovery Hub │
│ • Side-by-Side Compare Matrix│              │ • Google Gemini AI Layer     │
└──────────────────────────────┘              └──────────────────────────────┘
                                                             │
                  ┌──────────────────────────────────────────┴──────────────────────────────────────────┐
                  ▼                                          ▼                                          ▼
     ┌──────────────────────────────┐           ┌──────────────────────────────┐           ┌──────────────────────────────┐
     │  Live External Connectors    │           │  AI Reasoning Engine         │           │  Relational Database Layer   │
     ├──────────────────────────────┤           ├──────────────────────────────┤           ├──────────────────────────────┤
     │ • arXiv API (Research)       │           │ • Google Gemini (LLM)        │           │ • Users & Profiles           │
     │ • OpenAlex (Scholarly Works) │           │ • Semantic Ranking Engine    │           │ • Projects & Ideas           │
     │ • GitHub Search API (Code)   │           │ • Multi-factor Explainability│           │ • AI Analyses & Insights     │
     │ • HuggingFace (AI Models)    │           │ • Automated Roadmap Generator│           │ • 10-Phase Roadmaps & Tasks  │
     │ • Curated Benchmark Index    │           │ • Contextual Chat Assistant  │           │ • Saved Library & Reviews    │
     └──────────────────────────────┘           └──────────────────────────────┘           └──────────────────────────────┘
```

---

## 🔄 Core Workflow & Innovation Pipeline

$$\text{Student Idea} \longrightarrow \text{AI Understanding} \longrightarrow \text{Resource Exploration} \longrightarrow \text{Intelligent Analysis} \longrightarrow \text{Recommendations} \longrightarrow \text{Innovation Roadmap} \longrightarrow \text{Project Development}$$

1. **Submit Idea:** Submit title, domain, target users, problem statement, known tech, and expected impact.
2. **AI Analysis:** The AI calculates feasibility, innovation score, complexity level, required technologies, hardware, and potential security/scalability challenges.
3. **Discover Resources:** Explore semantically ranked research papers, datasets, APIs, and GitHub codebases with AI explainability.
4. **Compare & Save:** Bookmark resources to your personal library and run side-by-side comparisons across cost, licensing, difficulty, and complexity.
5. **Execute Roadmap:** Work through 10 milestone phases, toggle completed tasks, set deadlines, add notes, and track overall completion velocity.
6. **Mentor Review:** Faculty mentors grade project submissions, review architecture choices, and provide guidance.

---

## 🌟 Pre-Seeded Demonstration Personas & Projects

The platform comes pre-seeded with **3 evaluation user personas** and **5 complete production projects**:

### Evaluation Personas (1-Click Instant Login):
* 🎓 **Student Innovator:** `innovator@student.edu` (Password: `password123`) – Aarav Sharma (NIT CS Student)
* 🧑‍🏫 **Faculty Mentor:** `mentor@university.edu` (Password: `password123`) – Dr. Radhika Sen (Director of AI Research)
* 🛡️ **Platform Administrator:** `admin@innosphere.ai` (Password: `admin123`)

### 5 Sample Innovation Projects:
1. **AI-Based Smart Healthcare Monitoring:** Edge wearable ECG telemetry running 1D-CNNs for real-time arrhythmia detection and WebSocket alerts.
2. **Smart Agriculture Prediction System:** Multi-modal crop vision with YOLOv8 and ESP32 soil sensors for hyper-local disease diagnosis.
3. **AI-Powered Waste Management & Segregation:** Optical sorting with Mask R-CNN on Raspberry Pi 5 + Google Coral TPU diverting recyclable waste from landfills.
4. **Intelligent Traffic Management & Signal Optimization:** Reinforcement Learning (PPO) traffic controller dynamically tuning green phases using SUMO simulation.
5. **Student Skill Recommendation Platform:** Semantic graph matching using Sentence-Transformers and ESCO taxonomy to bridge university syllabus gaps.

---

## 💻 Tech Stack

### Frontend
* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS, Glassmorphism, Custom Glow Utilities
* **Icons:** Lucide React
* **Animations:** Framer Motion, Canvas Confetti

### Backend
* **Framework:** FastAPI (Python 3.10+)
* **Data Validation:** Pydantic v2
* **ORM:** SQLAlchemy 2.0 (SQLite for instant zero-config local run, PostgreSQL production-ready)
* **Security:** JWT Authentication (HS256) & Salted PBKDF2 Hashing
* **HTTP Client:** HTTPX / Requests

### AI & Intelligence Layer
* **LLM Engine:** Google Gemini API (`gemini-2.5-flash` / `gemini-3.8-flash`) via `google-genai`
* **Semantic Ranking Engine:** Multi-factor keyword, domain, and technology scoring
* **Explainability Generator:** Real-time rationale breakdown (*"Why it is relevant"*)
* **Deterministic Fallback Engine:** Instant offline and air-gapped test capability

---

## 🗄️ Database Schema

* **`users`**: User identity, email, password hash, role (`student`, `mentor`, `admin`).
* **`profiles`**: Institution, course, department, skills, interests, innovation domains, bio.
* **`projects`**: Title, problem statement, proposed solution, domain, technologies, status, progress %, tags.
* **`ideas`**: Student submissions, problem description, target users, known/interested tech, impact.
* **`ai_analyses`**: AI summaries, feasibility score, innovation score, required tech, required resources, opportunities, challenges, suggestions.
* **`resources`**: Multi-source index (arXiv, OpenAlex, GitHub, HuggingFace, Kaggle), type, authors, URL, metadata.
* **`saved_resources`**: Bookmarks, personal notes, tags, ratings, project links.
* **`ai_insights`**: Key insights, technology trends, research frontiers, innovation gaps, similar solutions.
* **`project_roadmaps`**: 10-phase milestone container, completion percentage.
* **`roadmap_tasks`**: Phase number, phase name, task title, completion state, deadline, notes, priority.
* **`chat_messages`**: Context-aware floating assistant message logs.
* **`mentor_reviews`**: Faculty feedback, 1-5 star ratings, strengths, improvement areas.

---

## 🚀 Installation & Quickstart

### Prerequisites
* **Node.js** >= 18.0.0 (`node -v`)
* **Python** >= 3.10 (`python --version`)

### Quick Start with Launchers (Windows)
Simply double-click `start-all.bat` or run:
```bash
# Launch unified full-stack platform
.\start-all.bat
```

### Manual Step-by-Step Launch

#### 1. Backend Service
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API: `http://localhost:8000`
* Interactive OpenAPI Docs: `http://localhost:8000/docs`

#### 2. Frontend Application
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
* Frontend App: `http://localhost:3000`

---

## 🌐 Production Deployment

### Frontend (Vercel)
1. Push repository to GitHub.
2. Import repository in [Vercel](https://vercel.com).
3. Set Root Directory to `frontend`.
4. Set Environment Variable: `NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api/v1`.
5. Deploy!

### Backend (Render / Railway / AWS)
1. Set Root Directory to `backend`.
2. Build Command: `pip install -r requirements.txt`.
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Set Environment Variables:
   * `DATABASE_URL=postgresql://user:pass@host:5432/dbname`
   * `SECRET_KEY=your-production-jwt-secret-key`
   * `GEMINI_API_KEY=your-google-gemini-api-key`
5. Deploy!
