# Hướng dẫn triển khai (deploy) — Ksocial

Monorepo gồm **Next.js** (`apps/web`) và **NestJS** (`apps/api`) + **PostgreSQL**. Hai dịch vụ nên deploy riêng; database dùng dịch vụ managed (Neon, Supabase, Railway Postgres, v.v.).

## 1. Chuẩn bị

1. **PostgreSQL** — lấy chuỗi `DATABASE_URL` (PostgreSQL, có SSL nếu nhà cung cấp yêu cầu).
2. **Biến môi trường API** — xem `apps/api/.env.example` (JWT, Cloudinary nếu dùng upload, `WEB_URL` cho CORS).
3. **Biến môi trường Web** — `NEXT_PUBLIC_API_URL` phải là URL **public HTTPS** của API, **kết thúc bằng `/v1`** (ví dụ `https://api.example.com/v1`).

## 2. Deploy API (NestJS)

### Build & start (máy chủ hoặc PaaS)

Từ thư mục **`apps/api`** (hoặc cấu hình working directory tương đương):

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build
npm run start
```

- Lệnh listen mặc định: cổng **`PORT`** (nhiều nền tảng gán `PORT` tự động).
- Đảm bảo **`DATABASE_URL`** trỏ đúng DB production.

### Gợi ý nền tảng

| Nền tảng | Ghi chú |
|----------|---------|
| **Railway / Render / Fly.io** | Chọn Node, root `apps/api`, start `npm run start`, build kèm `prisma migrate deploy` như trên. |
| **VPS (Ubuntu)** | PM2/systemd chạy `node dist/main.js`, Nginx reverse proxy HTTPS → `localhost:PORT`. |

### CORS & Socket.IO

- Đặt **`WEB_URL`** = URL gốc của frontend (ví dụ `https://app.example.com`) để CORS và handshake Socket.IO đúng.
- Client chat kết nối WebSocket tới **cùng host với API** (không có `/v1` trên socket); firewall/proxy phải **bật WebSocket**.

## 3. Deploy Web (Next.js)

### Vercel (phổ biến)

1. Import repo GitHub.
2. **Root Directory:** `apps/web`.
3. **Environment Variables:** `NEXT_PUBLIC_API_URL=https://<api-domain>/v1` (và các biến khác trong `apps/web/.env.example` nếu cần).
4. Build mặc định: `next build` — deploy xong mở URL Vercel.

### Build local kiểm tra

```bash
npm run build -w apps/web
npm run start -w apps/web
```

## 4. Thứ tự khuyến nghị

1. Tạo DB → chạy **`prisma migrate deploy`** trên API (hoặc CI) một lần.
2. Deploy **API** → lấy URL public (HTTPS).
3. Cập nhật **`NEXT_PUBLIC_API_URL`** và deploy **Web**.
4. Kiểm tra: đăng nhập, tải feed, thử chat (WebSocket).

## 5. Lưu ý bảo mật

- Không commit file `.env`; dùng biến môi trường trên hosting.
- JWT secret production phải **dài, ngẫu nhiên**, khác môi trường dev.
- Bật HTTPS cho cả web và API.

## 6. CI (tùy chọn)

Có thể thêm bước trong GitHub Actions: `npm ci`, `npx prisma migrate deploy` (cần `DATABASE_URL` secret), `npm run build` cho từng app — tuỳ team; deploy thực tế vẫn thường do Vercel/Railway kích hoạt từ push.
