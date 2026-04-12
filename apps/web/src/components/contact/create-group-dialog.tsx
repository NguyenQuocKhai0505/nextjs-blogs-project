"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import { useLocale } from "@/lib/i18n/locale-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Friend = { id: string; name: string; avatarUrl: string | null }

export function CreateGroupDialog({
  onCreated,
}: {
  onCreated: (conversationId: number) => void
}) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [filter, setFilter] = useState("")
  const [title, setTitle] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const loadFriends = useCallback(async () => {
    if (!getAccessToken()) return
    setLoadingFriends(true)
    try {
      const res = await authFetch(`/me/mutual-friends?q=`, { cache: "no-store" })
      if (!res.ok) {
        setFriends([])
        return
      }
      const data = (await res.json()) as Friend[]
      setFriends(Array.isArray(data) ? data : [])
    } finally {
      setLoadingFriends(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void loadFriends()
    setFilter("")
    setTitle("")
    setSelected(new Set())
  }, [open, loadFriends])

  const q = filter.trim().toLowerCase()
  const visible = q
    ? friends.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.id && f.id.toLowerCase().includes(q))
      )
    : friends

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const submit = async () => {
    if (!title.trim()) {
      toast.error(t("chat.groupNameRequired"))
      return
    }
    if (selected.size < 1) {
      toast.error(t("chat.groupPickOne"))
      return
    }
    setSubmitting(true)
    try {
      const res = await authFetch("/conversations/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          memberIds: [...selected],
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string }
        toast.error(err?.message ?? t("chat.groupCreateFail"))
        return
      }
      const row = (await res.json()) as { id?: number }
      const id = typeof row?.id === "number" ? row.id : null
      if (id == null) {
        toast.error(t("chat.groupCreateFail"))
        return
      }
      toast.success(t("chat.groupCreateSuccess"))
      setOpen(false)
      onCreated(id)
    } catch {
      toast.error(t("chat.groupCreateFail"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-lg px-2 text-xs"
        >
          <Plus className="size-3.5" />
          {t("chat.createGroup")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90dvh,560px)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("chat.createGroupTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="group-name">{t("chat.groupNameLabel")}</Label>
            <Input
              id="group-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("chat.groupNamePlaceholder")}
              maxLength={120}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("chat.groupMembersLabel")}</Label>
            <p className="text-xs text-muted-foreground">{t("chat.groupMembersHint")}</p>
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t("chat.groupFilterPlaceholder")}
              className="rounded-xl"
            />
            <div className="max-h-48 overflow-y-auto rounded-xl border">
              {loadingFriends ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("chat.loading")}
                </div>
              ) : visible.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("chat.noMutualMatches")}
                </p>
              ) : (
                <ul className="divide-y">
                  {visible.map((f) => (
                    <li key={f.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/60",
                          selected.has(f.id) && "bg-primary/5"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(f.id)}
                          onChange={() => toggle(f.id)}
                          className="size-4 rounded border-input"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {f.name}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            {t("chat.groupCancel")}
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={submitting || !title.trim() || selected.size < 1}
            onClick={() => void submit()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("chat.createGroupBusy")}
              </>
            ) : (
              t("chat.createGroupSubmit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
