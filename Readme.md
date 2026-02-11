# TailorCV

An AI-powered resume bullet point generator that matches your experiences to any job description using semantic search and LLM-generated content.

**Live at [tailorcvai.vercel.app](https://tailorcvai.vercel.app)**

## How It Works

1. **Build your experience library** — Add work experience, projects, and volunteering manually or by importing from LinkedIn
2. **Paste a job description** — The system uses vector similarity search to find your most relevant experiences
3. **Generate tailored bullets** — An LLM creates ATS-friendly resume bullet points matched to the job requirements

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, hosted on Vercel |
| **Backend** | FastAPI (Python), hosted on Render |
| **Database** | PostgreSQL with pgvector extension (Supabase) |
| **Embeddings** | Cohere API (embed-english-light-v3.0, 384 dimensions) |
| **LLM** | Groq API (llama-3.1-8b-instant) |
| **Authentication** | Supabase Auth (Google OAuth) |
| **Rate Limiting** | slowapi |

## Architecture

```
React (Vercel) → FastAPI (Render) → Supabase PostgreSQL + pgvector
                       ↓                        ↓
                   Groq LLM              Cohere Embeddings
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Semantic similarity search across experiences |
| POST | `/api/generate` | Generate tailored resume bullet points |
| POST | `/api/experiences` | Add a single experience |
| POST | `/api/experiences/batch` | Batch add experiences |
| GET | `/api/experiences` | List all user experiences |
| PUT | `/api/experiences/{id}` | Update an experience |
| DELETE | `/api/experiences/{id}` | Delete an experience |
| POST | `/api/parse-linkedin` | Parse LinkedIn profile text into structured data |
| GET | `/health` | Health check |

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- Supabase project with pgvector enabled
- API keys for Cohere and Groq

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```
SUPABASE_DB_URL=your_supabase_db_url
SUPABASE_JWT_SECRET=your_jwt_secret
COHERE_API_KEY=your_cohere_key
GROQ_API_KEY=your_groq_key
```

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm start
```

## License

MIT
