
// This page requires request headers for auth; force dynamic rendering to avoid
// Next.js static optimization errors in production.
export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { headers } from "next/headers"

import PostForm from "@/components/post/post-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"

// Server-side route protection: only authenticated users can access /post/create.
export default async function CreatePost() {
  let session = null
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch (error) {
    console.error("[CreatePost] Failed to get session", error)
  }

  if (!session?.user) {
    redirect("/auth")
  }

  return (
    <main className="py-10">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold">
              Create New Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PostForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}