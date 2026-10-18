# FalkorDB Graph Hacks — final submission

| | |
| --- | --- |
| **Live app** | https://falkordb-bhumi-dynamite.vercel.app/ |
| **API + graph** | https://bhumi-company-brain.onrender.com (`GET /health`) |
| **Repository** | https://github.com/SYLESH-1125/FalkorDB_dynamite |

## What to demo

1. **Get started** → pick a role → sign in or create account (role stays aligned).
2. **Company Brain** (`/brain`) — FalkorDB-backed ask with graph path and sources.
3. **Query**, **Topics**, **Reports**, **Dashboard** — populated via live API; empty backend responses fall back to embedded demo fixtures (`NEXT_PUBLIC_MOCK_EMPTY_FALLBACK` defaults to on).

## Deploy env (Vercel)

- `NEXT_PUBLIC_DEMO_MODE=false`
- `NEXT_PUBLIC_API_URL=https://bhumi-company-brain.onrender.com`

## Deploy env (Render)

See `render.yaml` and `backend/.env.example` (Supabase pooler, `ALLOW_PUBLIC_SIGNUP`, FalkorDB in-container).
