# Deployment — Ksocial

Monorepo: **Next.js** (`apps/web`, optional `apps/admin`) and **NestJS** (`apps/api`) + **PostgreSQL**. Deploy API and frontends separately; use managed Postgres (Neon, Supabase, Render, etc.).

## 1. Prepare

1. **PostgreSQL** — obtain `DATABASE_URL` (use SSL if the provider requires it).
2. **API env** — copy `apps/api/.env.example` (JWT, Cloudinary if used, `WEB_URL` / `CORS_ORIGINS`).
3. **Web env** — `NEXT_PUBLIC_API_URL` = public HTTPS API URL ending with `/v1`.
4. **Admin (optional)** — same API URL; allow the admin origin in CORS (`ADMIN_URL` or `CORS_ORIGINS`).

## 2. Deploy API (NestJS)

### Build & start

From **`apps/api`** (or an equivalent working directory):

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
npm run start
```

- Listen port: **`PORT`** (many platforms inject this automatically).
- Ensure **`DATABASE_URL`** points at production Postgres.

### Platform tips

| Platform | Notes |
|----------|--------|
| **Railway / Render / Fly.io** | Node service; run migrate + generate + build; start with `npm run start`. For npm workspaces, prefer **repo root** as the service root and `npm run … -w apps/api`. |
| **VPS (Ubuntu)** | PM2/systemd → `node dist/main.js`, Nginx HTTPS reverse proxy. |

### CORS & Socket.IO

- Set **`WEB_URL`** to the frontend origin (e.g. `https://app.example.com`) for CORS and Socket.IO.
- Chat WebSocket uses the **same API host** (no `/v1` on the socket URL). Proxies must allow WebSocket upgrades.

## 3. Deploy Web (Next.js)

### Vercel

1. Import the GitHub repo.
2. **Root Directory:** `apps/web`.
3. **Env:** `NEXT_PUBLIC_API_URL=https://<api-domain>/v1`.
4. Deploy with default `next build`.

### Local production check

```bash
npm run build -w apps/web
npm run start -w apps/web
```

## 4. Recommended order

1. Create DB → run **`prisma migrate deploy`** once.
2. Deploy **API** → copy public HTTPS URL.
3. Set **`NEXT_PUBLIC_API_URL`** and deploy **Web**.
4. Verify login, feed, and chat (WebSocket).

## 5. Security

- Never commit `.env`; use host env vars.
- Use long random JWT secrets in production (different from dev).
- Use HTTPS for web and API.

## 6. CI (optional)

GitHub Actions can run `npm ci`, migrate (with `DATABASE_URL` secret), and `npm run build` per app. Many teams still deploy via Vercel/Render on git push.

---

## 7. Concrete path: **Vercel (web) + Render (API)**

### 7.1 PostgreSQL on Render

1. [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**.
2. Copy **Internal** or **External** Database URL (`postgresql://...`).
3. Use it as **`DATABASE_URL`** on the API web service. Prefer Internal URL when API and DB are both on Render.

### 7.2 API Web Service on Render

Because this repo is an **npm workspaces** monorepo, a reliable setup is:

| Field | Value |
|--------|--------|
| Repo | `nextjs-blogs-project` |
| Branch | `master` (or `main`) |
| Root Directory | *(empty = repo root)* |
| Build | `npm ci && npm run migrate:deploy -w apps/api && npm run prisma:generate -w apps/api && npm run build -w apps/api` |
| Start | `npm run start -w apps/api` |

Alternative: Root Directory `apps/api` with `npm ci` only if dependency install works in that layout.

**Minimum env vars:**

| Variable | Meaning |
|----------|---------|
| `DATABASE_URL` | Postgres URL |
| `JWT_ACCESS_SECRET` | Long random secret |
| `JWT_SOCKET_SECRET` | Different secret for socket tokens |
| `WEB_URL` | Frontend Vercel origin (no trailing slash), e.g. `https://ksocial.vercel.app` |
| `CLOUDINARY_*` | Required if you use API uploads |
| `GOOGLE_*` / `WEB_AUTH_CALLBACK_URL` | Only if Google OAuth is enabled |

Create the service → wait for build. API URL example: `https://ksocial-api.onrender.com`.

REST base: `https://ksocial-api.onrender.com/v1`  
Health: `https://ksocial-api.onrender.com/v1/health`

**Render free tier:** the service may sleep; first request can be slow (cold start).

**WebSocket:** supported on Render Node web services; chat uses the API host without `/v1`.

### 7.3 Web on Vercel

1. [Vercel](https://vercel.com) → **Add New Project** → same GitHub repo.
2. **Root Directory:** `apps/web`
3. **Framework:** Next.js
4. **Env:**

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://<render-service>.onrender.com/v1` |

5. Deploy → copy the Vercel URL (e.g. `https://ksocial.vercel.app`).

### 7.4 Wire CORS / OAuth

1. On Render API, set **`WEB_URL`** to the real Vercel URL, then redeploy.
2. For Google OAuth, align callback URLs with Vercel + API hosts.

### 7.5 Smoke test

1. `GET …/v1/health` → 200.
2. Open Vercel site → register/login → feed.
3. Open Messages → send a chat message (check Network → WS if issues).

### 7.6 First-time checklist

1. Postgres on Render → `DATABASE_URL`.
2. Deploy API → `https://xxx.onrender.com`.
3. Deploy Vercel web with `NEXT_PUBLIC_API_URL=https://xxx.onrender.com/v1`.
4. Set `WEB_URL` on Render to the Vercel URL → redeploy API if needed.

### 7.7 Admin (optional)

- Second Vercel project, Root Directory `apps/admin`.
- Same `NEXT_PUBLIC_API_URL`.
- Add admin origin to `CORS_ORIGINS` / `ADMIN_URL` on the API.
