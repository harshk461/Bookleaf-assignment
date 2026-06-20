#!/bin/sh
set -e
PORT="${PORT:-8000}"
# Bind on :: so Railway private networking (IPv6 / dual-stack) can reach this service.
# Health checks still work over IPv4 when the kernel maps IPv4 to the IPv6 socket.
exec uvicorn app.main:app --host :: --port "$PORT"
