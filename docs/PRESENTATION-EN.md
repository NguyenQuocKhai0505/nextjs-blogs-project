# Ksocial — Demo / presentation notes (English)

Short outline for demos, interviews, or portfolio walkthroughs. Details: `docs/ARCHITECTURE.md`, `docs/API.md`, root `README.md`.

## Pitch

**Ksocial** is a full-stack social platform in a monorepo: **Next.js** web app, **NestJS** API (**PostgreSQL** / **Prisma**), **Socket.IO** chat, **JWT** auth, media uploads, notifications, optional AI helpers, and a separate **Admin** app with **role-based** category management.

## Architecture

| App | Role |
|-----|------|
| `apps/web` | Social UI (App Router); Bearer JWT to API |
| `apps/api` | NestJS `/v1` + Socket.IO |
| `apps/admin` | Admin UI; `ADMIN` role from DB + `RolesGuard` |

**Dev:** `npm run dev` → web `:3000`, API `:4000/v1`, admin `:3001`.

## Demo checklist

1. Register / login; profile and follow
2. Feed — create post, like, comment
3. Discover / search; mutual friends
4. Chat — realtime message, unread, presence
5. Moments (or other media features you ship)
6. Admin login → dashboard → categories CRUD
7. Language switch (en / vi / ko) on web

## Talking points

- Public category **reads** vs admin **mutations** under `/admin/categories`
- ADMIN only via DB / promote script — not public register
- Chat read cursors and presence heuristics

## Related docs

| File | Content |
|------|---------|
| `README.md` | Setup |
| `docs/ARCHITECTURE.md` | Design |
| `docs/API.md` | Endpoints |
| `docs/DEPLOY.md` | Production |
