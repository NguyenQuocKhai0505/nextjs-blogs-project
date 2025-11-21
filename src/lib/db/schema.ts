

import { relations } from "drizzle-orm"
import {pgTable, varchar, boolean, timestamp, text, serial, integer, uniqueIndex} from "drizzle-orm/pg-core"

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
    comments: many(comments)
}))

export const schema = {
    users,
    accounts,
    sessions,
    posts,
    postLikes,
    comments
    
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

