
import {betterAuth} from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {db} from "./db"
import * as schema from "./db/schema"
export const auth = betterAuth({
    appName:"NextJS 15 Blog",
    secret:process.env.BETTER_AUTH_SECRET || "BETTER_AUTH_SECRET",
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    database: drizzleAdapter(db,{
        provider: "pg",
        schema:{
            ...schema,
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts
        }
    }),
    emailAndPassword:{
        enabled:true,
        requireEmailVerification:false,
        minPasswordLength:6,
        maxPasswordLength:20,
        autoSignIn:false,
    },
    session:{
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache:{
            enabled:true,
            maxAge: 60 * 5, // 5 minutes
        },
        disableSessionRefresh:true,
    },
    advanced:{
        useSecureCookies: process.env.NODE_ENV ==="production",
        defaultCookieAttributes:{
            httpOnly:true,
            secure: process.env.NODE_ENV ==="production",
        }
    }
})