import { Metadata } from "next"
import { Suspense } from "react"
import HomeClient from "@/components/feed/home-client"
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

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          Loading feed…
        </div>
      }
    >
      <HomeClient
        viewerId={me?.id ?? null}
        viewerRole={(me?.role as "USER" | "ADMIN" | undefined) ?? null}
      />
    </Suspense>
  )
}
