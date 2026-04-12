import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getAccessTokenFromCookies } from "@/lib/server-token"
import { authFetchServer } from "@/lib/auth-fetch-server"
import { apiUrl } from "@/lib/api"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import PostList from "@/components/post/post-list"
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

  const postsRes = await fetch(
    apiUrl(`/posts/by-author/${encodeURIComponent(me.id)}`),
    { cache: "no-store" }
  )
  const posts: FeedPost[] = postsRes.ok ? ((await postsRes.json()) as FeedPost[]) : []

  return (
    <main className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <Avatar className="h-20 w-20 border border-border">
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
                <div className="min-w-0">
                  <CardTitle className="mb-1 text-3xl">{me.name}</CardTitle>
                  <p className="text-muted-foreground">{me.email}</p>
                  {me.bio ? (
                    <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {me.bio}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No bio yet — use the pencil button on your avatar to add one.
                    </p>
                  )}
                </div>
              </div>
              <Button asChild className="shrink-0 gap-2 self-start sm:self-center">
                <Link href="/post/create">Create post</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <section>
          <h2 className="mb-6 text-2xl font-bold">My posts</h2>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="mb-4 text-lg text-muted-foreground">You have not created any posts yet.</p>
                <Button asChild>
                  <Link href="/post/create">Create a post</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PostList posts={posts} viewerId={me.id} viewerRole={me.role === "ADMIN" ? "ADMIN" : "USER"} />
          )}
        </section>
      </div>
    </main>
  )
}
