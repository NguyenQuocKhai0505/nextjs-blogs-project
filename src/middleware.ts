

//Define protected routes => /profile, post/create

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedRoutes = ["/profile","/post/create","/post/edit","/contact"]
const protectedApiRoutes = ["/api/conversations","/api/messages"]

export async function middleware(request: NextRequest){
    const pathName = request.nextUrl.pathname
    const session = await getSessionCookie(request)
    
    // Check protected page routes
    const isProtectedRoute = protectedRoutes.some((route)=> pathName.startsWith(route))
    if(isProtectedRoute && !session){
        //redirect the user to the auth page
        //because user is not logged in
        return NextResponse.redirect(new URL("/auth",request.url))
    }
    
    // Check protected API routes
    const isProtectedApiRoute = protectedApiRoutes.some((route)=> pathName.startsWith(route))
    if(isProtectedApiRoute && !session){
        // Return 401 for API routes instead of redirect
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        )
    }
    
    //if user is already logged in and user is accessing /auth route
    //they will automatically redirect to homepage 
    if(pathName=== "/auth" && session){
        return NextResponse.redirect(new URL("/",request.url))
    }
    return NextResponse.next()
}
export const config = {
    matcher: [
        "/profile/:path*",
        "/post/create",
        "/post/edit/:path*",
        "/contact",
        "/auth",
        "/api/conversations",
        "/api/messages"
    ]
}