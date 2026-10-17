# BHUMI

**Bharat Hub for Unified Mining Intelligence**

Ministry of Coal · Smart India Hackathon 2026 · Problem Statement 23

BHUMI is a document-digitisation, AI-assisted query, and automated-reporting platform. It ingests
mining-sector documents (PDF, DOCX, spreadsheets, scanned images), extracts and embeds their
content, builds a knowledge graph, and lets officials query the corpus and generate reports in
multiple Indian languages.

---

## Architecture

BHUMI is a two-tier application. The two tiers deploy to **different** platforms:

| Tier | Stack | Deploys to |
| --- | --- | --- |
| **Frontend** (`frontend/`) | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 | **Vercel** |
| **Backend** (`backend/`) | FastAPI · PostgreSQL + pgvector · Neo4j · MinIO/S3 · PyTorch + sentence-transformers | **A container host** (Render, Railway, Fly.io, a VPS, …) |

> **Why the backend is not on Vercel.** Vercel runs stateless serverless functions with a small
> bundle limit and no persistent services. The backend loads a PyTorch embedding model into memory
> and depends on long-running PostgreSQL, Neo4j, and object storage. That does not fit the
> serverless model, so the backend is containerised and hosted separately. The frontend talks to it
> over HTTPS via the `NEXT_PUBLIC_API_URL` environment variable.

Both tiers follow clean-architecture boundaries (`domain` → `application` → `infrastructure` →
`presentation`), documented in [`CLAUDE.md`](./CLAUDE.md).

---

## Local development

Prerequisites: Docker + Docker Compose, Node.js 20+.

```bash
# 1. Backend + datastores (Postgres, Neo4j, MinIO) via Docker
cp .env.example .env                       # fill in JWT_SECRET and, optionally, API keys
python -c "import secrets; print(secrets.token_hex(32))"   # value for JWT_SECRET
docker compose up --build                  # backend on http://localhost:8000

# 2. Frontend (separate terminal)
cd frontend
cp .env.example .env.local                 # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                                 # http://localhost:3000
```

---

## Production deployment

### Frontend → Vercel

1. Push this repository to GitHub and import it in Vercel (**New Project**).
2. **Set the project _Root Directory_ to `frontend`.** This is required — the repo is a monorepo
   and Vercel must build from the Next.js app folder. Vercel then auto-detects Next.js
   (see [`frontend/vercel.json`](./frontend/vercel.json)).
3. Add the environment variable:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | Public HTTPS URL of your deployed backend, e.g. `https://api.bhumi.example.com` |

4. Deploy. Security headers (HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
   `Permissions-Policy`) are applied from [`frontend/next.config.ts`](./frontend/next.config.ts).

### Backend → container host

The backend ships a production [`Dockerfile`](./backend/Dockerfile) that runs as a non-root user,
honours the platform-provided `$PORT`, exposes a `/health` check, and applies database migrations
on start.

**Option A — self-host the full stack (VPS):**

```bash
cp .env.example .env    # set JWT_SECRET, POSTGRES_PASSWORD, NEO4J_PASSWORD,
                        # S3_ACCESS_KEY/S3_SECRET_KEY, CORS_ORIGINS=<your Vercel URL>
docker compose -f docker-compose.prod.yml up -d --build
```

Datastore ports bind to `127.0.0.1` only; put the API behind a TLS reverse proxy (Caddy / Nginx /
Traefik) and point `NEXT_PUBLIC_API_URL` at that HTTPS endpoint.

**Option B — managed PaaS (Render / Railway / Fly.io):** deploy `backend/` from the Dockerfile and
attach managed PostgreSQL (with the `pgvector` extension), Neo4j (Aura), and an S3-compatible bucket
(AWS S3 / Cloudflare R2). Set the environment variables below.

> **CORS:** set `CORS_ORIGINS` to your exact Vercel URL (comma-separated for multiple), e.g.
> `https://bhumi.vercel.app`.

---

## Environment variables

**Frontend** — see [`frontend/.env.example`](./frontend/.env.example):

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API (browser-reachable). |

**Backend** — see [`backend/.env.example`](./backend/.env.example): `DATABASE_URL`, `NEO4J_*`,
`S3_*`, `CORS_ORIGINS`, `JWT_SECRET` (required), `OPENROUTER_API_KEY`, `SARVAM_API_KEY`,
`WEB_CONCURRENCY`, and the bootstrap/demo account pairs.

---

## Health & operations

- **Health check:** `GET /health` → `{"status": "ok"}`.
- **Migrations:** run automatically on backend container start (`alembic upgrade head`).
- **First admin:** set `BOOTSTRAP_ADMIN_EMPLOYEE_ID` / `BOOTSTRAP_ADMIN_PASSWORD` once, then clear
  them after the first boot.
