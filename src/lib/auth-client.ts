
import {createAuthClient} from "better-auth/react"
import { auth } from "./auth"
export const authClient = createAuthClient({
    baseURL: process.env.BASE_URL || "http://localhost:3000",
})

export const {signUp,signIn,signOut,useSession} = authClient