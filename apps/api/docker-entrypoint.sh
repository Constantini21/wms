#!/bin/sh
set -e

echo 'Applying database schema...'
bunx prisma db push --skip-generate --accept-data-loss

echo 'Seeding database...'
bun run prisma/seed.ts || echo 'Seed step skipped or already applied'

echo 'Starting API...'
exec node dist/main.js
