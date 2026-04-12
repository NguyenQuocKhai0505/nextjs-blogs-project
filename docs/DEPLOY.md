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

---

## 7. Kịch bản cụ thể: **Frontend Vercel + Backend Render**

### 7.1 Tạo PostgreSQL

1. Vào [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**.
2. Chọn region, tạo instance → copy **Internal Database URL** hoặc **External Database URL** (URL dạng `postgresql://...`).
3. Gán vào biến **`DATABASE_URL`** của Web Service API (bước sau). Nếu API và DB cùng Render, internal URL thường ổn định và nhanh hơn.

### 7.2 Deploy API (NestJS) trên Render — **Web Service**

1. **New** → **Web Service** → kết nối repo GitHub `nextjs-blogs-project`.
2. Cấu hình:
   - **Name:** ví dụ `ksocial-api`
   - **Region:** gần bạn nhất
   - **Branch:** `master` (hoặc `main`)
   - **Root Directory:** `apps/api`  
     *(Render chỉ build đúng package Nest trong monorepo.)*
   - **Runtime:** `Node`
   - **Build Command:**

     ```bash
     npm ci && npx prisma migrate deploy && npx prisma generate && npm run build
     ```

   - **Start Command:**

     ```bash
     npm run start
     ```

     Render tự inject **`PORT`** — `main.ts` đã dùng `process.env.PORT`, không cần set tay.

3. **Environment** (Environment Variables), tối thiểu:

   | Biến | Ý nghĩa |
   |------|--------|
   | `DATABASE_URL` | Chuỗi Postgres (từ bước 7.1) |
   | `JWT_ACCESS_SECRET` | Chuỗi bí mật dài, ngẫu nhiên (production) |
   | `JWT_SOCKET_SECRET` | Khác access secret; dùng cho token socket nếu có |
   | `WEB_URL` | URL **frontend Vercel** (không có slash cuối), ví dụ `https://ksocial.vercel.app` — **CORS + Socket.IO** |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Bắt buộc nếu dùng upload ảnh/video qua API |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Chỉ khi bật Google OAuth; `GOOGLE_CALLBACK_URL` = `https://<api-host>/v1/auth/google/callback` |
   | `WEB_AUTH_CALLBACK_URL` | Thường `https://<domain-vercel>/auth/callback` (frontend sau OAuth) |

4. **Create Web Service** → đợi build xong. URL API dạng: `https://ksocial-api.onrender.com`.

5. **Quan trọng:** mọi REST client dùng prefix **`/v1`**. URL đầy đủ ví dụ:  
   `https://ksocial-api.onrender.com/v1/health`

**Lưu ý Render free:** service có thể **sleep** khi không có traffic vài phút; lần đầu gọi API sẽ chậm (cold start). Gói trả phí giữ máy luôn chạy.

**WebSocket:** Render Web Service (Node) hỗ trợ WebSocket; chat dùng cùng host API (không path `/v1` trên socket). Nếu sau này đặt reverse proxy, bật upgrade WebSocket.

### 7.3 Deploy Web (Next.js) trên **Vercel**

1. [Vercel](https://vercel.com) → **Add New Project** → import cùng repo GitHub.
2. **Root Directory:** `apps/web`
3. **Framework Preset:** Next.js (mặc định).
4. **Environment Variables:**

   | Biến | Giá trị |
   |------|--------|
   | `NEXT_PUBLIC_API_URL` | `https://<tên-service-render>.onrender.com/v1` — **bắt buộc có `/v1` ở cuối** |

5. **Deploy**. Lấy URL production Vercel (ví dụ `https://ksocial.vercel.app`).

### 7.4 Nối vòng CORS / OAuth

1. Vào lại **Render** → service API → chỉnh **`WEB_URL`** = đúng URL Vercel production (sau khi deploy xong bước 7.3).
2. Nếu dùng Google OAuth: callback và `WEB_AUTH_CALLBACK_URL` phải khớp domain Vercel + route API.

### 7.5 Kiểm tra nhanh

1. Mở `https://<api>.onrender.com/v1/health` → kỳ vọng 200.
2. Mở site Vercel → đăng ký/đăng nhập → feed.
3. Mở **Messages** → thử chat (kiểm tra socket nếu có lỗi, xem tab Network → WS).

### 7.6 Thứ tự làm lần đầu (tóm tắt)

1. Postgres trên Render → có `DATABASE_URL`.  
2. Web Service API (`apps/api`) + env → deploy → copy URL `https://xxx.onrender.com`.  
3. Vercel `apps/web` + `NEXT_PUBLIC_API_URL=https://xxx.onrender.com/v1` → deploy.  
4. Cập nhật `WEB_URL` trên Render = URL Vercel → **Manual Deploy** hoặc push commit rỗng để redeploy nếu cần.
