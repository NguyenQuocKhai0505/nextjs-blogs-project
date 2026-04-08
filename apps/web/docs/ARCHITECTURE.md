# Architecture

## Overview

This project is a **Next.js 15 App Router** social web app with:

- **Auth**: Better Auth (email/password) + Drizzle adapter
- **Database**: Postgres via Drizzle ORM
- **Media**: Cloudinary uploads (image + video)
- **Realtime**: Socket.IO (messages, notifications, post rooms)

The codebase uses two main backend styles:

- **Server Actions** in `src/actions/*` for UI-driven mutations (create post, toggle like, follow, comment…)
- **Route Handlers** in `src/app/api/*` for JSON APIs (chat, notifications, uploads, auth handler…)

## Key folders

- `src/app/*`: Next.js pages/routes (App Router)
- `src/actions/*`: Next Server Actions used by UI components/pages
- `src/lib/auth.ts`: Better Auth config
- `src/lib/db/*`: Drizzle db client + schema + queries
- `src/lib/realtime/*`: Socket.IO server + emitters

## Data model (Drizzle schema)

Defined in `src/lib/db/schema.ts`.

### Tables

- `user`: basic profile (`id`, `name`, `email`, `avatar_url`, `email_verified`, timestamps)
- `session`, `account`: Better Auth tables
- `posts`: post content + counts + media URLs
  - `image_urls` and `video_urls` are stored as **text** (typically JSON string arrays)
  - `like_count`, `comment_count` are stored as counters
- `post_likes`: many-to-many user likes with unique constraint `(post_id, user_id)`
- `comments`: threaded comments via `parent_id`
- `follows`: follower/following with unique constraint `(follower_id, following_id)`
- `conversations`: 1-1 chat between two users (unique by user pair)
- `messages`: chat messages (text + optional image/video, `read` flag)
- `notifications`: notification inbox (type + meta jsonb, `read` flag)

## Auth

Configured in `src/lib/auth.ts` using:

- `better-auth`
- `better-auth/adapters/drizzle`

Session is typically obtained via:

- Server Actions: `auth.api.getSession({ headers: await headers() })`
- Route Handlers: `auth.api.getSession({ headers: req.headers })`

## Core domain flows

### Posts

- Create/update/delete: `src/actions/post-action.ts`
- DB queries: `src/lib/db/queries.ts`

Revalidation uses `revalidatePath("/")`, `/profile`, and `/post/<slug>` patterns.

### Likes

- Action: `src/actions/like-actions.ts`
- DB: `togglePostLike`, `checkUserLikedPost`, `getPostLikes` in `src/lib/db/queries.ts`
- Realtime: emits `post_like_updated` to `post:<postId>` room

### Comments

- Action: `src/actions/comment-action.ts`
- DB: `createComment`, `deleteComment`, `getPostComments` in `src/lib/db/queries.ts`
- Realtime: emits `post_comment_created` to `post:<postId>` room

Note: delete-comment realtime emission is currently not implemented end-to-end because the action does not have `postId` after deletion (see `src/actions/comment-action.ts`).

### Follows

- Action: `src/actions/follow-actions.ts`
- DB: `toggleFollow`, `checkUserFollowing`, follower/following list + counts in `src/lib/db/queries.ts`
- Notifications: creates a `follow` notification on follow

### Notifications

- DB: `src/lib/db/notification-queries.ts`
- Realtime: `src/lib/realtime/notification-emitter.ts` emits to `user:<userId>`
- API:
  - `GET /api/notifications`: list
  - `PATCH /api/notifications`: mark read (by ids or mark all unread)

### Chat (DM)

- DB queries: `src/lib/db/chat-queries.ts`
- APIs:
  - `GET/POST/DELETE /api/conversations`
  - `GET/POST/DELETE /api/messages`
- Realtime Socket.IO:
  - rooms: `conversation:<id>`
  - events: `join_conversation`, `send_message`, `new_message`, `mark_read`, `message_read`, `delete_message`, `message_deleted`

## Realtime server

Socket.IO server is implemented in `src/lib/realtime/socket-server.ts`.

Auth for sockets is performed by calling `auth.api.getSession()` using converted handshake headers.

### Rooms

- `user:<userId>`: notifications
- `conversation:<conversationId>`: messages
- `post:<postId>`: post like/comment realtime

## Suggested next architecture upgrades (high-level)

- Add a **Feed** abstraction (home feed, profile feed, explore), not just "all posts".
- Add **privacy** concepts (private account, blocks, restrict/close friends).
- Add **media models** (separate `media` table) instead of JSON text fields.
- Add **moderation** primitives (report, hide, rate limit, anti-spam).

