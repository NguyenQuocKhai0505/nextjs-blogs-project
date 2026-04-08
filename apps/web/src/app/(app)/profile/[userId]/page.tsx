import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { getPostByUserId, getUserById } from "@/lib/db/queries"
import PostList from "@/components/post/post-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FollowButton } from "@/components/profile/follow-button"
import { checkFollowingAction, getFollowersStatsAction } from "@/actions/follow-actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

interface ProfilePageProps
{
    params: Promise<{userId:string}>
}
export default async function UserProfilePage({params}:ProfilePageProps)
{
    const {userId} = await params
    const session = await auth.api.getSession({headers:await headers()})
    if(!session?.user) redirect("/auth")

    const viewerId = session.user.id 
    const isOwnProfile = viewerId === userId

    const userData = await getUserById(userId)
    if(!userData) notFound()
    
    const [posts,stats,initalFollowing] = await Promise.all([
        getPostByUserId(userId),
        getFollowersStatsAction(userId),
        isOwnProfile ? Promise.resolve(false) : checkFollowingAction(userId)
    ])

    const followerCount = stats.followers
    const followingCount = stats.following

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
                                    {userData.avatar && <AvatarImage src={userData.avatar} alt={userData.name}/>}
                                    <AvatarFallback className="text-2xl">{getInitials(userData.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-3xl mb-1">{userData.name}</CardTitle>
                                    {userData.email && <p className="text-muted-foreground">{userData.email}</p>}
                                    <div className="flex items-center gap-4 mt-2">
                                    <Stat label={posts.length === 1 ? "post" : "posts"} value={posts.length} />
                                    <Stat label={followerCount ===1 ? "follower" :"followers"} value={followerCount}/>
                                    <Stat label="following" value={followingCount} />
                                    </div>
                                </div>
                            </div>
                            {!isOwnProfile && (
                                <div className="flex gap-2">
                                    <FollowButton
                                        targetUserId={userId}
                                        initialFollowing={Boolean(initalFollowing)}
                                    />
                                    <Button
                                        asChild
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-none"
                                    >
                                        <Link href={`/contact?userId=${userId}`}>
                                            <MessageCircle className="mr-2 h-4 w-4" />
                                            Chat
                                        </Link>
                                    </Button>
                                </div>
                            )}
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
                        <PostList posts={posts} />
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