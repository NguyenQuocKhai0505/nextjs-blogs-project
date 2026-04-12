# Ghi chú: Unread chat & “read cursor” (đọc tới đâu)

Tài liệu này mô tả **tư duy thiết kế**, **logic**, và **chỗ code** liên quan tính năng: mỗi hội thoại có **số tin chưa đọc** (inbound), và API **đánh dấu đã đọc** bằng một **mốc message id**.

Phạm vi: **cả `apps/api` (Nest + Prisma) và `apps/web` (Next, `contact-client`)**.

---

## 1. Vấn đề cần giải quyết (tư duy sản phẩm)

- User cần thấy **còn bao nhiêu tin nhắn từ người khác** mà mình **chưa xem** trong từng cuộc trò chuyện (1-1 và nhóm).
- **Không** dùng một cột `read: boolean` trên bảng `messages` cho toàn bộ nhóm: một tin nhắn có nhiều người nhận → mỗi người cần trạng thái **riêng**.
- Hướng đơn giản, đủ cho MVP và portfolio: **mỗi user giữ một “con trỏ đọc” (cursor)** trên mỗi conversation: *“Mình đã xem tới tin có `id` tối đa là bao nhiêu.”*

**Hệ quả:**

- **Unread (inbound)** = các tin **do người khác gửi** và có **`id` lớn hơn** con trỏ đó.
- Tin **do chính mình gửi** không làm tăng unread của mình.

Đây **không phải** “read receipt” kiểu Messenger (ai đã xem dòng này). Chỉ là **badge / đếm chưa đọc** theo góc nhìn của **một user**.

---

## 2. Dữ liệu: `ConversationReadState` (Prisma)

**File:** `apps/api/prisma/schema.prisma` — model `ConversationReadState`, bảng `conversation_read_states`.

| Cột / field | Ý nghĩa |
|-------------|--------|
| `userId` | Ai là người đọc |
| `conversationId` | Hội thoại nào |
| `lastReadMessageId` | Mốc: mọi tin có `id ≤` giá trị này được coi là đã xem (phía logic đếm) |
| `@@unique([userId, conversationId])` | Một user chỉ một dòng / một conversation |

**Quan hệ:** `User` và `Conversation` có `readStates` / `readStates` tương ứng.

**Migration:** `apps/api/prisma/migrations/*_add_conversation_read_state/`.

**Lưu ý hành vi khi chưa có dòng read-state:** Trong SQL đếm unread dùng `COALESCE(crs.last_read_message_id, 0)` → coi mốc = `0` → **mọi tin inbound cũ** đều có thể bị tính unread cho tới khi user **lần đầu** gọi API đánh dấu đọc (thường là lúc mở chat).

---

## 3. Logic server: đếm unread hàng loạt

**File:** `apps/api/src/chat/chat.service.ts` — method `bulkUnreadCounts`.

**Tư duy hiệu năng:** Sau khi đã có danh sách conversation id hợp lệ trong `listConversations`, không gọi `COUNT` trong vòng lặp N lần; dùng **một truy vấn SQL** nhóm theo `conversation_id`.

**Điều kiện đếm mỗi tin `m`:**

1. `m.conversation_id` thuộc danh sách đang xét.
2. `m.sender_id != userId` (chỉ tin **từ người khác**).
3. `m.id > COALESCE(read_state.last_read_message_id, 0)` (chưa “qua” mốc đọc).

**LEFT JOIN** `conversation_read_states` theo `(conversation_id, user_id)` để khi **chưa có bản ghi** thì phần join là `NULL` → `COALESCE` về `0`.

Kết quả: `Map<conversationId, unreadCount>` gán lại vào từng phần tử trả về của `listConversations` (field `unreadCount`).

---

## 4. Logic server: đánh dấu đã đọc

**File:** `apps/api/src/chat/chat.service.ts` — `markConversationRead`.

**File:** `apps/api/src/chat/chat.controller.ts` — `POST conversations/:id/read`.

**File:** `apps/api/src/chat/dto/mark-conversation-read.dto.ts` — body tùy chọn `lastReadMessageId`.

**Luồng:**

1. **`assertCanAccessConversation`** — giống khi xem tin: DIRECT (còn mutual) hoặc GROUP (còn trong `conversation_members`).
2. **Xác định mốc `target`:**
   - Client **gửi** `lastReadMessageId` → kiểm tra tin đó **tồn tại** và **đúng** `conversationId` (chống gian lận cross-room).
   - Client **không gửi** → lấy tin **mới nhất** trong room (`orderBy id desc`).
3. **Không cho lùi cursor:** `next = max(existing.lastReadMessageId, target)` — tránh client gửi id nhỏ làm unread “nhảy” lại.
4. **`upsert`** vào `conversation_read_states` với `lastReadMessageId: next`.

**Response:** `{ ok: true, lastReadMessageId: next }` — client có thể dùng để debug; UI hiện tại chủ yếu **optimistic** (badge về 0 sau khi gọi thành công).

---

## 5. Logic client: khi nào gọi `read`

**File:** `apps/web/src/components/contact/contact-client.tsx`.

### 5.1 Sau khi tải danh sách tin (`GET .../conversations/:id/messages`)

- Khi có ít nhất một tin: `maxId = max(messages[].id)` → `POST .../read` với `{ lastReadMessageId: maxId }`.
- **Ý nghĩa:** User đang mở cuộc trò chuyện và thấy toàn bộ batch hiện tại → coi như đã đọc tới **tin mới nhất trong list đó**.

**Hạn chế tư duy (để mở rộng sau):** Nếu sau này có **phân trang tin cũ** (infinite scroll lên trên), không nên luôn mark tới `max` toàn DB mà chỉ tới “tin thấp nhất đang hiển thị” hoặc dùng observer khi cuộn.

### 5.2 Realtime (`socket` — event `message:created`)

- Dùng **`activeIdRef` / `meRef`** để handler socket luôn đọc **tab đang mở** và **user hiện tại**, tránh **stale closure** (bug classic của React + socket).

**Cập nhật danh sách trái (`conversations`):**

- Nếu tin **từ người khác** và **không** phải conversation đang mở → `unreadCount + 1`.
- Nếu tin **từ người khác** và **đang** mở đúng conversation → `unreadCount = 0` (sắp đánh dấu đọc).

**Cập nhật vùng tin:**

- Nếu đúng conversation đang mở → append tin vào `messages`.
- Nếu tin từ người khác → gọi `markConversationRead(conversationId, msg.id)` để cursor bám **tin mới**.

**Tin do chính mình gửi:** Không tăng unread; không cần mark read cho mục đích unread (inbound count không đổi).

### 5.3 Sau `markConversationRead` thành công

- **Optimistic:** `unreadCount: 0` cho đúng `conversationId` trong state — giảm nháy UI; server vẫn là nguồn sự thật khi `reloadConversations` / F5.

---

## 6. Hiển thị UI

- List hội thoại bên trái: badge số nếu `unreadCount > 0`, cap hiển thị `99+`.
- Type `ConversationItem` có thêm `unreadCount?: number` (API luôn gửi số sau khi triển khai).

---

## 7. Tóm tắt “tư duy” một dòng

**Lưu một số nguyên “đã đọc tới message id nào” cho mỗi (user, conversation); unread = tin người khác có id lớn hơn số đó — đơn giản, đúng cho 1-1 và nhóm, không làm read receipt từng người trên từng tin.**

---

## 8. File tham chiếu nhanh

| Nội dung | Vị trí |
|----------|--------|
| Schema + bảng | `apps/api/prisma/schema.prisma` (`ConversationReadState`) |
| List conv + unread + mark read + SQL | `apps/api/src/chat/chat.service.ts` |
| HTTP routes | `apps/api/src/chat/chat.controller.ts` |
| DTO mark read | `apps/api/src/chat/dto/mark-conversation-read.dto.ts` |
| UI + socket + badge | `apps/web/src/components/contact/contact-client.tsx` |

---

*Nếu bạn chỉnh UX (chỉ báo unread khi tab ẩn, hoặc tổng badge trên icon Messages ở header), giữ nguyên phần API read cursor ở trên và chỉ thêm lớp điều kiện phía client.*
