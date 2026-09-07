# Ksocial

Full-stack social platform in an **npm workspaces** monorepo: user app, REST/realtime API, and admin console.

| App | Stack | Port (dev) |
|-----|--------|------------|
| [`apps/web`](./apps/web) | Next.js (App Router), React, Tailwind | `3000` |
| [`apps/api`](./apps/api) | NestJS, Prisma, PostgreSQL, Socket.IO | `4000` (`/v1`) |
| [`apps/admin`](./apps/admin) | Next.js admin UI (ADMIN role) | `3001` |

## Features

- Auth (JWT; optional Google OAuth), profiles, follow graph, discover/search
- Posts with media, reactions, threaded comments, categories
- Moments, stories/reels-related modules, saved posts, reports
- Realtime chat (Socket.IO), presence, in-app notifications
- AI helpers (optional, env-gated)
- Admin: dashboard, category CRUD under `/v1/admin/*` with **RolesGuard**

## Quick start

**Requirements:** Node.js 20+, PostgreSQL

```bash
npm install
cp apps/api/.env.example apps/api/.env      # set DATABASE_URL, JWT secrets
cp apps/web/.env.example apps/web/.env      # NEXT_PUBLIC_API_URL=http://127.0.0.1:4000/v1
cp apps/admin/.env.example apps/admin/.env.local

cd apps/api && npx prisma migrate deploy && npx prisma generate && cd ../..
npm run dev
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API health | http://localhost:4000/v1/health |
| Admin | http://localhost:3001 |

Useful scripts: `npm run dev:web` · `npm run dev:api` · `npm run dev:admin`

### Admin accounts

Admins are assigned in the database only (not via public register). From `apps/api`:

```bash
npm run roles:promote -- you@email.com
# or create: node scripts/promote-admin.mjs you@email.com YourPassword123
```

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](./docs/README.md) | Documentation index |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design |
| [docs/API.md](./docs/API.md) | REST `/v1` and Socket.IO notes |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Production deployment |
| [apps/admin/README.md](./apps/admin/README.md) | Admin app setup |

## License

Personal / academic project — rights reserved by the author unless otherwise stated.
