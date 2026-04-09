"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"

type Rel = {
  youFollow: boolean
  followsYou: boolean
  mutual: boolean
  isSelf: boolean
}

export default function ProfileFollowActions({
  targetUserId,
  isOwnProfile,
}: {
  targetUserId: string
  isOwnProfile: boolean
}) {
  const router = useRouter()
  const [rel, setRel] = useState<Rel | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const res = await authFetch(`/users/${encodeURIComponent(targetUserId)}/relationship`)
    if (!res.ok) return
    setRel((await res.json()) as Rel)
  }, [targetUserId])

  useEffect(() => {
    if (isOwnProfile) return
    let cancelled = false
    ;(async () => {
      if (!getAccessToken()) {
        if (!cancelled) {
          setRel({ youFollow: false, followsYou: false, mutual: false, isSelf: false })
        }
        return
      }
      const res = await authFetch(`/users/${encodeURIComponent(targetUserId)}/relationship`)
      if (!res.ok || cancelled) return
      setRel((await res.json()) as Rel)
    })()
    return () => {
      cancelled = true
    }
  }, [targetUserId, isOwnProfile])

  if (isOwnProfile) return null
  if (!rel) {
    return <div className="h-9 w-40 animate-pulse rounded-md bg-muted" aria-hidden />
  }

  const onFollow = async () => {
    if (!getAccessToken()) {
      toast.error("Please sign in to continue.")
      router.push("/auth")
      return
    }
    setBusy(true)
    try {
      const res = await authFetch(`/users/${encodeURIComponent(targetUserId)}/follow`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("fail")
      toast.success(rel.followsYou ? "You are now friends — you can chat." : "Following")
      await refresh()
    } catch {
      toast.error("Could not follow.")
    } finally {
      setBusy(false)
    }
  }

  const onUnfollow = async () => {
    setBusy(true)
    try {
      const res = await authFetch(`/users/${encodeURIComponent(targetUserId)}/follow`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("fail")
      toast.success("Unfollowed")
      await refresh()
    } catch {
      toast.error("Could not unfollow.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {rel.mutual ? (
        <Button
          asChild
          className="border-none bg-blue-600 text-white shadow-sm hover:bg-blue-700"
        >
          <Link href={`/contact?userId=${encodeURIComponent(targetUserId)}`}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat
          </Link>
        </Button>
      ) : null}
      {!rel.youFollow ? (
        <Button onClick={() => void onFollow()} disabled={busy} variant={rel.followsYou ? "default" : "secondary"}>
          {rel.followsYou ? "Follow back" : "Follow"}
        </Button>
      ) : (
        <Button type="button" variant="outline" onClick={() => void onUnfollow()} disabled={busy}>
          {rel.mutual ? "Unfriend" : "Following"}
        </Button>
      )}
    </div>
  )
}
