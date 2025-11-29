
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getPostByUserId } from "@/lib/db/queries"
import PostList from "@/components/post/post-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PenSquare } from "lucide-react"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { getUserById } from "@/lib/db/queries"
import { getFollowersStatsAction } from "@/actions/follow-actions"
export default async function ProfilePage(){
    //Kiem tra session - user phai dang nhap
    const session = await auth.api.getSession({
        headers: await headers()
    })

    //Neu chua dang nhap redirect ve homepage
    if(!session || !session.user){
        redirect("/")
    }
    //Lay thong tin user tu session 
    const user = session.user 

    // Hàm lấy initials cho avatar
    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    // Fetch tất cả data song song để tối ưu performance
    const [posts, userData, stats] = await Promise.all([
        getPostByUserId(user.id),
        getUserById(user.id),
        getFollowersStatsAction(user.id)
    ])

    const userAvatar = userData?.avatar || null
    const displayName = userData?.name || user.name || "User"
    const displayEmail = userData?.email || user.email
    const followerCount = stats.followers
    const followingCount = stats.following

    return(
        <main className="py-10">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header: User Info Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Avatar with Edit Button */}
                                <div className="relative">
                                    <Avatar className="h-20 w-20">
                                        {userAvatar && <AvatarImage src={userAvatar} alt={user.name}/>}
                                        <AvatarFallback className="text-2xl">
                                            {getInitials(displayName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <EditProfileDialog
                                        currentName={displayName}
                                        currentEmail={displayEmail || ""}
                                        currentAvatar={userAvatar} // TODO: Lấy từ database sau
                                    />
                                </div>
                                {/* User info */}
                                <div>
                                    <CardTitle className="text-3xl mb-1">
                                        {displayName}
                                    </CardTitle>
                                    <p className="text-muted-foreground">
                                        {displayEmail}
                                    </p>
                                    {/* Stats: Posts, Followers, Following */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">{posts.length}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {posts.length === 1 ? "post" : "posts"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">{followerCount}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {followerCount !== 1 ? "followers" : "follower"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold">{followingCount}</span>
                                            <span className="text-sm text-muted-foreground">following</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Create Post Button */}
                            <Button asChild className="gap-2">
                                <Link href={"/post/create"}>
                                    <PenSquare className="h-4 w-4"/>
                                    Create Post
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
                
                {/* Post Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">My Posts</h2>
                        {posts.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center">
                                    <p className="text-muted-foreground text-lg mb-4">
                                        You haven&apos;t created any posts yet
                                    </p>
                                    <Button asChild>
                                        <Link href={"/post/create"}>
                                            <PenSquare className="h-4 w-4 mr-2"/>
                                            Create Your First Post
                                        </Link>
                                    </Button>
                                </CardContent> 
                            </Card>
                        ):
                        (
                            <PostList posts={posts}/>
                        )
                    }
                </div>
            </div>
        </main>
    )
}