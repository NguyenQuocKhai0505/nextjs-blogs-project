

//Define protected routes => /profile, /post/create, /post/edit, /contact
//These routes require authentication - users will be redirected to /auth if not logged in

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedRoutes = ["/profile","/post/create","/post/edit","/contact"]

export async function middleware(request: NextRequest){
    const pathName = request.nextUrl.pathname

    // Use Better Auth API to get the current session from request headers.
    // Type of the argument is a bit loose in the Better Auth typings, so we cast to any here.
    const sessionData = await auth.api.getSession({
        // Better Auth expects a Request-like object; in middleware we only need headers.
        headers: request.headers as any,
    } as any)
    const isAuthenticated = !!sessionData?.session

    // Check protected page routes
    const isProtectedRoute = protectedRoutes.some((route)=> pathName.startsWith(route))
    if(isProtectedRoute && !isAuthenticated){
        //redirect the user to the auth page
        //because user is not logged in
        return NextResponse.redirect(new URL("/auth",request.url))
    }
    
    // Note: API routes handle authentication themselves in route handlers
    // Middleware should not intercept API routes to avoid conflicts
    
    //if user is already logged in and user is accessing /auth route
    //they will automatically redirect to homepage 
    if(pathName=== "/auth" && isAuthenticated){
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
        "/auth"
    ]
}