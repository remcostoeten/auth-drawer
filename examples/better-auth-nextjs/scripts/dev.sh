#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Starting PostgreSQL…"
docker compose -f "$ROOT/docker-compose.yml" up -d --wait

echo "→ Generating & applying database migrations…"
bun run db:generate
bun run db:migrate

echo "→ Starting Next.js dev server…"
bun run dev
