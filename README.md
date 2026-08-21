# TalentLens AI

TalentLens AI is an AI powered resume analysis and scoring application. It extracts skills and experience from candidate resumes and matches them against job descriptions to generate an explainable compatibility score.

## Screenshots

### Landing Page

<div align="center">
  <img src="../docs/landingpage.png" width="800" alt="Landing Page Screenshot" />
</div>

### Resume & Job Description Analysis

<div align="center">
  <img src="../docs/analysispage.png" width="800" alt="Analysis Page Screenshot" />
</div>

### Analysis Results

<div align="center">
  <img src="../docs/resultpage1.png" width="800" alt="Results Breakdown" />
  <br/><br/>
  <img src="../docs/resultpage2.png" width="800" alt="Detailed Skills and Keyword Results" />
  <br/><br/>
  <img src="../docs/resultpage3.png" width="800" alt="Additional Results" />
  <br/><br/>
  <img src="../docs/resultpage4.png" width="800" alt="Original PDF and Extracted Text" />
</div>

### Analysis History

<div align="center">
  <img src="../docs/historypage.png" width="800" alt="History Page Screenshot" />
</div>

## Detailed Overview

TalentLens AI goes beyond simple keyword matching to provide a holistic, human-like evaluation of candidate resumes. It achieves this through a multi-layered NLP pipeline and a dynamic scoring engine.

### How it Works

1. **Document Parsing & Preprocessing:** Candidate resumes (PDFs) are uploaded and processed using PyMuPDF to extract raw text accurately. The text then passes through a dedicated text processor to normalize line endings and remove excessive whitespace, ensuring optimal, clean input for the NLP models.
2. **Entity & Concept Extraction:** The text is fed into a spaCy NLP pipeline which identifies skills, job titles, educational background, and implicit experience indicators (e.g., dates, project links, open-source contributions).
3. **Dynamic Requirement Analysis:** The system analyzes the provided Job Description to extract the required skills, preferred skills, required years of experience, and domain-specific keywords.
4. **Intelligent Scoring Engine:** The core `ResumeMatchingEngine` evaluates the candidate against the requirements across four distinct pillars.

### The Four Scoring Pillars

The engine uses dynamic weighting based on the complexity and nature of the job description. By default, the pillars are weighted as follows:

- **Semantic Understanding (40%):** Evaluates how well the candidate's experience contextually aligns with the job's core concepts. Highly technical or broad roles dynamically boost this weight.
- **Hard Skills Match (30%):** Classifies skills as exact matches, equivalent, or related. It calculates a weighted score based on required vs. possessed skills.
- **Experience Level (20%):** Intelligently extracts years of experience (parsing years, months, and date ranges) and compares it against the required level (Entry, Junior, Mid, Senior, Lead). It even considers evidence like GitHub links to offset experience gaps.
- **Keyword Alignment (10%):** Analyzes domain-specific terminology and buzzwords required by the role.

#### Dynamic Weight Adjustments

TalentLens AI adapts its scoring algorithm to the specific Job Description:

- **High Skill Volume & Technical Focus:** If a JD requires many skills (>10) or a high ratio of technical skills (Python, AWS, React, etc.), the `Skill Match` and `Semantic Understanding` weights are dynamically boosted.
- **Seniority & Leadership:** If a role demands high experience (7+ years) or includes leadership keywords (Director, Lead, Principal), the `Experience Level` weight is increased.
- **Complex Domain Requirements:** If the JD contains broad semantic indicators ("end-to-end", "architecture", "principles"), the `Semantic Understanding` weight is prioritized.

### Actionable Insights

Instead of just a single number, the application returns a comprehensive JSON response containing:

- **Score Breakdown & Weighted Contributions:** Transparently showing exactly how the final score was derived.
- **Strengths & Potential Gaps:** Identifying where the candidate excels and where they fall short (e.g., missing specific hard skills or lacking years of experience).
- **Actionable Recommendations:** Suggesting specific resume improvements based on the identified gaps.

## Architecture

The application is built using a modern decoupled architecture:

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **UI & Styling:** React, Tailwind CSS v4, Lucide React (icons)
- **Design:** Modern, flat UI with soft gradients and minimalistic components (`bg-[#fcf8ff]` thematic base).
- **Communication:** Standard fetch API interfacing with the backend REST endpoints.

### Backend

- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL with `pgvector` extension for semantic search and storage
- **ORM:** SQLAlchemy for data persistence (Resumes, Analyses, Embeddings)
- **Document Processing:** PyMuPDF (`pymupdf`) for robust PDF text extraction
- **NLP & AI:**
  - spaCy (`en_core_web_sm`) for Named Entity Recognition, chunking, and skill extraction
  - SentenceTransformers (`all-MiniLM-L6-v2`) for generating dense 384-dimensional embeddings
- **Core Engine:** A custom `ResumeMatchingEngine` that calculates scores based on four dynamically weighted pillars:
  - Semantic Understanding
  - Hard Skills Match
  - Experience Level
  - Keyword Alignment

---

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- Python (3.10+)
- Docker & Docker Compose (for the database)

### 1. Database Setup

The application requires a PostgreSQL database with the `pgvector` extension installed. Start it easily using the provided Docker Compose file in the backend folder for local development.

```bash
cd backend
docker compose up -d
```

_This will spin up a PostgreSQL container (`talentlens-postgres`) on port 5432._

### 2. Backend Setup

Set up the Python virtual environment and start the FastAPI server.

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download the required spaCy NLP model
python -m spacy download en_core_web_sm

# Start the development server
uvicorn app.main:app --reload
```

_The backend API will now be running at `http://127.0.0.1:8000`. You can view the Swagger UI documentation at `http://127.0.0.1:8000/docs`._

### 3. Frontend Setup

Install the Node dependencies and start the Next.js development server.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

_The frontend application will be available at `http://localhost:3000`._

---

```

```
