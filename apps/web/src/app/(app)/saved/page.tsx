import { Metadata } from "next"
import { Suspense } from "react"

import SavedClient from "@/components/saved/saved-client"
import { apiUrl } from "@/lib/api"
import { getAccessTokenFromCookies } from "@/lib/server-token"

export const metadata: Metadata = {
  title: "Saved posts",
  description: "Posts you saved for later",
}

export default async function SavedPage() {
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
        <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <SavedClient
        viewerId={me?.id ?? null}
        viewerRole={(me?.role as "USER" | "ADMIN" | undefined) ?? null}
      />
    </Suspense>
  )
}
