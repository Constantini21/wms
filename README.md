# WMS - Warehouse Management System

Monorepo (Bun workspaces) containing a NestJS API and a static Next.js frontend
for a complete Warehouse Management System.

> Code is written in English. The user-facing interface is in Portuguese.

## Stack

- **Bun** workspaces monorepo
- **apps/api** — NestJS + Prisma + PostgreSQL (JWT auth, role-based permissions)
- **apps/web** — Next.js (App Router, static export, client components) + Tailwind CSS v4
- **ESLint 9** (flat config) + **Prettier** — single quotes, no semicolons
- **Docker Compose** — PostgreSQL + API + Web (nginx)

## Features

- Authentication with login screen (JWT)
- Multi-user with roles and granular permissions (RBAC)
- Warehouses (galpões) registration
- Areas registration (linked to warehouses)
- Barcode / QR code reader to locate areas
- App shell layout with responsive sidebar

## Database conventions

- Database columns/tables use `snake_case` (mapped via Prisma `@map`/`@@map`)
- Application code uses `camelCase`

## Getting started (Docker)

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:3001/api
- PostgreSQL: localhost:5432

The API container automatically applies the schema and seeds the database.

Default login: `admin@wms.local` / `admin123`

## Local development

```bash
bun install

# API (needs a running Postgres and DATABASE_URL)
cd apps/api
bunx prisma generate
bunx prisma db push
bun run seed
bun run dev

# Web (in another terminal)
cd apps/web
bun run dev
```

## Scripts (root)

- `bun run lint` — lint all packages
- `bun run format` — format with Prettier
- `bun run build:api` — build the API
- `bun run build:web` — build the static web app

## Permissions

`users.read`, `users.write`, `roles.read`, `roles.write`,
`warehouses.read`, `warehouses.write`, `areas.read`, `areas.write`

Seeded roles:

- **Administrator** — all permissions
- **Operator** — warehouse/area read + area write
