

import { relations } from "drizzle-orm"
import {pgTable, varchar, boolean, timestamp, text, serial, integer, uniqueIndex,jsonb} from "drizzle-orm/pg-core"

export const users = pgTable("user",{
    id: varchar("id",{length:255}).primaryKey(),
    name: varchar("name",{length:255}).notNull(),
    email: varchar("email",{length:255}).notNull().unique(),
    avatar: text("avatar_url"),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const sessions = pgTable("session",{
    id: varchar("id",{length:255}).primaryKey(),
    userId:varchar("user_id",{length:255}).references(()=>users.id).notNull(),
    token: varchar("token",{length:255}).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: varchar("ip_address",{length:255}).notNull(),
    userAgent: varchar("user_agent",{length:255}).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const accounts = pgTable("account",{
    id: varchar("id",{length:255}).primaryKey(),
    userId:varchar("user_id",{length:255}).references(()=>users.id).notNull(),
    accountId: varchar("account_id",{length:255}).notNull(),
    providerId: varchar("provider_id",{length:255}).notNull(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const posts = pgTable("posts",{
    id: serial("id").primaryKey(),
    title: varchar("title",{length:255}).notNull(),
    description: varchar("description",{length:255}).notNull(),
    slug: varchar("slug",{length:255}).notNull(),
    content: text("content").notNull(),
    imageUrls: text("image_urls"),
    videoUrls: text("video_urls"),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    authorId: varchar("author_id",{length:255}).references(()=>users.id).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const postLikes = pgTable("post_likes",{
    id:serial("id").primaryKey(),
    postId: integer("post_id").references(()=>posts.id).notNull(),
    userId: varchar("user_id",{length:255}).references(()=>users.id).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    uniqueLike: uniqueIndex("post_likes_post_id_user_id_unique").on(table.postId, table.userId)
}))

export const comments = pgTable("comments",{
    id: serial("id").primaryKey(),
    postId: integer("post_id").references(()=>posts.id).notNull(),
    authorId: varchar("author_id",{length:255}).references(()=>users.id).notNull(),
    content: text("content").notNull(),
    parentId: integer("parent_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
export const follows = pgTable(
    "follows",
    {
      id: serial("id").primaryKey(),
      followerId: varchar("follower_id", { length: 255 })
        .references(() => users.id)
        .notNull(),
      followingId: varchar("following_id", { length: 255 })
        .references(() => users.id)
        .notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    },
    table => ({
      uniqueFollow: uniqueIndex("follows_follower_id_following_id_unique").on(
        table.followerId,
        table.followingId
      )
    })
  )
// ===== CHAT SCHEMA =====
export const conversations = pgTable(
    "conversations",
    {
        id: serial("id").primaryKey(),
        user1Id:varchar("user1_id",{length:255})
            .references(()=>users.id)
            .notNull(),
        user2Id: varchar("user2_id",{length:255})
            .references(()=>users.id)
            .notNull(),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) =>({
        uniqueConversation: uniqueIndex("conversations_user1_user2_unique").on(
            table.user1Id,
            table.user2Id
        )
    })
)

export const messages = pgTable("messages",{
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
        .references(()=>conversations.id,{onDelete:"cascade"})
        .notNull(),
    senderId: varchar("sender_id",{length:255})
        .references(()=>users.id)
        .notNull(),
    content: text("content").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
})
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
    actorId: varchar("actor_id", { length: 255 }).references(() => users.id).notNull(),
    type: text("type").notNull(),
    meta: jsonb("meta").$type<Record<string, any>>().default({}).notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  })

// ===== RELATIONS =====
// Định nghĩa quan hệ giữa các bảng

// 1. Posts Relations: Mỗi post thuộc về một user (author)
// Từ phía posts -> users: "Mỗi post có một tác giả"
export const postsRelations = relations(posts, ({ one, many }) => ({
    author: one(users, {
        fields: [posts.authorId],
        references: [users.id]
    }),
    likes: many(postLikes),
    comments: many(comments)
}))

// 2. Accounts Relations: Mỗi account thuộc về một user
// Từ phía accounts -> users: "Mỗi account thuộc về một user"
export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],      // Foreign key trong bảng accounts
        references: [users.id]          // Primary key trong bảng users
    })
}))

// 3. Sessions Relations: Mỗi session thuộc về một user
// Từ phía sessions -> users: "Mỗi session thuộc về một user"
export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],      // Foreign key trong bảng sessions
        references: [users.id]          // Primary key trong bảng users
    })
}))

// 4. Users Relations: Một user có nhiều posts, accounts, sessions
// Từ phía users -> các bảng khác: "Một user có nhiều..."
export const usersRelations = relations(users, ({ many }) => ({
    posts: many(posts),
    accounts: many(accounts),
    sessions: many(sessions),
    postLikes: many(postLikes),
    comments: many(comments),
    followers: many(follows, { relationName: "followers" }),
    following: many(follows, { relationName: "following" }),
    conversationsAsUser1: many(conversations, { relationName: "user1" }),
    conversationsAsUser2: many(conversations, { relationName: "user2" }),
    sentMessages: many(messages),
}))

export const schema = {
    users,
    accounts,
    sessions,
    posts,
    postLikes,
    comments,
    follows,
    conversations,
    messages,
    notifications,
}

// 5. Post Likes Relations
export const postLikesRelations = relations(postLikes, ({ one }) => ({
    post: one(posts, {
        fields: [postLikes.postId],
        references: [posts.id]
    }),
    user: one(users, {
        fields: [postLikes.userId],
        references: [users.id]
    })
}))

// 6. Comments Relations
export const commentsRelations = relations(comments, ({ one }) => ({
    post: one(posts, {
        fields: [comments.postId],
        references: [posts.id]
    }),
    author: one(users, {
        fields: [comments.authorId],
        references: [users.id]
    })
}))
export const followsRelations = relations(follows, ({ one }) => ({
    follower: one(users, {
      fields: [follows.followerId],
      references: [users.id],
      relationName: "following"
    }),
    following: one(users, {
      fields: [follows.followingId],
      references: [users.id],
      relationName: "followers"
    })
  }))

  export const conversationsRelations = relations(conversations, ({ one, many }) => ({
    user1: one(users, {
      fields: [conversations.user1Id],
      references: [users.id],
      relationName: "user1",
    }),
    user2: one(users, {
      fields: [conversations.user2Id],
      references: [users.id],
      relationName: "user2",
    }),
    messages: many(messages),
  }))
  
  export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
      fields: [messages.conversationId],
      references: [conversations.id],
    }),
    sender: one(users, {
      fields: [messages.senderId],
      references: [users.id],
    }),
  }))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
  }),
}))
