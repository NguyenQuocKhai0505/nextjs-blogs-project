

// Minimal middleware:
// - Only prevents logged-in users from accessing `/auth` again.
// - Route protection is handled inside the corresponding page components
//   using Better Auth on the Node.js runtime (more reliable than Edge).

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest){
  const pathName = request.nextUrl.pathname
  const session = await getSessionCookie(request)

  // If user is already logged in and tries to access /auth,
  // redirect them back to the homepage.
  if (pathName === "/auth" && session) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/auth"]
}