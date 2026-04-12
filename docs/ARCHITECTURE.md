# Kiến trúc hệ thống — Ksocial

## 1. Tổng quan

Hệ thống gồm hai ứng dụng độc lập trong một monorepo:

- **`apps/web`**: ứng dụng Next.js (App Router). Giao diện người dùng, gọi HTTP tới API Nest qua `NEXT_PUBLIC_API_URL`, lưu JWT ở client (cookie + `localStorage`) để `Authorization: Bearer`.
- **`apps/api`**: ứng dụng NestJS, prefix toàn cục **`/v1`**. Xử lý nghiệp vụ, Prisma truy cập PostgreSQL, Socket.IO cho chat realtime.

Luồng điển hình: trình duyệt → Next.js → REST `/v1/*` → Nest + Prisma → PostgreSQL; chat mở thêm kết nối WebSocket tới cùng host API (Socket.IO).

## 2. Backend (NestJS)

### 2.1 Module chính

| Khu vực | Trách nhiệm |
|---------|-------------|
| `auth` | Đăng ký, đăng nhập, JWT access token; tùy chọn OAuth Google |
| `users` | Hồ sơ công khai, follow/unfollow, quan hệ, discover, tìm kiếm user, mutual friends, **presence** (`last_seen_at`, ping) |
| `posts` | CRUD bài viết, like, comment (thread `parentId`), lọc theo category / khoảng thời gian |
| `categories` | Danh mục bài viết; admin CRUD; **trending** theo số bài trong N ngày |
| `upload` | Upload media (multipart), trả URL cho frontend gắn vào bài/chat |
| `chat` | Hội thoại 1-1 và nhóm (mutual friends), tin nhắn, đọc/tin chưa đọc, ẩn hội thoại, thu hồi tin; **ChatGateway** (Socket.IO) |
| `notifications` | `app-notifications` tổng hợp, unread count, đánh dấu đã đọc |
| `ai` | (Tùy chọn) endpoint chat AI |

### 2.2 Xác thực

- JWT access: header `Authorization: Bearer <token>`.
- Một số route public: ví dụ `GET /posts`, `GET /users/discover`, `GET /search-users`, `GET /categories/trending`.

### 2.3 Cơ sở dữ liệu (Prisma)

Schema tại `apps/api/prisma/schema.prisma`. Các khối chính:

- **User**: profile, `role` (USER/ADMIN), **`last_seen_at`** (presence).
- **Follow**: quan hệ follower/following; **mutual** = hai chiều follow (dùng cho chat 1-1).
- **Post**, **PostLike**, **Comment**, **Category**.
- **Conversation** (`DIRECT` | `GROUP`), **ConversationMember**, **Message** (có thể **revoked**), **ConversationReadState** (cursor đọc), **ConversationHide** (ẩn hội thoại theo user).
- **AppNotification**, **AppNotificationCounter** (in-app notifications).

### 2.4 Realtime — Chat (Socket.IO)

- Gateway: `apps/api/src/chat/chat.gateway.ts`.
- Client xác thực bằng JWT (handshake `auth.token`).
- Room: `conv:<conversationId>`; sự kiện ví dụ: `message:created`, `message:revoked`.
- Client emit: `conversations:join`, `presence:ping` (cập nhật `last_seen_at`).

### 2.5 Chat: tin chưa đọc (read cursor)

Mỗi cặp **(user, conversation)** có tối đa một bản ghi **`ConversationReadState`** với `last_read_message_id`.

- **Unread (inbound)** = số tin do **người khác** gửi có `id` **lớn hơn** mốc đọc (nếu chưa có bản ghi read state, mốc coi như `0`).
- **Đánh dấu đọc:** `POST /v1/conversations/:id/read` với body tùy chọn `lastReadMessageId`; server không cho “lùi” mốc so với giá trị đã lưu.
- UI: `apps/web/src/components/contact/contact-client.tsx` (tải tin, socket, badge).

### 2.6 Presence (online / “hoạt động X phút trước”)

- Cập nhật **`user.last_seen_at`** qua: `POST /v1/me/presence` (heartbeat định kỳ từ web), kết nối/ngắt socket chat, và `presence:ping`.
- **Online** (gợi ý UI): coi là online nếu `last_seen_at` trong khoảng **3 phút** gần nhất (hằng số server; có thể đổi trong code).

## 3. Frontend (Next.js)

### 3.1 Cấu trúc gợi ý

- `src/app/(app)/`: layout đã đăng nhập (shell, sidebar, rail).
- `src/components/`: feed, post, contact/chat, layout, notifications, search, v.v.
- `src/lib/api.ts`: `apiUrl()` — ghép base URL API đã gồm `/v1`.
- `src/lib/auth-fetch.ts`: gắn Bearer token cho request cần đăng nhập.
- `src/messages/*.json`: i18n (en, vi, ko).

### 3.2 Tìm kiếm header

Gọi trực tiếp **`GET /v1/search-users`** (không qua Route Handler Next). Điều hướng “xem thêm” và Enter: **`/discover?q=...`**.

## 4. Triển khai và vận hành

- API và Web có thể build độc lập (`apps/api`, `apps/web`).
- PostgreSQL bắt buộc; chạy migration trước khi start API production.
- CORS API cần khớp origin web (`WEB_URL` / cấu hình Nest).

---

*Tài liệu này phản ánh codebase tại thời điểm biên soạn; khi refactor lớn nên cập nhật song song.*
