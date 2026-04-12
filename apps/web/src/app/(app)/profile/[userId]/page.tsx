import { redirect, notFound } from "next/navigation"
import PostList from "@/components/post/post-list"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ProfileNameWithBadge } from "@/components/user/profile-name-with-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiUrl } from "@/lib/api"
import ProfileFollowActions from "@/components/profile/profile-follow-actions"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
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

interface ProfilePageProps
{
    params: Promise<{userId:string}>
}
export default async function UserProfilePage({params}:ProfilePageProps)
{
    const {userId} = await params
    const token = await getAccessTokenFromCookies()
    if(!token) redirect("/auth")

    const me = (await fetch(apiUrl("/me"), {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    }).then((r) => (r.ok ? r.json() : null))) as MePayload | null

    const viewerId = me?.id
    const isOwnProfile = viewerId === userId

    const userData = await fetch(apiUrl(`/users/${encodeURIComponent(userId)}`), {
      cache: "no-store",
    }).then((r) => (r.ok ? r.json() : null)) as {
      id: string
      name: string
      avatarUrl: string | null
      bio?: string | null
      role?: string
      email?: string
    } | null

    if(!userData) notFound()
    
    const posts = (await fetch(apiUrl(`/posts/by-author/${encodeURIComponent(userId)}`), {
      cache: "no-store",
    }).then((r) => (r.ok ? r.json() : []))) as FeedPost[]

    const getInitials = (name?:string)=>
        !name
            ?"U"
            :name
                .split(" ")
                .map((n)=>n[0])
                .join("")
                .toUpperCase()
                .slice(0,2)

   
    return (
        <main className="py-10">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                  <Avatar className="h-20 w-20 border border-border">
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
                                <div className="min-w-0">
                                    <ProfileNameWithBadge name={userData.name} role={userData.role} />
                                    {isOwnProfile && me?.email ? (
                                      <p className="text-muted-foreground">{me.email}</p>
                                    ) : null}
                                    {userData.bio ? (
                                      <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                                        {userData.bio}
                                      </p>
                                    ) : isOwnProfile ? (
                                      <p className="mt-2 text-sm text-muted-foreground">
                                        No bio yet — tap the pencil on your avatar to add one.
                                      </p>
                                    ) : null}
                                    <div className="mt-2 flex items-center gap-4">
                                    <Stat label={posts.length === 1 ? "post" : "posts"} value={posts.length} />
                                    </div>
                                </div>
                            </div>
                            {!isOwnProfile ? (
                              <ProfileFollowActions targetUserId={userId} isOwnProfile={false} />
                            ) : null}
                        </div>
                    </CardHeader>
                </Card>
                <section>
                    <h2 className="text-2xl font-bold mb-6">
                        {isOwnProfile ? "My Posts" : `${userData.name}'s Posts`}
                    </h2>
                    {posts.length === 0 ? (
                        <Card>
                        <CardContent className="py-10 text-center">
                            <p className="text-muted-foreground text-lg">
                            {isOwnProfile ? "You haven't created any posts yet" : `${userData.name} hasn't created any posts yet`}
                            </p>
                        </CardContent>
                        </Card>
                    ) : (
                        <PostList
                          posts={posts}
                          viewerId={viewerId ?? null}
                          viewerRole={me?.role === "ADMIN" ? "ADMIN" : "USER"}
                        />
                    )}
            </section>
            </div>
        </main>
    )
}

function Stat({label,value}:{label:string; value:number}){
    return(
        <div className="flex items-center gap-1">
            <span className="font-semibold">{value}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
        </div>
    )
}