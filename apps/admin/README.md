# Ksocial Admin

Next.js admin UI on port **3001**. Uses the same Nest API as `apps/web`.

## Setup

```bash
cp .env.example .env.local
# from repo root:
npm run dev:admin
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | API base including `/v1` |
| `NEXT_PUBLIC_ACCESS_TOKEN_KEY` | Browser storage key for JWT |

Do not put JWT secrets in the admin app. Assign **ADMIN** in the database (`apps/api` promote script).

## Structure

- `(auth)/login` — sign-in; requires `role === ADMIN`
- `(protected)/*` — `AdminGuard` + shell (dashboard, categories, …)

## Smoke test

1. http://localhost:3001 → redirects to `/login`
2. Sign in as ADMIN
3. Dashboard calls `GET /v1/admin/dashboard`
4. Categories CRUD via `GET/POST/PATCH/DELETE /v1/admin/categories`
