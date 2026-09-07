# Architecture — Ksocial

## 1. Overview

Three apps in one monorepo:

| App | Role |
|-----|------|
| **`apps/web`** | Next.js social client. Calls Nest via `NEXT_PUBLIC_API_URL`. JWT in `localStorage` + cookie; `Authorization: Bearer` on protected calls. |
| **`apps/api`** | NestJS, global prefix **`/v1`**. Prisma → PostgreSQL. Socket.IO for chat on the same API host. |
| **`apps/admin`** | Next.js control UI (port 3001). Same auth API; only users with DB role **`ADMIN`** may enter. |

Typical flow: Browser → Next.js → REST `/v1/*` → Nest + Prisma → PostgreSQL. Chat adds a WebSocket to the API host.

## 2. Backend (NestJS)

### 2.1 Modules

| Area | Responsibility |
|------|----------------|
| `auth` | Register, login, JWT; optional Google OAuth. New users always get role `USER`. |
| `users` | Profiles, follow, discover, search, mutual friends, presence (`last_seen_at`) |
| `posts` | CRUD, likes/reactions, threaded comments, filters |
| `categories` | Public **read**; mutations only via **`/admin/categories`** |
| `admin` | Dashboard stats, admin category CRUD, `RolesGuard` |
| `upload` | Multipart upload → media URL |
| `chat` | Direct/group chat, read state, hide, recall; **ChatGateway** |
| `notifications` | In-app notifications, unread |
| `moments` / `stories` / `reels` / `saved` / `shares` / `reports` | Feature modules as in `apps/api/src` |
| `ai` | Optional Gemini-backed helpers (env-gated, throttled) |

### 2.2 Auth & authorization

- Access JWT: `Authorization: Bearer <token>` (`sub` = user id; role is **not** trusted from the token alone).
- **`RolesGuard`** + `@Roles(ADMIN)` loads `user.role` from the database for `/admin/*`.
- ADMIN is assigned only via DB / ops scripts (`scripts/promote-admin.mjs`), never via public register.

### 2.3 Data (Prisma)

Schema: `apps/api/prisma/schema.prisma`. Core models include **User** (`role`, `lastSeenAt`), **Follow**, **Post**, **Category**, **Conversation** / **Message**, **AppNotification**, **Moment**, **Report**, etc.

### 2.4 Realtime (chat)

- Gateway: `apps/api/src/chat/chat.gateway.ts`
- Auth via JWT on handshake; rooms `conv:<id>`
- Events such as `message:created`, `message:revoked`, `conversations:join`, `presence:ping`

### 2.5 Presence

- `last_seen_at` via `POST /me/presence`, socket lifecycle, and `presence:ping`
- UI “online” heuristic: typically last seen within ~3 minutes

## 3. Frontends

### Web (`apps/web`)

- `(app)/` shell for authenticated UX; `(auth)/` for login
- `lib/api.ts`, `lib/auth-fetch.ts`, i18n under `src/messages` (en / vi / ko)

### Admin (`apps/admin`)

- `(auth)/login` — public; requires ADMIN after `/me`
- `(protected)/*` — `AdminGuard` + shell (dashboard, categories, …)

## 4. Operations

- Build apps independently; PostgreSQL + migrations required for API
- CORS: allow web (`WEB_URL`) and admin (`ADMIN_URL` / `CORS_ORIGINS`, e.g. `http://localhost:3001`)
- See [DEPLOY.md](./DEPLOY.md)
