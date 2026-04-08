## Ksocial Website (Next.js Social App)

Dự án social web app (kiểu mini Facebook/Instagram) xây bằng **Next.js App Router**.

- **Core features hiện có**: Auth (Better Auth), posts + media (Cloudinary), like/comment/follow, notifications, chat (conversations/messages), realtime (Socket.IO).
- **Tech stack**: Next.js 15, React 19, Tailwind/Radix UI, Better Auth, Drizzle ORM + Postgres, Cloudinary, Socket.IO.

## Chạy local (Monorepo)

Repo đã được tách thành:

- `apps/web`: Frontend (Next.js)
- `apps/api`: Backend (NestJS)

Chạy cả 2 cùng lúc ở repo root:

```bash
npm run dev
```

Mặc định:
- web: `http://localhost:3000`
- api: `http://localhost:4000/v1` (health: `/v1/health`)

Frontend gọi backend qua `NEXT_PUBLIC_API_URL` (xem `apps/web/.env.example`).

## Chạy local (Web-only)

### Prerequisites

- Node.js 20+ (khuyến nghị)
- Postgres (local hoặc cloud)
- Cloudinary account (để upload media)

### Cài đặt

```bash
npm install
```

### Environment variables

Tạo file `.env` ở project root.

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"

# Better Auth
BETTER_AUTH_SECRET="your-long-random-secret"
BASE_URL="http://localhost:3000"

# Cloudinary (upload media)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Database (Drizzle)

Schema nằm ở `src/lib/db/schema.ts`. Migrations output ở thư mục `drizzle/`.

Ví dụ workflow thường dùng:

```bash
# generate migrations (nếu bạn có script drizzle-kit riêng trong dự án)
# npx drizzle-kit generate

# apply migrations (tuỳ cách bạn setup; có thể dùng drizzle-kit push)
# npx drizzle-kit push
```

Nếu bạn muốn mình chuẩn hoá scripts drizzle trong `package.json` (generate/push/studio) để chạy thống nhất, mình làm được.

### Run dev server

```bash
npm run dev
```

Mở `http://localhost:3000`.

## Realtime (Socket.IO)

Project có Socket.IO server (`src/lib/realtime/socket-server.ts`).

- Client join rooms:
  - `user:<userId>` để nhận notification realtime
  - `conversation:<conversationId>` để nhận message realtime
  - `post:<postId>` để nhận like/comment realtime
- Endpoint path: `/api/socket` (route handler `src/app/api/socket/route.ts` chỉ trả JSON “server is running”).

Lưu ý: Socket.IO cần chạy trên Node runtime (không phải Edge).

## Upload media

Endpoint: `POST /api/upload` (`src/app/api/upload/route.ts`)

- **multipart/form-data**: field `files` (nhiều file)
- **application/json**: `{ mediaUrl, mediaType }` để upload từ URL

Giới hạn:
- Image tối đa 10MB / file
- Video tối đa 50MB / file

## Tài liệu dự án

- `docs/ARCHITECTURE.md`: kiến trúc + mapping feature -> code
- `docs/API.md`: API routes + Server Actions + realtime events
- `docs/ROADMAP.md`: lộ trình nâng cấp lên “social web app” chuẩn (feed, privacy, moderation, scaling…)

## Scripts

- `npm run dev`: chạy local
- `npm run build`: build
- `npm run start`: start production build
- `npm run lint`: eslint
