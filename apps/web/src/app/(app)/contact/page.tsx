export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAccessTokenFromCookies } from "@/lib/server-token"
import { apiUrl } from "@/lib/api"
import ContactClient, {
  type ConversationItem,
} from "@/components/contact/contact-client"
import { ContactLoadingFallback } from "@/components/contact/contact-loading-fallback"

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
    <main className="py-6 md:py-8">
      <div className="mx-auto w-full max-w-none">
        <Suspense fallback={<ContactLoadingFallback />}>
          <ContactClient initialConversations={conversations as ConversationItem[]} />
        </Suspense>
      </div>
    </main>
  )
}