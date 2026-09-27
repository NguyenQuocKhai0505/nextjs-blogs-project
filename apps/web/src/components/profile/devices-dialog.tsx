"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, LogOut, Monitor, Smartphone } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { authFetch } from "@/lib/auth-fetch"
import { confirmToast } from "@/lib/confirm-toast"
import { formatRelativeTime } from "@/lib/utils"

type DeviceSession = {
  id: string
  ipAddress: string
  userAgent: string
  createdAt: string
  lastActiveAt: string
  current: boolean
}

type DevicesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function errorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message
    if (typeof msg === "string") return msg
    if (Array.isArray(msg)) return msg.join(", ")
  }
  return fallback
}

function parseUserAgent(ua: string) {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Unknown browser"

  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS"

  const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(ua)
  return { label: `${browser} on ${os}`, isMobile }
}

function formatLastActive(iso: string) {
  const rel = formatRelativeTime(iso)
  if (rel === "now") return "Active now"
  return /^\d/.test(rel) ? `Active ${rel} ago` : `Active ${rel}`
}

export function DevicesDialog({ open, onOpenChange }: DevicesDialogProps) {
  const [sessions, setSessions] = useState<DeviceSession[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [revokingOthers, setRevokingOthers] = useState(false)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch("/auth/sessions", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(errorMessage(data, "Failed to load devices"))
        return
      }
      setSessions(data as DeviceSession[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void loadSessions()
  }, [open, loadSessions])

  const revokeOne = async (id: string) => {
    setBusyId(id)
    try {
      const res = await authFetch(`/auth/sessions/${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(errorMessage(data, "Failed to sign out device"))
        return
      }
      setSessions((prev) => prev.filter((s) => s.id !== id))
      toast.success("Device signed out")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusyId(null)
    }
  }

  const revokeOthers = async () => {
    const ok = await confirmToast({
      title: "Sign out of all other devices?",
      description: "Only this device will stay signed in.",
      confirmText: "Sign out",
      cancelText: "Cancel",
    })
    if (!ok) return

    setRevokingOthers(true)
    try {
      const res = await authFetch("/auth/sessions", { method: "DELETE" })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(errorMessage(data, "Failed to sign out other devices"))
        return
      }
      setSessions((prev) => prev.filter((s) => s.current))
      toast.success(errorMessage(data, "Signed out of other devices"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setRevokingOthers(false)
    }
  }

  const otherCount = sessions.filter((s) => !s.current).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Devices</DialogTitle>
          <DialogDescription>
            Devices currently signed in to your account. Sign out any device you
            don&apos;t recognize.
          </DialogDescription>
        </DialogHeader>

        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No active devices.
          </p>
        ) : (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {sessions.map((s) => {
              const { label, isMobile } = parseUserAgent(s.userAgent)
              const Icon = isMobile ? Smartphone : Monitor
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{label}</p>
                      {s.current ? (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          This device
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.ipAddress} · {s.current ? "Active now" : formatLastActive(s.lastActiveAt)}
                    </p>
                  </div>
                  {!s.current ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void revokeOne(s.id)}
                      disabled={busyId === s.id || revokingOthers}
                    >
                      {busyId === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Sign out"
                      )}
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="destructive"
            onClick={() => void revokeOthers()}
            disabled={otherCount === 0 || revokingOthers || loading}
          >
            {revokingOthers ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sign out all other devices
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
