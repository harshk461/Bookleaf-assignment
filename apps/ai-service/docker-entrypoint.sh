#!/bin/sh
set -e
PORT="${PORT:-8000}"
# Hypercorn dual-stack bind: Railway health checks use IPv4; private networking uses IPv6.
exec hypercorn app.main:app --bind "[::]:${PORT}"
