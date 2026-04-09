export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAccessTokenFromCookies } from "@/lib/server-token"
import { apiUrl } from "@/lib/api"
import ContactClient, {
  type ConversationItem,
} from "@/components/contact/contact-client"

export default async function ContactPage() {
  const token = await getAccessTokenFromCookies()
  if (!token) redirect("/auth")

  const conversations = await fetch(apiUrl("/conversations"), {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  })
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => [])

  return (
    <main className="py-10">
      <div className="mx-auto w-full max-w-4xl">
        <Suspense
          fallback={
            <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">
              Loading chats…
            </div>
          }
        >
          <ContactClient initialConversations={conversations as ConversationItem[]} />
        </Suspense>
      </div>
    </main>
  )
}