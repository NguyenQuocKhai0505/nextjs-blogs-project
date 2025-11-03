

import {pgTable, varchar, boolean, timestamp} from "drizzle-orm/pg-core"

export const users = pgTable("user",{
    id: varchar("id",{length:255}).primaryKey(),
    name: varchar("name",{length:255}).notNull(),
    email: varchar("email",{length:255}).notNull().unique(),
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