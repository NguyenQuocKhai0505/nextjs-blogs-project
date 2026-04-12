import { Suspense } from "react"
import DiscoverClient from "./discover-client"

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl py-10 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <DiscoverClient />
    </Suspense>
  )
}
