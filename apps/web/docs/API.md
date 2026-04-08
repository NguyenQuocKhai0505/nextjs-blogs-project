# API & Server Actions

Tài liệu này mô tả **Route Handlers** (`src/app/api/`*), **Server Actions** (`src/actions/`*), và **realtime events** liên quan.

## Auth

### `GET|POST /api/auth/[...all]`

- File: `src/app/api/auth/[...all]/route.ts`
- Handler: Better Auth `toNextJsHandler(auth.handler)`
- Runtime: `nodejs`

## Current user

### `GET /api/me`

- File: `src/app/api/me/route.ts`
- Auth: required
- Response:
  - `200`: `{ success: true, user }`
  - `401`: `{ success: false, message: "Unauthorized" }`

## Upload (Cloudinary)

### `POST /api/upload`

- File: `src/app/api/upload/route.ts`
- Accepts:
  - `multipart/form-data` with `files` (multiple)
  - `application/json` with `{ mediaUrl, mediaType }`
- Returns:
  - `{ success: true, imageUrls: string[], videoUrls: string[] }`
- Limits:
  - image: 10MB/file
  - video: 50MB/file

## Search users

### `GET /api/search-users?q=<query>&limit=<n>`

- File: `src/app/api/search-users/route.ts`
- Response:
  - `{ success: true, users }`

## Notifications

### `GET /api/notifications`

- File: `src/app/api/notifications/route.ts`
- Auth: optional (if not logged in returns empty list)
- Response:
  - `{ notifications: SerializedNotification[] }`

### `PATCH /api/notifications`

- Marks notifications as read.
- Body:
  - `{ ids: number[] }` (optional)
  - if omitted, marks up to 100 unread notifications as read
- Response:
  - `{ success: true }`

## Conversations (DM)

### `GET /api/conversations`

- File: `src/app/api/conversations/route.ts`
- Auth: required
- Merges:
  - existing conversations (`getConversations`)
  - following users (`getFollowingUsers`) as potential contacts
- Response:
  - `{ conversations: ContactEntry[] }`

### `POST /api/conversations`

- Body: `{ targetUserId: string }`
- Creates or returns 1-1 conversation.
- Response:
  - `{ conversation: ContactEntry }`

### `DELETE /api/conversations?conversationId=<id>`

- Deletes conversation (and its messages).
- Response:
  - `{ success: true }`

## Messages (DM)

### `GET /api/messages?conversationId=<id>&limit=<n>`

- File: `src/app/api/messages/route.ts`
- Auth: required
- Response:
  - `{ messages }`

### `POST /api/messages`

- Body: `{ conversationId, content?, imageUrl?, videoUrl? }`
- Auth: required
- Response:
  - `{ message }`

### `DELETE /api/messages?messageId=<id>`

- Auth: required
- Response:
  - `{ success: true, conversationId }`

## Socket.IO

### `/api/socket`

- File: `src/app/api/socket/route.ts`
- Note: Route handler chỉ trả JSON. Socket.IO server thực tế được init ở `src/lib/realtime/socket-server.ts`.

### Socket rooms

- `user:<userId>`: notification events
- `conversation:<conversationId>`: message events
- `post:<postId>`: post like/comment events

### Socket events (server -> client)

- `notification` (to `user:<userId>`)
- `new_message` (to `conversation:<id>`)
- `message_deleted` (to `conversation:<id>`)
- `message_read` (to `conversation:<id>`)
- `post_like_updated` (to `post:<postId>`)
- `post_comment_created` (to `post:<postId>`)

### Socket events (client -> server)

- `join_conversation(conversationId)`
- `send_message({ conversationId, content?, imageUrl?, videoUrl? })`
- `delete_message({ messageId })`
- `mark_read(conversationId)`
- `join_post(postId)`
- `leave_post(postId)`

## Server Actions (mutations)

Server Actions nằm ở `src/actions/`* và thường:

- lấy session bằng `auth.api.getSession({ headers: await headers() })`
- thao tác DB qua `src/lib/db/*`
- `revalidatePath()` để refresh UI

### Posts

- `CreatePost(formData)` in `src/actions/post-action.ts`
- `UpdatePost(formData)` in `src/actions/post-action.ts`
- `DeletePost(postId)` in `src/actions/post-action.ts`

### Likes

- `toggleLikeAction(postId)` in `src/actions/like-actions.ts`
- `checkUserLiked(postId)` in `src/actions/like-actions.ts`
- `getPostLikeAction(postId)` in `src/actions/like-actions.ts`

### Comments

- `createCommentAction(postId, content, parentId?)` in `src/actions/comment-action.ts`
- `deleteCommentAction(commentId)` in `src/actions/comment-action.ts`
- `getPostCommentsAction(postId)` in `src/actions/comment-action.ts`

### Follows

- `toggleFollowAction(targetUserId)` in `src/actions/follow-actions.ts`
- `checkFollowingAction(targetUserId)` in `src/actions/follow-actions.ts`
- `getFollowersStatsAction(userId)` in `src/actions/follow-actions.ts`
- `getFollowersListAction(userId)` in `src/actions/follow-actions.ts`
- `getFollowingListAction(userId)` in `src/actions/follow-actions.ts`

### Profile

- `updateProfileAction({ name?, avatar?, avatarFile? })` in `src/actions/profile-action.ts`

### Search

- `searchUsersAction(query, limit?)` in `src/actions/search-action.ts`

