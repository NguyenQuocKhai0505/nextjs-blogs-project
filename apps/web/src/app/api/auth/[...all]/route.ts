import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest } from "next/server"

// Better Auth is Node.js-only (uses crypto, dynamic eval, etc.),
// so we explicitly run this route on the Node.js runtime instead of Edge.
export const runtime = "nodejs"

const handler = toNextJsHandler(auth.handler)

export async function GET(req: NextRequest) {
  return handler.GET(req)
}

export async function POST(req: NextRequest) {
  return handler.POST(req)
}

