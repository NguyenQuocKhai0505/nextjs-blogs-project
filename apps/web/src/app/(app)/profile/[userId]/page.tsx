import { redirect, notFound } from "next/navigation"
import PostList from "@/components/post/post-list"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ProfileNameWithBadge } from "@/components/user/profile-name-with-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiUrl } from "@/lib/api"
import ProfileFollowActions from "@/components/profile/profile-follow-actions"
import { getAccessTokenFromCookies } from "@/lib/server-token"

interface ProfilePageProps
{
    params: Promise<{userId:string}>
}
export default async function UserProfilePage({params}:ProfilePageProps)
{
    const {userId} = await params
    const token = await getAccessTokenFromCookies()
    if(!token) redirect("/auth")

    const me = await fetch(apiUrl("/me"), {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    }).then((r) => (r.ok ? r.json() : null))

    const viewerId = me?.id as string | undefined
    const isOwnProfile = viewerId === userId

    const userData = await fetch(apiUrl(`/users/${encodeURIComponent(userId)}`), {
      cache: "no-store",
    }).then((r) => (r.ok ? r.json() : null))

    if(!userData) notFound()
    
    const posts = await fetch(apiUrl(`/posts/by-author/${encodeURIComponent(userId)}`), {
      cache: "no-store",
    }).then((r) => (r.ok ? r.json() : []))

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
                                <Avatar className="h-20 w-20">
                                    {userData.avatarUrl ? (
                                      <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                                    ) : null}
                                    <AvatarFallback className="text-2xl">{getInitials(userData.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <ProfileNameWithBadge name={userData.name} role={userData.role} />
                                    {userData.email && <p className="text-muted-foreground">{userData.email}</p>}
                                    <div className="flex items-center gap-4 mt-2">
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
                        <PostList posts={posts} viewerId={viewerId ?? null} />
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