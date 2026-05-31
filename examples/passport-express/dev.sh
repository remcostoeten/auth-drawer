#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Bootstrap envs if not present
[ -f "$ROOT/server/.env" ] || cp "$ROOT/server/.env.example" "$ROOT/server/.env"
[ -f "$ROOT/client/.env.local" ] || cp "$ROOT/client/.env.example" "$ROOT/client/.env.local"

# Install dependencies
[ -d "$ROOT/server/node_modules" ] || (echo "→ Installing server deps…" && cd "$ROOT/server" && bun install)
[ -d "$ROOT/client/node_modules" ] || (echo "→ Installing client deps…" && cd "$ROOT/client" && bun install)

echo "→ Starting PostgreSQL…"
docker compose -f "$ROOT/docker-compose.yml" up -d --wait

echo "→ Applying database migrations…"
(cd "$ROOT/server" && bun run db:generate && bun run db:migrate)

echo "→ Starting server (port 4000) and client (port 3006) in parallel…"
(cd "$ROOT/server" && bun run dev) &
SERVER_PID=$!

(cd "$ROOT/client" && bun run dev) &
CLIENT_PID=$!

trap 'kill $SERVER_PID $CLIENT_PID 2>/dev/null' EXIT
wait
