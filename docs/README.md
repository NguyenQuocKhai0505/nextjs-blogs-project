# Tài liệu dự án Ksocial

Tài liệu phục vụ báo cáo / đồ án: mô tả **đúng** với mã nguồn hiện tại (NestJS + Prisma + Next.js), không gồm backlog hay ghi chép quy trình làm việc nội bộ.

## Danh mục

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Tổng quan kiến trúc, phân tách frontend/backend, mô hình dữ liệu chính, realtime, một số luồng nghiệp vụ (chat, unread, presence).
2. **[API.md](./API.md)** — Liệt kê endpoint REST dưới prefix `/v1`, xác thực JWT, và sự kiện Socket.IO liên quan chat.
3. **[DEPLOY.md](./DEPLOY.md)** — Hướng dẫn deploy API + Web + PostgreSQL (thứ tự, biến môi trường, Vercel/Railway).

Cập nhật tài liệu khi thêm module API mới hoặc thay đổi hợp đồng response quan trọng.
