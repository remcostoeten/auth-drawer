#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# This example consumes the published @remcostoeten/auth-drawer from npm (it is
# intentionally excluded from the monorepo workspace), so install locally first.
if [ ! -d "$ROOT/node_modules/@remcostoeten/auth-drawer" ]; then
  echo "→ Installing dependencies (published auth-drawer from npm)…"
  (cd "$ROOT" && bun install)
fi

echo "→ Starting PostgreSQL…"
docker compose -f "$ROOT/docker-compose.yml" up -d --wait

echo "→ Generating & applying database migrations…"
bun run db:generate
bun run db:migrate

echo "→ Starting Next.js dev server…"
bun run dev
