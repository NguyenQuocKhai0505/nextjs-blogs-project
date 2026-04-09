import { Metadata } from "next"
import CategoriesBar from "@/components/feed/categories-bar"
import ComposerCard from "@/components/feed/composer-card"
import HomeFeedSection from "@/components/feed/home-feed-section"
import type { FeedPost } from "@/lib/types"
import { apiUrl } from "@/lib/api"
import { getAccessTokenFromCookies } from "@/lib/server-token"

export const metadata: Metadata = {
  title: "My Social Network",
  description: "Connect, share, and discover with our community",
}

export default async function Home() {
  const token = await getAccessTokenFromCookies()
  const me = token
    ? await fetch(apiUrl("/me"), {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    : null

  const posts = await fetch(apiUrl("/posts"), { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])
  return (
    <div className="space-y-4">
      <CategoriesBar viewerRole={(me?.role as "USER" | "ADMIN" | undefined) ?? null} />
      <ComposerCard />
      <HomeFeedSection
        posts={posts as FeedPost[]}
        viewerId={me?.id ?? null}
        viewerRole={(me?.role as "USER" | "ADMIN" | undefined) ?? null}
      />
    </div>
  )
}
