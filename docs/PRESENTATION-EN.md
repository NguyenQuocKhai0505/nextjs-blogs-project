# Ksocial — Presentation Notes (English)

Use this document for demos, slide outlines, or oral defense. It reflects the codebase and `docs/ARCHITECTURE.md`, `docs/API.md`, and `README.md`.

---

## 1. One-sentence pitch

**Ksocial** is a **full-stack social network** in a **monorepo**: a **Next.js** web app talks to a **NestJS** API backed by **PostgreSQL** (via **Prisma**), with **realtime chat** over **Socket.IO**, **JWT authentication**, optional **Google OAuth**, **media uploads**, **in-app notifications**, and **English / Vietnamese / Korean** UI strings.

---

## 2. Architecture (high level)

| Layer | Role |
|--------|------|
| **`apps/web`** | **Next.js (App Router)** — UI, server components where useful, client components for interactive areas (feed, chat, etc.). Calls the API using `NEXT_PUBLIC_API_URL`. Stores the access token in **cookies + `localStorage`** and sends **`Authorization: Bearer`** on protected requests. |
| **`apps/api`** | **NestJS** with global prefix **`/v1`** — business logic, validation, auth guards, Prisma to PostgreSQL, **Socket.IO** gateway on the same API host for chat. |

**Typical flow:** Browser → Next.js → `GET/POST .../v1/...` → Nest + Prisma → PostgreSQL; for chat, an extra **WebSocket** connection to the API (Socket.IO).

**Root scripts** (`package.json`): **`npm run dev`** runs **web + API together** (`concurrently`); **`dev:web`** / **`dev:api`** are also available.

**Default dev URLs (from README):**

- Web: `http://localhost:3000`
- API: `http://localhost:4000/v1`
- Health: `GET http://localhost:4000/v1/health`

---

## 3. User-visible features (demo checklist)

### Authentication & account

- **Register / login** with JWT access tokens.
- **Profile**: current user (`/me`); public profiles by user id; relationship flags (you follow / follows you / mutual).
- **Optional Google OAuth** — API: `GET /v1/google`, `GET /v1/google/callback` (see `docs/API.md`). Ensure env and redirect URLs are set for production.

### Social graph

- **Follow / unfollow** users.
- **Discover users** (public directory + search).
- **Header user search** → **`/discover?q=...`** via **`GET /v1/search-users`**.
- **Mutual friends** — lists and status endpoints (mutual follow; relevant for trust and **starting 1:1 chat**).

### Posts (social feed + blog-like detail)

- **List posts** with filters: **categories**, **time window (days)**.
- **Posts by author**.
- **Single post** by **slug**.
- **Create / edit / delete** (author or **admin**).
- **Rich content**: body plus optional **image URLs** and **video URLs**.
- **Likes**: toggle, check liked state.
- **Comments**: list, add, delete with permission rules; **threaded replies** via **`parentId`**.

### Categories

- **Public listing** and **trending** (most posts in the last *N* days).
- **Admin CRUD** when the user role is **ADMIN**.

### Uploads

- **Authenticated multipart upload**; API returns a **URL** for posts or chat.

### Notifications

- **In-app notifications** with cursor pagination.
- **Unread count** and **mark all read**.
- Schema notification types include: post liked, post commented, followed, system.

### Chat (major differentiator)

- **Conversation list** with **unread counts**.
- **Direct (1:1)** and **group** conversations (groups aligned with mutual-friends rules in architecture docs).
- **Messages**: text plus optional **image URL** / **video URL**.
- **Read state** per user per conversation (`ConversationReadState`); **`POST /v1/conversations/:id/read`** — cursor does not move backward.
- **Hide conversation** per user.
- **Message recall** within a time window.
- **Realtime**: Socket.IO rooms `conv:<conversationId>`; server → client e.g. **`message:created`**, **`message:revoked`**; client → server **`conversations:join`**, **`presence:ping`**.

### Presence (“online / last seen”)

- **`last_seen_at`** updated by **`POST /v1/me/presence`**, socket lifecycle, and **`presence:ping`**.
- UI treats user as **online** if last seen within about **3 minutes** (server-side heuristic).

### Internationalization

- Message files: `apps/web/src/messages/` — **`en`**, **`vi`**, **`ko`**.

### Main routes (App Router)

- Home feed: `(app)/page.tsx`
- Discover: `(app)/discover/page.tsx`
- Profile: `(app)/profile/page.tsx`, `(app)/profile/[userId]/page.tsx`
- Post: `(app)/post/[slug]/page.tsx`, create, edit
- Contact / chat: `(app)/contact/page.tsx`
- Admin categories: `(app)/admin/categories/page.tsx`
- Auth: `(auth)/auth/page.tsx`, callback
- About: `(app)/about/page.tsx`

### Optional AI

- **`POST /v1/ai/chat`** — optional, depends on module configuration. Mention as extension or demo-only if not wired.

---

## 4. Backend modules (one slide each)

| Module | Responsibility |
|--------|----------------|
| `auth` | Register, login, JWT; optional Google OAuth |
| `users` | Public profiles, follow/unfollow, discover, search, mutual friends, presence |
| `posts` | CRUD, likes, threaded comments, filters |
| `categories` | Public + admin CRUD, trending |
| `upload` | Multipart uploads, return media URL |
| `chat` | Conversations, messages, read/hide/recall, **ChatGateway** (Socket.IO) |
| `notifications` | In-app notifications, unread, mark read |
| `ai` | Optional AI chat endpoint |

**Auth pattern:** protected routes use **`Authorization: Bearer`**. Some reads are **public** (e.g. posts list, discover, trending) for anonymous browsing.

---

## 5. Data model (Prisma — short talking points)

- **User**: profile fields, **role** (`USER` | `ADMIN`), **emailVerified**, **lastSeenAt**
- **Account** / **Session** — linked credentials and sessions
- **Follow** — unique follower/following pair
- **Post**, **PostLike**, **Comment**, **Category**
- **Conversation** (`DIRECT` | `GROUP`), **ConversationMember**, **Message** (recall/revoke), **ConversationReadState**, **ConversationHide**
- **AppNotification** (+ counters as documented) for the notification center

Full schema: `apps/api/prisma/schema.prisma`.

---

## 6. REST API overview

All REST paths are under **`/v1`** (e.g. `http://localhost:4000/v1/health`). See **`docs/API.md`** for the full table: auth, users, posts, categories, upload, app-notifications, chat, AI, and Socket.IO handshake notes.

---

## 7. Environment & deployment (bullet slide)

- **Node.js 20+**, **PostgreSQL** required.
- Copy **`apps/web/.env.example`** → **`apps/web/.env`** (`NEXT_PUBLIC_API_URL` → e.g. `http://127.0.0.1:4000/v1`).
- Copy **`apps/api/.env.example`** → **`apps/api/.env`** (database URL, JWT, CORS / `WEB_URL`).
- Migrations: `cd apps/api` → `npx prisma migrate deploy` and `npx prisma generate`.
- Production details: **`docs/DEPLOY.md`**.

---

## 8. Suggested demo order (2–3 minutes)

1. Home **feed** (guest vs logged-in if you show both).
2. **Create post** — optionally **upload** then attach URL.
3. **Like** and **comment** (show a reply thread if the UI exposes it).
4. **Discover** → **follow** → open **profile** and mention **relationship / mutual**.
5. **Chat**: send a message; show **realtime** update without refresh.
6. **Unread** badge → **mark conversation read**.
7. **Notifications** list / unread count.
8. **Admin**: **categories** + **trending**.
9. Switch **language** (en / vi / ko).

---

## 9. Limitations & extensions (good for Q&A)

- **Online status** is **heuristic** (recent `last_seen_at`), not a dedicated presence service.
- **AI** endpoint is **optional** and environment-dependent.
- **Google OAuth** requires correct OAuth client IDs and redirect URIs per environment.

---

## 10. Related project docs

| File | Content |
|------|---------|
| `README.md` | Monorepo overview, run commands |
| `docs/README.md` | Doc index |
| `docs/ARCHITECTURE.md` | System design, modules, DB, Socket.IO, presence |
| `docs/API.md` | REST + Socket events |
| `docs/DEPLOY.md` | Production deployment |
