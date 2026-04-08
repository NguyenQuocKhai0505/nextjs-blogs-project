import { NextRequest, NextResponse } from "next/server"
import { searchUsers } from "@/lib/db/queries"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Number(limitParam) : 5

    const users = await searchUsers(query, Math.min(Number.isNaN(limit) ? 5 : limit, 50))

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error("Search users API error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to search users" },
      { status: 500 }
    )
  }
}

