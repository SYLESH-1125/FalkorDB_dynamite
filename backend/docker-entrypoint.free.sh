#!/bin/sh
set -e

MODULE="${FALKORDB_MODULE_PATH:-}"
if [ -z "$MODULE" ]; then
  for candidate in \
    /usr/lib/redis/modules/falkordb.so \
    /opt/FalkorDB/lib/falkordb.so \
    /FalkorDB/lib/falkordb.so; do
    if [ -f "$candidate" ]; then
      MODULE="$candidate"
      break
    fi
  done
fi
if [ -z "$MODULE" ]; then
  MODULE=$(find /usr /opt /var /FalkorDB -name 'falkordb.so' 2>/dev/null | head -1)
fi
if [ -z "$MODULE" ]; then
  echo "falkordb.so was not found in the image" >&2
  exit 1
fi
echo "Using FalkorDB module: $MODULE"

mkdir -p /data
redis-server \
  --loadmodule "$MODULE" \
  --bind 127.0.0.1 \
  --port 6379 \
  --protected-mode no \
  --daemonize yes \
  --dir /data \
  --dbfilename brain.rdb

ready=0
i=0
while [ "$i" -lt 20 ]; do
  if redis-cli ping | grep -q PONG; then
    ready=1
    break
  fi
  i=$((i + 1))
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "FalkorDB did not start" >&2
  exit 1
fi

alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers 1
