import { ReactNode } from "react"
import PostList from "@/components/post/post-list"
import { getAllPost } from "@/lib/db/queries"
import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PenSquare, Users, BookOpen } from "lucide-react"

export const metadata: Metadata = {
  title: "Next.js 15 Blog",
  description: "Next.js 15 Blog",
}

export default async function Home() {
  const posts = await getAllPost()
  const hasPosts = posts.length > 0
  const authorCount = new Set(posts.map((post) => post.authorId)).size

  return (
    <main className="py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        {/* Hero */}
        <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 lg:p-12 shadow-lg">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1 text-sm text-muted-foreground backdrop-blur">
                ✨ Fresh stories from the community
              </span>
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                Welcome to the Blog
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Share your ideas, stay inspired, and connect with other creators in our growing
                community. Start writing now or explore what others are talking about.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/post/create">
                    <PenSquare className="h-4 w-4" />
                    Create Post
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/profile">
                    View My Profile
                  </Link>
                </Button>
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-4">
              <StatCard
                icon={<BookOpen className="h-5 w-5 text-primary" />}
                label="Published posts"
                value={posts.length}
              />
              <StatCard
                icon={<Users className="h-5 w-5 text-primary" />}
                label="Active authors"
                value={authorCount}
              />
            </div>
          </div>
        </section>

        {/* Latest posts */}
        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Latest posts</h2>
            <p className="text-muted-foreground">
              Discover what others are working on right now.
            </p>
          </div>

          {hasPosts ? (
            <PostList posts={posts} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center space-y-4">
                <p className="text-lg font-medium">No posts yet</p>
                <p className="text-muted-foreground">
                  Be the first to share your insights with the community.
                </p>
                <Button asChild>
                  <Link href="/post/create">Write your first post</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  )
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-background/70 p-4 shadow-sm">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold">{value}</div>
    </div>
  )
}
