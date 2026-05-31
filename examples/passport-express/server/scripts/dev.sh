#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$ROOT/../docker-compose.yml"

if [ ! -f "$ROOT/.env" ]; then
  echo "→ Copying .env.example to .env"
  cp "$ROOT/.env.example" "$ROOT/.env"
fi

if [ ! -d "$ROOT/node_modules" ]; then
  echo "→ Installing server dependencies…"
  (cd "$ROOT" && bun install)
fi

echo "→ Starting PostgreSQL…"
docker compose -f "$COMPOSE" up -d --wait

echo "→ Applying database migrations…"
(cd "$ROOT" && bun run db:generate && bun run db:migrate)

echo "→ Starting Express server…"
(cd "$ROOT" && bun run dev)
