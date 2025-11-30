import {auth} from "@/lib/auth"
import {toNextJsHandler} from "better-auth/next-js"
import { NextRequest, NextResponse } from "next/server"

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
        console.error("[AUTH API] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        return NextResponse.json(
            { 
                error: "Internal server error", 
                details: error instanceof Error ? error.message : String(error),
                path: url
            },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    const url = req.nextUrl.pathname
    console.log("[AUTH API] POST request to:", url)
    
    try {
        // Log request body (without password for security)
        const clonedReq = req.clone()
        const body = await clonedReq.json().catch(() => ({}))
        const safeBody = { ...body }
        if (safeBody.password) {
            safeBody.password = "[REDACTED]"
        }
        console.log("[AUTH API] Request body:", safeBody)
        
        const response = await handler.POST(req)
        const responseStatus = response.status
        console.log("[AUTH API] POST response status:", responseStatus)
        
        // Log response for debugging (be careful with sensitive data)
        if (responseStatus >= 400) {
            const clonedResponse = response.clone()
            const responseBody = await clonedResponse.json().catch(() => ({}))
            console.error("[AUTH API] Error response:", responseBody)
        }
        
        return response
    } catch (error) {
        console.error("[AUTH API] POST error:", error)
        console.error("[AUTH API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
        console.error("[AUTH API] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        return NextResponse.json(
            { 
                error: "Internal server error", 
                details: error instanceof Error ? error.message : String(error),
                path: url
            },
            { status: 500 }
        )
    }
}

