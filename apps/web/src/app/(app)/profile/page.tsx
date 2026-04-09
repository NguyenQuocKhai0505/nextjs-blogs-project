import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAccessTokenFromCookies } from "@/lib/server-token"
import { authFetchServer } from "@/lib/auth-fetch-server"

function getInitials(name?: string) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function safeDecodeJwtSub(token: string) {
  // No verification; only for display. Real auth is enforced by API.
  try {
    const [, payload] = token.split(".")
    if (!payload) return null
    const json = Buffer.from(payload, "base64url").toString("utf8")
    const data = JSON.parse(json) as { sub?: string }
    return data?.sub ?? null
  } catch {
    return null
  }
}

export default async function ProfilePage(){
    const token = await getAccessTokenFromCookies()
    if(!token){
      redirect("/auth")
    }

    const res = await authFetchServer("/me")
    if (!res.ok) redirect("/auth")
    const me = (await res.json()) as {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }

    const userId = me.id ?? safeDecodeJwtSub(token)
    const displayName = me.name ?? "User"
    const displayEmail = me.email ?? ""
    const userAvatar: string | null = me.avatarUrl ?? null

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
                                        {userAvatar && <AvatarImage src={userAvatar} alt={displayName}/>}
                                        <AvatarFallback className="text-2xl">
                                            {getInitials(displayName)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                {/* User info */}
                                <div>
                                    <CardTitle className="text-3xl mb-1">
                                        {displayName}
                                    </CardTitle>
                                    <p className="text-muted-foreground">
                                        {displayEmail}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                      UserId: {userId ?? "unknown"}
                                    </p>
                                </div>
                            </div>
                            <Button asChild className="gap-2">
                              <Link href={"/post/create"}>Create Post</Link>
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
                
                {/* Post Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">My Posts</h2>
                    <Card>
                      <CardContent className="py-10 text-center">
                        <p className="text-muted-foreground text-lg mb-4">
                          Profile data is being migrated to NestJS.
                        </p>
                        <Button asChild>
                          <Link href={"/post/create"}>Create a post</Link>
                        </Button>
                      </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    )
}