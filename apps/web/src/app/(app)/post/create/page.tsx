export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"

import PostForm from "@/components/post/post-form"
import { getAccessTokenFromCookies } from "@/lib/server-token"

export default async function CreatePost() {
  const token = await getAccessTokenFromCookies()
  if (!token) {
    redirect("/auth")
  }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Write from scratch or let AI draft from your brief.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <PostForm />
      </div>
    </div>
  )
}
