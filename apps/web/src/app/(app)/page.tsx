import PostList from "@/components/post/post-list"
import { getAllPost } from "@/lib/db/queries"
import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PenSquare } from "lucide-react"
import StoriesBar from "@/components/feed/stories-bar"
import ComposerCard from "@/components/feed/composer-card"

export const metadata: Metadata = {
  title: "My Social Network",
  description: "Connect, share, and discover with our community",
}

export default async function Home() {
  const posts = await getAllPost()
  const hasPosts = posts.length > 0

  return (
    <div className="space-y-4">
      <StoriesBar />
      <ComposerCard />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Home feed</h1>
            <p className="text-sm text-muted-foreground">What people are sharing right now.</p>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/post/create">
              <PenSquare className="mr-2 h-4 w-4" />
              Post
            </Link>
          </Button>
        </div>

        {hasPosts ? (
          <PostList posts={posts} />
        ) : (
          <Card className="rounded-2xl border-dashed bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
            <CardContent className="space-y-3 py-12 text-center">
              <p className="text-base font-semibold">No posts yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to share an update with the community.
              </p>
              <Button asChild className="rounded-xl">
                <Link href="/post/create">Create your first post</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
