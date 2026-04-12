# API REST & Socket.IO — Ksocial

Tất cả đường dẫn dưới đây có tiền tố **`/v1`** (ví dụ đầy đủ: `http://localhost:4000/v1/health`).

**Header xác thực (khi bắt buộc):** `Authorization: Bearer <access_token>`.

---

## Health

| Phương thức | Đường dẫn | Auth | Mô tả |
|-------------|-----------|------|--------|
| GET | `/health` | Không | Kiểm tra API sống |

---

## Auth (`/v1` — controller auth)

| Phương thức | Đường dẫn | Auth | Mô tả |
|-------------|-----------|------|--------|
| POST | `/register` | Không | Đăng ký |
| POST | `/login` | Không | Đăng nhập, nhận JWT |
| POST | `/socket-token` | Có | Token phụ cho socket (nếu dùng) |
| GET | `/google` | Không | Bắt đầu OAuth Google |
| GET | `/google/callback` | Không | Callback OAuth |

---

## Người dùng & quan hệ (controller gốc `""`)

| Phương thức | Đường dẫn | Auth | Mô tả |
|-------------|-----------|------|--------|
| GET | `/me` | Có | Thông tin user hiện tại |
| PATCH | `/me` | Có | Cập nhật profile |
| POST | `/me/presence` | Có | Heartbeat presence (`last_seen_at`) |
| GET | `/me/mutual-friends/status` | Có | Bạn chung follow + online/lastSeen |
| GET | `/me/mutual-friends?q=` | Có | Danh sách mutual (lọc tên/email) |
| GET | `/users/discover?q=&limit=` | Không | Khám phá user (public directory) |
| GET | `/users/:id` | Không | Hồ sơ public |
| GET | `/users/:id/relationship` | Có | youFollow / followsYou / mutual |
| POST | `/users/:id/follow` | Có | Follow |
| DELETE | `/users/:id/follow` | Có | Unfollow |
| GET | `/search-users?q=&limit=` | Không | Tìm user (header search) |

---

## Bài viết (`/posts`)

| Phương thức | Đường dẫn | Auth | Mô tả |
|-------------|-----------|------|--------|
| GET | `/posts?categoryIds=&days=` | Không | Danh sách bài (lọc category, số ngày) |
| GET | `/posts/by-author/:authorId` | Không | Bài theo tác giả |
| GET | `/posts/:slug` | Không | Chi tiết theo slug |
| POST | `/posts` | Có | Tạo bài |
| PATCH | `/posts/:id` | Có | Sửa bài (chủ hoặc admin) |
| DELETE | `/posts/:id` | Có | Xóa bài |
| GET | `/posts/id/:postId/liked` | Có | Trạng thái like |
| POST | `/posts/id/:postId/like` | Có | Toggle like |
| GET | `/posts/id/:postId/comments` | Không | Danh sách comment |
| POST | `/posts/id/:postId/comments` | Có | Thêm comment |
| DELETE | `/posts/id/:postId/comments/:commentId` | Có | Xóa comment |

---

## Danh mục (`/categories`)

| Phương thức | Đường dẫn | Auth | Mô tả |
|-------------|-----------|------|--------|
| GET | `/categories/trending?days=&limit=` | Không | Category nhiều bài nhất |
| GET | `/categories` | Không | Liệt kê category |
| POST | `/categories` | Có (admin) | Tạo |
| PATCH | `/categories/:id` | Có (admin) | Sửa |
| DELETE | `/categories/:id` | Có (admin) | Xóa |

---

## Upload (`/upload`)

| Phương thức | Đường dẫn | Auth | Mô tả |
|-------------|-----------|------|--------|
| POST | `/upload` | Có | Upload file, trả URL |

---

## Thông báo in-app (`/app-notifications`)

| Phương thức | Đường dẫn | Auth | Mô tả |
|-------------|-----------|------|--------|
| GET | `/app-notifications?cursor=&take=` | Có | Danh sách |
| GET | `/app-notifications/unread-count` | Có | Số chưa đọc |
| POST | `/app-notifications/mark-all-read` | Có | Đánh dấu đã đọc hết |

---

## Chat (`/` — `ChatController`)

| Phương thức | Đường dẫn | Auth | Mô tả |
|-------------|-----------|------|--------|
| GET | `/conversations` | Có | Danh sách hội thoại + `unreadCount` |
| POST | `/conversations` | Có | Mở/tạo 1-1 `{ userId }` |
| POST | `/conversations/groups` | Có | Tạo nhóm |
| DELETE | `/conversations/:id` | Có | Ẩn hội thoại (theo user) |
| GET | `/conversations/:id/messages` | Có | Tin nhắn |
| POST | `/conversations/:id/read` | Có | Đánh dấu đọc `{ lastReadMessageId? }` |
| POST | `/messages` | Có | Gửi tin `{ conversationId, content?, imageUrl?, videoUrl? }` |
| POST | `/messages/:messageId/recall` | Có | Thu hồi tin (trong cửa sổ thời gian) |

---

## AI (tùy chọn)

| Phương thức | Đường dẫn | Auth | Mô tả |
|-------------|-----------|------|--------|
| POST | `/ai/chat` | Theo cấu hình module | Chat AI |

---

## Socket.IO — Chat

- **URL:** cùng host với API, không có suffix `/v1` trên socket (client dùng base URL đã chuẩn hóa trong `apiSocketUrl()`).
- **Auth:** JWT trong handshake (`auth: { token }`).
- **Client → server:** `conversations:join` `{ conversationIds }`, `presence:ping`.
- **Server → client:** `message:created`, `message:revoked` (và các sự kiện khác nếu mở rộng).

---

*Để biết chi tiết body/response chính xác, tra DTO và service tương ứng trong `apps/api/src`.*
