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
    console.log("[AUTH API] ========== POST REQUEST START ==========")
    console.log("[AUTH API] POST request to:", url)
    console.log("[AUTH API] Request URL:", req.url)
    
    try {
        console.log("[AUTH API] Calling Better Auth handler...")
        const response = await handler.POST(req)
        const responseStatus = response.status
        console.log("[AUTH API] POST response status:", responseStatus)
        
        // Log error response body nếu có lỗi (không clone để tránh conflict)
        if (responseStatus >= 400) {
            console.error("[AUTH API] ========== ERROR RESPONSE ==========")
            console.error("[AUTH API] Error status:", responseStatus)
            console.error("[AUTH API] Error statusText:", response.statusText)
            // Không clone response để tránh lỗi "Must call super constructor"
            // Better Auth sẽ tự log error details
            console.error("[AUTH API] ======================================")
        } else {
            console.log("[AUTH API] ========== SUCCESS RESPONSE ==========")
        }
        
        return response
    } catch (error) {
        console.error("[AUTH API] ========== EXCEPTION CAUGHT ==========")
        console.error("[AUTH API] POST exception:", error)
        console.error("[AUTH API] Error type:", error?.constructor?.name)
        console.error("[AUTH API] Error message:", error instanceof Error ? error.message : String(error))
        console.error("[AUTH API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
        
        // Log full error object
        if (error instanceof Error) {
            const errorDetails: Record<string, unknown> = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            }
            // Add cause if it exists (Error with cause property)
            if ('cause' in error && error.cause !== undefined) {
                errorDetails.cause = error.cause
            }
            console.error("[AUTH API] Error details:", JSON.stringify(errorDetails, null, 2))
        }
        console.error("[AUTH API] ======================================")
        
        throw error // Re-throw để Next.js xử lý
    }
}

