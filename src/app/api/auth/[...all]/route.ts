import {auth} from "@/lib/auth"
import {toNextJsHandler} from "better-auth/next-js"
import { NextRequest } from "next/server"

const handler = toNextJsHandler(auth.handler)

export async function GET(req: NextRequest) {
    const url = req.nextUrl.pathname
    console.log("[AUTH API] GET request to:", url)
    console.log("[AUTH API] Query params:", Object.fromEntries(req.nextUrl.searchParams))
    
    try {
        const response = await handler.GET(req)
        console.log("[AUTH API] GET response status:", response.status)
        return response
    } catch (error) {
        console.error("[AUTH API] GET error:", error)
        console.error("[AUTH API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
        throw error // Re-throw để Next.js xử lý
    }
}

export async function POST(req: NextRequest) {
    const url = req.nextUrl.pathname
    console.log("[AUTH API] POST request to:", url)
    
    try {
        const response = await handler.POST(req)
        const responseStatus = response.status
        console.log("[AUTH API] POST response status:", responseStatus)
        
        return response
    } catch (error) {
        console.error("[AUTH API] POST error:", error)
        console.error("[AUTH API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
        throw error // Re-throw để Next.js xử lý
    }
}

