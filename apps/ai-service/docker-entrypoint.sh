#!/bin/sh
set -e
PORT="${PORT:-8000}"
echo "Starting ai-service on 0.0.0.0:${PORT} and [::]:${PORT}"
# Dual-stack: Railway health checks use IPv4; legacy private networking uses IPv6.
exec hypercorn app.main:app --bind "0.0.0.0:${PORT}" --bind "[::]:${PORT}"
