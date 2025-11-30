
import {createAuthClient} from "better-auth/react"
import { auth } from "./auth"

// Get base URL for client-side
// In browser, use window.location.origin
// In server-side, use NEXT_PUBLIC_BASE_URL or fallback to localhost
const getBaseURL = () => {
    if (typeof window !== "undefined") {
        // Client-side: use current origin
        return window.location.origin
    }
    // Server-side: use environment variable
    return process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000"
}

export const authClient = createAuthClient({
    baseURL: getBaseURL(),
})

export const {signUp,signIn,signOut,useSession} = authClient