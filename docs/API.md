# REST API & Socket.IO — Ksocial

All paths below are under **`/v1`** (example: `http://localhost:4000/v1/health`).

**Auth header (when required):** `Authorization: Bearer <access_token>`.

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness check |

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register |
| POST | `/auth/login` | No | Login, returns JWT |
| POST | `/auth/socket-token` | Yes | Short-lived socket token |
| GET | `/auth/google` | No | Start Google OAuth |
| GET | `/auth/google/callback` | No | OAuth callback |

---

## Users & relationships

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Yes | Current user |
| PATCH | `/me` | Yes | Update profile |
| POST | `/me/presence` | Yes | Presence heartbeat (`last_seen_at`) |
| GET | `/me/mutual-friends/status` | Yes | Mutual friends + online/lastSeen |
| GET | `/me/mutual-friends?q=` | Yes | Mutual friends list |
| GET | `/users/discover?q=&limit=` | No | Discover users |
| GET | `/users/:id` | No | Public profile |
| GET | `/users/:id/relationship` | Yes | Follow relationship flags |
| POST | `/users/:id/follow` | Yes | Follow |
| DELETE | `/users/:id/follow` | Yes | Unfollow |
| GET | `/search-users?q=&limit=` | No | User search |

---

## Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/posts?categoryIds=&days=` | No | List posts |
| GET | `/posts/by-author/:authorId` | No | Posts by author |
| GET | `/posts/:slug` | No | Post by slug |
| POST | `/posts` | Yes | Create post |
| PATCH | `/posts/:id` | Yes | Update (author or admin) |
| DELETE | `/posts/:id` | Yes | Delete post |
| GET | `/posts/id/:postId/liked` | Yes | Liked state |
| POST | `/posts/id/:postId/like` | Yes | Toggle like |
| GET | `/posts/id/:postId/comments` | No | List comments |
| POST | `/posts/id/:postId/comments` | Yes | Add comment |
| DELETE | `/posts/id/:postId/comments/:commentId` | Yes | Delete comment |

---

## Categories (public read-only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories/trending?days=&limit=` | No | Top categories by recent posts |
| GET | `/categories` | No | List categories |

Mutations are **not** on this controller. Use **Admin** routes below.

---

## Admin (`/admin/*`) — JWT + RolesGuard (`ADMIN`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/dashboard` | ADMIN | Counts (users, posts, categories, pending reports) |
| GET | `/admin/categories` | ADMIN | List categories |
| POST | `/admin/categories` | ADMIN | Create |
| PATCH | `/admin/categories/:id` | ADMIN | Update |
| DELETE | `/admin/categories/:id` | ADMIN | Delete |

Promote ADMIN (ops only, from `apps/api`):

```bash
node scripts/promote-admin.mjs <email> [password]
```

---

## Upload

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | Yes | Upload file, returns URL |

---

## In-app notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/app-notifications?cursor=&take=` | Yes | List |
| GET | `/app-notifications/unread-count` | Yes | Unread count |
| POST | `/app-notifications/mark-all-read` | Yes | Mark all read |

---

## Chat

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/conversations` | Yes | Conversations + `unreadCount` |
| POST | `/conversations` | Yes | Open/create DM `{ userId }` |
| POST | `/conversations/groups` | Yes | Create group |
| DELETE | `/conversations/:id` | Yes | Hide conversation (per user) |
| GET | `/conversations/:id/messages` | Yes | Messages |
| POST | `/conversations/:id/read` | Yes | Mark read `{ lastReadMessageId? }` |
| POST | `/messages` | Yes | Send message |
| POST | `/messages/:messageId/recall` | Yes | Recall message (time window) |

---

## AI (optional)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/chat` | JWT | AI chat (throttled; needs `GEMINI_API_KEY`) |
| POST | `/ai/translate` | JWT | Translate |
| POST | `/ai/suggest-post` | JWT | Suggest post fields |

---

## Socket.IO — Chat

- **URL:** same host as the API (no `/v1` on the socket path).
- **Auth:** JWT in handshake (`auth: { token }`).
- **Client → server:** `conversations:join`, `presence:ping`.
- **Server → client:** `message:created`, `message:revoked` (and related events).

---

For exact request/response bodies, see DTOs and services under `apps/api/src`.
