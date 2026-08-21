import { redirect, notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileNameWithBadge } from "@/components/user/profile-name-with-badge"
import { apiUrl } from "@/lib/api"
import ProfileFollowActions from "@/components/profile/profile-follow-actions"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { ProfilePostsSection } from "@/components/profile/profile-posts-section"
import { getAccessTokenFromCookies } from "@/lib/server-token"
import type { FeedPost } from "@/lib/types"

type MePayload = {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  bio?: string | null
  role?: string
}

interface ProfilePageProps {
  params: Promise<{ userId: string }>
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params
  const token = await getAccessTokenFromCookies()
  if (!token) redirect("/auth")

  const me = (await fetch(apiUrl("/me"), {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  }).then((r) => (r.ok ? r.json() : null))) as MePayload | null

  const viewerId = me?.id
  const isOwnProfile = viewerId === userId

  const userData = (await fetch(apiUrl(`/users/${encodeURIComponent(userId)}`), {
    cache: "no-store",
  }).then((r) => (r.ok ? r.json() : null))) as {
    id: string
    name: string
    avatarUrl: string | null
    bio?: string | null
    role?: string
    email?: string
  } | null

  if (!userData) notFound()

  const posts = (await fetch(apiUrl(`/posts/by-author/${encodeURIComponent(userId)}`), {
    cache: "no-store",
  }).then((r) => (r.ok ? r.json() : []))) as FeedPost[]

  const getInitials = (name?: string) =>
    !name
      ? "U"
      : name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

  return (
    <div className="space-y-5 pb-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-28 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent sm:h-36" />
        <div className="relative px-4 pb-5 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                <Avatar className="h-24 w-24 border-4 border-card shadow-md sm:h-28 sm:w-28">
                  {userData.avatarUrl ? (
                    <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                  ) : null}
                  <AvatarFallback className="text-2xl">{getInitials(userData.name)}</AvatarFallback>
                </Avatar>
                {isOwnProfile && me ? (
                  <EditProfileDialog
                    currentName={me.name ?? userData.name}
                    currentEmail={me.email ?? ""}
                    currentAvatar={me.avatarUrl ?? userData.avatarUrl}
                    currentBio={me.bio ?? userData.bio ?? null}
                  />
                ) : null}
              </div>
              <div className="min-w-0 pb-1">
                <ProfileNameWithBadge name={userData.name} role={userData.role} />
                {isOwnProfile && me?.email ? (
                  <p className="text-sm text-muted-foreground">{me.email}</p>
                ) : null}
              </div>
            </div>
            {!isOwnProfile ? (
              <ProfileFollowActions targetUserId={userId} isOwnProfile={false} />
            ) : null}
          </div>

          {userData.bio ? (
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed">
              {userData.bio}
            </p>
          ) : isOwnProfile ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No bio yet — tap the pencil on your avatar to add one.
            </p>
          ) : null}

          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="font-bold">{posts.length}</span>{" "}
              <span className="text-muted-foreground">
                {posts.length === 1 ? "post" : "posts"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProfilePostsSection
        posts={posts}
        viewerId={viewerId ?? null}
        viewerRole={me?.role === "ADMIN" ? "ADMIN" : "USER"}
        emptyLabel={
          isOwnProfile
            ? "You haven't created any posts yet"
            : `${userData.name} hasn't created any posts yet`
        }
      />
    </div>
  )
}
