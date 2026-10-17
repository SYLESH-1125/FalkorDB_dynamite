#!/bin/sh
set -e

# apply database migrations before serving so a single-container host boots a valid schema
alembic upgrade head

# honour the platform-provided $PORT (Render, Railway, Fly, …); default to 8000 locally
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers "${WEB_CONCURRENCY:-1}"
