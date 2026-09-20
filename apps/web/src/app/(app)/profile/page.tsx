import { redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getAccessTokenFromCookies } from "@/lib/server-token"
import { authFetchServer } from "@/lib/auth-fetch-server"
import { apiUrl } from "@/lib/api"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { ProfilePostsSection } from "@/components/profile/profile-posts-section"
import type { FeedPost } from "@/lib/types"

function getInitials(name?: string) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default async function ProfilePage() {
  const token = await getAccessTokenFromCookies()
  if (!token) redirect("/auth")

  const res = await authFetchServer("/me")
  if (!res.ok) redirect("/auth")
  const me = (await res.json()) as {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    bio: string | null
    role?: string
  }

  const postsRes = await fetch(apiUrl(`/posts/by-author/${encodeURIComponent(me.id)}`), {
    cache: "no-store",
  })
  const posts: FeedPost[] = postsRes.ok ? ((await postsRes.json()) as FeedPost[]) : []

  return (
    <div className="space-y-5 pb-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-28 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent sm:h-36" />
        <div className="relative px-4 pb-5 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                <Avatar className="h-24 w-24 border-4 border-card shadow-md sm:h-28 sm:w-28">
                  {me.avatarUrl ? <AvatarImage src={me.avatarUrl} alt={me.name} /> : null}
                  <AvatarFallback className="text-2xl">{getInitials(me.name)}</AvatarFallback>
                </Avatar>
                <EditProfileDialog
                  currentName={me.name}
                  currentEmail={me.email}
                  currentAvatar={me.avatarUrl}
                  currentBio={me.bio}
                />
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="truncate text-2xl font-bold tracking-tight">{me.name}</h1>
                <p className="text-sm text-muted-foreground">{me.email}</p>
              </div>
            </div>
            <Button asChild className="shrink-0 rounded-full">
              <Link href="/post/create">Create post</Link>
            </Button>
          </div>

          {me.bio ? (
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed">{me.bio}</p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No bio yet — use the pencil on your avatar to add one.
            </p>
          )}

          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="font-bold">{posts.length}</span>{" "}
              <span className="text-muted-foreground">{posts.length === 1 ? "post" : "posts"}</span>
            </div>
          </div>
        </div>
      </div>

      <ProfilePostsSection
        posts={posts}
        viewerId={me.id}
        viewerRole={me.role === "ADMIN" ? "ADMIN" : "USER"}
        emptyLabel="You have not created any posts yet."
      />
    </div>
  )
}
