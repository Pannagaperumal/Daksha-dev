# Daksha

Daksha is a legal case management platform with an AI-powered document/PDF chatbot built in. It has two backend services and (soon) a frontend:

- **`backend/`** — Django REST API for the core legal platform: lawyer users, cases, and case documents.
- **`rag-backend/`** — a Node.js/TypeScript LangGraph service that ingests PDFs, stores embeddings in a vector store (Supabase), and answers questions over them using an LLM (OpenAI or another LangChain-supported provider).
- **`frontend/`** — not built yet. There is currently no UI; both backends are consumed directly via their REST/HTTP APIs.

> This repo started from the [`ai-pdf-chatbot-langchain`](https://github.com/mayooear/ai-pdf-chatbot-langchain) template (the RAG piece in `rag-backend/`), and the Django `backend/` legal-platform app was added on top. The root `package.json` still lists a `frontend` workspace from that original template — ignore it until a real frontend exists here.

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Running the Django backend](#running-the-django-backend)
4. [Running the rag-backend](#running-the-rag-backend)
5. [Environment Variables](#environment-variables)
6. [API Overview](#api-overview)
7. [Customizing the RAG Agent](#customizing-the-rag-agent)
8. [Troubleshooting](#troubleshooting)

---

## Architecture

```ascii
┌───────────────────────────┐          ┌────────────────────────────┐
│ backend/ (Django)         │          │ rag-backend/ (LangGraph)    │
│ - accounts, cases,        │          │ - ingestion_graph            │
│   documents REST API      │          │ - retrieval_graph             │
│ - SQLite (dev), DRF,      │          │ - vector store: Supabase      │
│   Swagger/OpenAPI docs    │          │ - LLM: OpenAI (or other)      │
│ - port 8000               │          │ - port 2024                   │
└───────────────────────────┘          └────────────────────────────┘
```

The two services are independent today — there is no wiring between the Django app's `documents` model and the `rag-backend` ingestion graph yet. Each is run and used separately.

## Prerequisites

- **Python 3.12+** for the Django backend
- **Node.js v20+** and **npm** (or Yarn) for `rag-backend`
- **OpenAI API key** (or another LangChain-supported LLM provider key) and a **Supabase project** if you want `rag-backend` to actually answer questions (see [Environment Variables](#environment-variables)) — without these it still starts and its API is reachable, but ingestion/retrieval calls will fail.

## Running the Django backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 0.0.0.0:8000
```

- API root: `http://localhost:8000/api/`
- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`
- Django admin: `http://localhost:8000/admin/` (create a superuser first with `manage.py createsuperuser`)

Uses SQLite by default (`backend/db.sqlite3`), so no external database setup is needed for local dev.

## Running the rag-backend

```bash
cd rag-backend
npm install --legacy-peer-deps   # peer-dep conflict between langchain/typeorm packages as of this writing
cp .env.example .env             # then fill in real keys, see below
npx @langchain/langgraph-cli dev --port 2024
```

- API: `http://localhost:2024`
- Studio UI link is printed on startup (opens LangGraph Studio pointed at your local server)
- `GET /info` and `POST /assistants/search` are good smoke-test endpoints once it's up

## Environment Variables

`rag-backend/.env` (copy from `rag-backend/.env.example`):

```
OPENAI_API_KEY=your-openai-api-key-here
SUPABASE_URL=your-supabase-url-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

LANGCHAIN_TRACING_V2=false           # set true only if you have a real LangSmith key
LANGCHAIN_API_KEY=your-langsmith-api-key-here   # optional
LANGCHAIN_PROJECT=ai-agent-pdf-chatbot          # optional
```

Notes:
- Leave `LANGCHAIN_TRACING_V2=false` unless you have a valid `LANGCHAIN_API_KEY` — with tracing on and no/invalid key, the dev server logs a `403 Forbidden` from LangSmith on every startup (harmless, but noisy).
- `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` need a `documents` table and `match_documents` function set up per the [LangChain Supabase vector store docs](https://js.langchain.com/docs/integrations/vectorstores/supabase/).

The Django `backend/` has no required environment variables for local development — `SECRET_KEY`, `DEBUG`, and the SQLite path are hardcoded in `legal_platform/settings.py` for now. Treat that as fine for local dev only, not production.

## API Overview

The Django backend exposes:

- `POST /api/accounts/register/` — register a lawyer user
- `/api/accounts/users/` — user profile CRUD (`me`, `update_profile`, `change_password` actions)
- `/api/cases/cases/` — case CRUD (`my_cases`, `statistics`, `add_comment`, `comments` actions)
- `/api/cases/labels/`, `/api/cases/comments/`
- `/api/documents/documents/` — document CRUD, with `category`/`case`/`is_confidential` filtering
- `/api/documents/categories/`, `/api/documents/versions/`, `/api/documents/shares/`

Full request/response schemas are in Swagger (`/swagger/`). Most endpoints require an authenticated user.

## Customizing the RAG Agent

- `rag-backend/src/shared/configuration.ts` — shared defaults (vector store, `k` value, filter kwargs) for both graphs.
- `rag-backend/src/retrieval_graph/prompts.ts` — prompts used by the retrieval graph.
- `rag-backend/src/shared/retrieval.ts` — add a new retriever function here (and register it in `makeRetriever`) to swap the vector store.
- `rag-backend/src/ingestion_graph/graph.ts` / `retrieval_graph/graph.ts` — the actual LangGraph graph definitions.

## Troubleshooting

1. **Swagger shows no endpoints / 404 on API routes** — make sure `legal_platform/urls.py` includes each app's `urls.py` under `/api/...` (this was previously missing entirely; see git history). Restart `runserver` after adding new installed apps or dependencies — Django's autoreloader does not recover from an import error on its own.
2. **`ModuleNotFoundError: No module named 'django_filters'`** — `pip install -r requirements.txt` in the backend's venv, then restart the server (a fresh process, not just a file save).
3. **`rag-backend` install fails with `ERESOLVE`** — use `npm install --legacy-peer-deps`; there's an unresolved peer-dependency conflict between `@langchain/community`/`langchain`'s optional `typeorm` dependency and `better-sqlite3`.
4. **`rag-backend` logs a `403 Forbidden` fetching `/sessions` on startup** — `LANGCHAIN_TRACING_V2=true` with no/invalid `LANGCHAIN_API_KEY`. Set it to `false` or provide a real key.
5. **No frontend** — there isn't one yet in this repo. Both APIs above are usable directly (curl, Postman, Swagger UI) until a UI is built.
