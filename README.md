## Ksocial Monorepo

Repo đã được tách thành 2 phần rõ ràng:

- **Frontend**: `apps/web` (Next.js)
- **Backend**: `apps/api` (NestJS)

### Chạy dev (cả 2)

```bash
npm install
npm run dev
```

Mặc định:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/v1` (health: `GET /v1/health`)

### Env

- Copy `apps/web/.env.example` -> `apps/web/.env`
- Copy `apps/api/.env.example` -> `apps/api/.env`

### Tài liệu chi tiết

Xem `apps/web/docs/*` (architecture/api/roadmap của app hiện tại).

