# Roadmap: nâng cấp thành Social Web App “thực thụ” (Facebook/Instagram-style)

Tài liệu này là backlog/roadmap theo giai đoạn để nâng dự án hiện tại lên thành social web app hoàn chỉnh, có thể scale và vận hành như sản phẩm thật.

## Hiện trạng (đã có trong codebase)

- **Auth + session**: Better Auth + Postgres/Drizzle
- **Posts**: text + media (Cloudinary), edit/delete
- **Social graph**: follow/unfollow
- **Engagement**: like, comment (threaded via `parentId`)
- **Notifications**: inbox + realtime
- **DM**: conversations/messages + realtime Socket.IO

## Giai đoạn 1 — “MVP Social” (chuẩn hoá trải nghiệm, dữ liệu, bảo mật)

### Feed & discovery

- **Home feed theo following**: thay “all posts” bằng feed dựa trên `follows`
- **Profile feed**: phân trang, tải nhanh, skeleton
- **Explore**: trending/recent, search users/posts
- **Pagination**: cursor-based pagination (createdAt/id)

### Post model & media

- **Tách media thành bảng riêng** (đề xuất)
  - `post_media(id, postId, type, url, width, height, duration, order, createdAt)`
  - tránh lưu JSON string trong `posts.imageUrls/videoUrls`
- **Thumbnails** cho video, metadata cơ bản

### Comment system

- **Delete comment realtime**: cần trả được `postId` khi delete để emit đúng room
- **Anti-spam**: rate-limit comment/like/follow
- **Mentions** (`@user`) và link preview (tuỳ chọn)

### Auth & security hardening

- **Không dùng secret default**: bắt buộc `BETTER_AUTH_SECRET` mạnh khi production
- **Logging**: giảm log nhạy cảm trong `src/lib/auth.ts` (không log config quá nhiều)
- **Input validation**: Zod cho body của APIs + Server Actions
- **RBAC cơ bản**: kiểm tra ownership ở mọi mutation

### UX tối thiểu

- **Notifications UI**: badge unread, mark-as-read
- **Chat UX**: unread counts thật (hiện đang `0` trong `getConversations`)

## Giai đoạn 2 — “Instagram-like” (stories/reels, tương tác sâu, privacy)

### Stories / Reels

- **Stories**: media-only, TTL 24h, viewers list
- **Reels**: video-first, infinite scroll, preload, mute/autoplay controls
- **Music/audio** (tuỳ chọn)

### Social interactions nâng cao

- **Save/Bookmark** posts
- **Share** (copy link, share to DM)
- **Hashtags** + hashtag pages

### Privacy / safety

- **Private account**
- **Block users**
- **Restrict users** (giảm khả năng tương tác)
- **Close friends** (cho stories)

## Giai đoạn 3 — “Facebook-like” (groups, pages, events, marketplace) [tuỳ mục tiêu]

Tuỳ định hướng sản phẩm, có thể mở rộng:

- Groups + group posts/moderation
- Pages
- Events
- Marketplace

## Giai đoạn 4 — “Production scale” (performance, reliability, ops)

### Performance

- **DB indexes**: theo truy vấn feed, notifications, messages
- **Caching**: cache notifications/unread counts, feed pages
- **Image/video optimization**: responsive images, lazy loading, CDN

### Realtime scaling

- **Socket.IO adapter (Redis)** để chạy multi-instance
- **Presence** (online/offline/typing)
- **Delivery guarantees** (ack/retry) cho messages quan trọng

### Moderation & abuse

- Report content/users
- Admin tools
- Spam detection, rate limiting, shadow-bans

### Observability

- Structured logs, error tracking (Sentry)
- Metrics (requests, DB latency, socket connections)

## “Definition of Done” cho một social app giống FB/IG

- Feed có ranking + pagination ổn định
- Media pipeline đầy đủ (upload, transform, preview)
- Privacy: private/block + kiểm soát hiển thị
- Notifications realtime + inbox
- DM: unread, read receipts, attachments, basic anti-abuse
- Moderation tối thiểu + rate limiting
- Deploy multi-instance + socket scaling + monitoring

