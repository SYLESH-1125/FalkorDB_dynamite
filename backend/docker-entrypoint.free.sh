#!/bin/sh
set -e

# Render has no IPv6 egress to Supabase "direct" db.*.supabase.co — Session pooler is required.
case "${DATABASE_URL:-}" in
  *@db.*.supabase.co*)
    echo "ERROR: DATABASE_URL uses Supabase DIRECT host (db.*.supabase.co)." >&2
    echo "Render cannot reach it (Network is unreachable / Errno 101)." >&2
    echo "Supabase → Connect → Connection pooling → Session mode → copy URI." >&2
    echo "Host must be *.pooler.supabase.com and user postgres.<project-ref>." >&2
    exit 1
    ;;
esac

FALKORDB_BIN="${FALKORDB_BIN_PATH:-/var/lib/falkordb/bin}"
MODULE="${FALKORDB_BIN}/falkordb.so"

if [ ! -f "$MODULE" ]; then
  echo "falkordb.so missing at $MODULE" >&2
  ls -la "${FALKORDB_BIN}" 2>/dev/null || true
  exit 1
fi

export BROWSER=0
export REDIS_ARGS="--bind 127.0.0.1 --port 6379 --daemonize yes"
sh "${FALKORDB_BIN}/run.sh"

ready=0
i=0
while [ "$i" -lt 30 ]; do
  if redis-cli -h 127.0.0.1 -p 6379 ping 2>/dev/null | grep -q PONG; then
    ready=1
    break
  fi
  i=$((i + 1))
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "FalkorDB did not start (redis-cli ping failed)" >&2
  exit 1
fi
echo "FalkorDB ready at 127.0.0.1:6379"

if ! alembic upgrade head; then
  echo "Database migration failed. Check pooler URL, DATABASE_SSL=true, and logs above." >&2
  exit 1
fi
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 1
