# Ksocial Admin (`apps/admin`)

Next.js control plane on **port 3001**. Shares auth API with `apps/web` / `apps/api`.

## Setup

```bash
cp .env.example .env.local
npm run dev:admin
# or from root: npm run dev
```

Env (public only):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | API base including `/v1` |
| `NEXT_PUBLIC_ACCESS_TOKEN_KEY` | localStorage/cookie key for JWT |

JWT **values** are stored after login — never in env. `JWT_ACCESS_SECRET` stays on the API.

## Auth layout (like web)

- `(auth)/login` — public login, ADMIN role required
- `(protected)/*` — `AdminGuard` + `AdminShell`

## Test

1. Open http://localhost:3001 → redirect `/login`
2. Sign in with an ADMIN account
3. Dashboard loads `GET /v1/admin/dashboard`
