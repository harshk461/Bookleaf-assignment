#!/bin/sh
set -e
PORT="${PORT:-8000}"
echo "Starting ai-service on 0.0.0.0:${PORT}"
# Railway health checks and the edge proxy use IPv4 — bind 0.0.0.0 (not :: only).
# New Railway environments also route private IPv4 traffic to this address.
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --log-level info
