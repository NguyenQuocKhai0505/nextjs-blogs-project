# Ksocial — Mạng xã hội (monorepo)

Ứng dụng mạng xã hội full-stack: bài viết đa phương tiện, tương tác (like, bình luận), theo dõi, thông báo, chat trực tiếp (Socket.IO), khám phá người dùng và đa ngôn ngữ giao diện.

## Kiến trúc tổng quan

| Thành phần | Công nghệ | Thư mục |
|------------|-----------|---------|
| Frontend | Next.js (App Router), React, Tailwind, Radix UI | `apps/web` |
| Backend | NestJS, Prisma ORM, PostgreSQL | `apps/api` |
| Realtime | Socket.IO (chat, tùy chọn thông báo) | `apps/api` + client |

Chi tiết kiến trúc và luồng nghiệp vụ: xem thư mục [`docs/`](./docs/).

## Yêu cầu môi trường

- Node.js 20+
- PostgreSQL
- (Tùy chọn) tài khoản lưu trữ media nếu cấu hình upload qua API

## Cài đặt và chạy phát triển

Từ thư mục gốc repository:

```bash
npm install
npm run dev
```

Mặc định:

- **Web:** http://localhost:3000  
- **API:** http://localhost:4000/v1  
- **Kiểm tra API:** `GET http://localhost:4000/v1/health`

## Biến môi trường

- Sao chép `apps/web/.env.example` → `apps/web/.env` (đặc biệt `NEXT_PUBLIC_API_URL` trỏ tới API, ví dụ `http://127.0.0.1:4000/v1`).
- Sao chép `apps/api/.env.example` → `apps/api/.env` (chuỗi kết nối PostgreSQL, JWT, CORS, v.v.).

## Cơ sở dữ liệu (Prisma)

Sau khi chỉnh `schema.prisma` hoặc lần đầu clone:

```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

## Tài liệu dự án

| Tài liệu | Nội dung |
|----------|----------|
| [docs/README.md](./docs/README.md) | Mục lục tài liệu |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Kiến trúc hệ thống, module, dữ liệu |
| [docs/API.md](./docs/API.md) | REST API (`/v1`) và ghi chú Socket.IO chat |
| [docs/DEPLOY.md](./docs/DEPLOY.md) | Hướng dẫn deploy production |
| [docs/PRESENTATION-EN.md](./docs/PRESENTATION-EN.md) | Gợi ý thuyết trình / demo (tiếng Anh, Markdown) |
| [docs/PRESENTATION-EN.docx](./docs/PRESENTATION-EN.docx) | Cùng nội dung — file Word (`.docx`) |

## Giấy phép & đóng góp

Theo quy định môn học / nhóm thực hiện dự án.
