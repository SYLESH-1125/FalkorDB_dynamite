# BHUMI Company Brain

**Graph Hacks: Context for AI Agents** · [WeMakeDevs × FalkorDB](https://www.wemakedevs.org/hackathons/falkordb)

**Track:** Company Brain

BHUMI is the company brain for a coal-ministry desk. People, teams, projects, documents, decisions, tickets, and chats live in one **FalkorDB** graph. The agent answers by traversing that graph, shows the path it walked, and cites the nodes. A new decision is merged into the same graph, so the next session sees it.

The organisation in the seed is synthetic. Names are fictional. Nothing private, paywalled, or login-protected is loaded.

**AI coding assistant:** Cursor (Grok) was used while building this. The graph model, the Cypher, and the product decisions are documented here so they can be explained without the assistant.

If FalkorDB is stopped, `GET /health` reports the graph down and `/api/brain/ask` returns 503. The answers do not fall back to another database.

---

## Graph data model

Graph name: `bhumi_company_brain`

| Label | What it is | Key properties |
| --- | --- | --- |
| `Person` | A colleague on the desk | `id`, `name`, `role` |
| `Team` | A unit that owns work | `id`, `name`, `mandate` |
| `Project` | A piece of work | `id`, `name`, `status` |
| `Document` | A note, SOP, annexure, or uploaded file | `id`, `name`, `kind` |
| `Decision` | A choice the desk can defend | `id`, `title`, `summary`, `decidedOn` |
| `Ticket` | An open work item | `id`, `title`, `status` |
| `Chat` | A desk thread | `id`, `name`, `excerpt`, `channel` |
| `Mine` | A mine the work depends on | `id`, `name` |
| `Subsidiary` | A coal subsidiary | `id`, `name`, `code` |
| `Organization` | Synthetic ministry desk (root org) | `id`, `name` |
| `Fact` | Evidence extracted from a document | `id`, `statement`, `confidence`, `pageRef`, `extractedAt` |
| `Topic` | Thematic tag on documents | `id`, `name` |
| `Issue` | Open operational / parliamentary issue | `id`, `title`, `status` |
| `Memory` | A question the agent already answered | `id`, `question`, `answer`, `askedAt` |

Relationships the agent follows:

`HAS_SUBSIDIARY`, `MEMBER_OF`, `OWNS`, `RESPONSIBLE_FOR`, `KNOWS_ABOUT`, `WORKED_ON`, `AUTHORED`, `ABOUT`, `DECIDED_BY`, `BASED_ON`, `AFFECTS`, `DEPENDS_ON`, `BELONGS_TO`, `REFERENCES`, `RAISED_BY`, `MENTIONS`, `EXTRACTED_FROM`, `ASKED_BY`

`Ticket` and `Chat` remain in the seed for impact analysis; `Issue` is what the agent uses for ownership + evidence questions.

Uploaded documents are merged into this same graph when a validation is approved, linked to their subsidiary and mine.

---

## Cypher the product runs

The queries are in [`backend/cypher/company_brain.cypher`](backend/cypher/company_brain.cypher) and in `backend/app/infrastructure/graph/company_brain.py`. They cover:

- who owns a project or mine
- who knows, worked on, or authored something
- the path from a decision back to the person and the source document
- what breaks when a mine or project stops (`DEPENDS_ON`, `AFFECTS`, tickets, documents, chats)
- `shortestPath` between two nodes
- PageRank on `(:Person)-[:KNOWS_ABOUT]->()`, with degree centrality if PageRank is unavailable
- session memory: `(:Memory)-[:ABOUT]->(node)`
- **issue investigation** (`issue_investigation`): `Issue` → `Project` / `Subsidiary`, responsible `Person`, supporting `Decision` → `Document` → `Fact`
- **evidence_from_project**: decisions and facts tied to a project
- **related_projects**: shared mines, teams, or decisions
- **knowledge_gaps**: projects missing an owner, decision, or fact
- **entity_aliases**: `alias` properties and exact duplicate names (names are never merged silently)
- **upsert_fact**: merge facts with `EXTRACTED_FROM` provenance

Try these on the Company Brain page:

- Who owns the ECL offtake variance issue and what decision supports the response?
- Who owns the Jharia Fire Monitoring project?
- What knowledge gaps exist in the company graph?
- Who knows about Jharia?
- Trace the decision to adopt human-in-loop validation
- What breaks if Gevra goes down?
- How is Meera Iyer connected to the Validation SOP?
- What did we ask last time?

---

## Architecture

| Tier | Stack | Deploys to |
| --- | --- | --- |
| Frontend (`frontend/`) | Next.js · React · TypeScript · Tailwind | **Vercel** (free) |
| API + FalkorDB (`backend/Dockerfile.free`) | FastAPI, FalkorDB in the same container | **Render** free web service |
| Postgres | Supabase free project, with `vector` enabled | **Supabase** |

Local development still uses Docker Compose: Postgres, MinIO, FalkorDB, and the API. FalkorDB Browser is on [http://localhost:3000](http://localhost:3000) when Compose is up (move the Next.js app to another port, or skip publishing `3000:3000` if it clashes).

---

## Local setup

Prerequisites: Docker, Node.js 20+.

```bash
cp .env.example .env
python -c "import secrets; print(secrets.token_hex(32))"   # JWT_SECRET
docker compose up --build                  # API on http://localhost:8000

cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                                # http://localhost:3000
```

`GET http://localhost:8000/health` returns `{"status":"ok","graph":"falkordb"}` once the graph is up.

Sign in with the demo account from `DEMO_ADMIN_EMPLOYEE_ID` / `DEMO_ADMIN_PASSWORD`, then open **Company Brain**.

---

## Deploy for free

### 1. Supabase (Postgres)

Create a free project. In the SQL editor, run `create extension if not exists vector;`. Copy the **direct** connection string (host `db.<ref>.supabase.co`, port **5432**, not the pooler).

### 2. Render (API + FalkorDB)

Dashboard → New → Blueprint → this repo. `render.yaml` creates one free web service from `backend/Dockerfile.free`. FalkorDB starts on `127.0.0.1:6379` inside that container. Set:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Supabase direct URI |
| `DATABASE_SSL` | `true` (already set in the blueprint) |
| `CORS_ORIGINS` | Your Vercel origin, e.g. `https://your-app.vercel.app` |
| `BOOTSTRAP_ADMIN_EMPLOYEE_ID` / `BOOTSTRAP_ADMIN_PASSWORD` | First administrator |
| `DEMO_*` | Optional role accounts |

The free service has an ephemeral disk. The company graph is re-seeded on boot. Session memories reset when the container restarts. Document upload needs object storage, which the free tier does not include; Company Brain does not need it.

### 3. Vercel (frontend)

Import the repo. **Root Directory: `frontend`.**

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | The Render URL, e.g. `https://bhumi-company-brain.onrender.com` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

`NEXT_PUBLIC_API_URL` alone is enough for Company Brain. The rest of the workspace uses the live API only when demo mode is `false`.

---

## Environment variables

Frontend: [`frontend/.env.example`](frontend/.env.example).

Backend: [`backend/.env.example`](backend/.env.example). Required: `DATABASE_URL`, `JWT_SECRET`, `FALKORDB_HOST`. `EMBEDDINGS_ENABLED=0` on the free tier so the embedding model is not loaded.

---

## Demo video

Record a two-minute walkthrough:

1. `GET /health` showing `"graph": "falkordb"`.
2. Company Brain: “Who owns the Jharia Fire Monitoring project?” with the path and the Cypher.
3. “Trace the decision to adopt human-in-loop validation” and point at `BASED_ON` → Validation SOP 2026.
4. Record a new decision, ask again, and show the new node.
5. Open Knowledge Graph and click a person, a decision, and a document.
6. Stop FalkorDB and show `/api/brain/ask` fail.

---

## Example investigation (graph path)

**Question:** Who owns the ECL offtake variance issue and what decision supports the response?

| Step | Relationship | Node |
| --- | --- | --- |
| 1 | `AFFECTS` | Issue → House Question Turnaround (project) |
| 2 | `AFFECTS` | Issue → ECL (subsidiary) |
| 3 | `RESPONSIBLE_FOR` | Vikram Sethi → project |
| 4 | `AFFECTS` | Decision “Answer ECL offtake variance from validated PQ log only” → project |
| 5 | `BASED_ON` | Decision → Parliamentary Question Log |
| 6 | `EXTRACTED_FROM` | Fact “ECL offtake trailed plan…” → Parliamentary Question Log |

The answer is assembled only from these edges. If step 4 were missing, the agent would report missing decision evidence instead of inventing one.

## Tests

From `backend/` with FalkorDB running (`docker compose up falkordb`):

```bash
cd backend
pip install -r requirements.txt
set JWT_SECRET=dev-secret
set FALKORDB_HOST=localhost
pytest -q
```

**Last run (local, Docker not available on CI agent machine):** integration tests skip when FalkorDB is unreachable; `test_graph_unavailable_on_bad_host` verifies the API layer fails closed without the graph.

## Health

- `GET /health` → `{"status":"ok","graph":"falkordb"}` or `"graph":"down"`.
- Migrations run on container start (`alembic upgrade head`).
- Clear `BOOTSTRAP_ADMIN_*` after the first boot.
