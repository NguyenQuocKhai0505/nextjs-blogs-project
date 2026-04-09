"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { PostCategory } from "@/lib/types"
import { apiUrl } from "@/lib/api"
import { authFetch } from "@/lib/auth-fetch"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { confirmToast } from "@/lib/confirm-toast"

type Mode = "create" | "edit"

export default function CategoriesBar({ viewerRole }: { viewerRole: "USER" | "ADMIN" | null }) {
  const isAdmin = viewerRole === "ADMIN"
  const [categories, setCategories] = useState<PostCategory[]>([])
  const [busy, setBusy] = useState(false)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("create")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [sortOrder, setSortOrder] = useState("0")

  const title = useMemo(() => (mode === "create" ? "Create category" : "Edit category"), [mode])

  const load = async () => {
    const res = await fetch(apiUrl("/categories"), { cache: "no-store" })
    const data = (await res.json().catch(() => [])) as unknown
    if (!Array.isArray(data)) return setCategories([])
    const parsed: PostCategory[] = data
      .filter((r): r is Record<string, unknown> => r != null && typeof r === "object")
      .map((r) => ({
        id: Number(r.id),
        name: String(r.name ?? ""),
        slug: String(r.slug ?? ""),
        sortOrder: Number(r.sortOrder ?? 0),
      }))
      .filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name.length > 0)
    setCategories(parsed)
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = () => {
    setMode("create")
    setEditingId(null)
    setName("")
    setSlug("")
    setSortOrder("0")
    setOpen(true)
  }

  const openEdit = (c: PostCategory) => {
    setMode("edit")
    setEditingId(c.id)
    setName(c.name)
    setSlug(c.slug)
    setSortOrder(String(c.sortOrder ?? 0))
    setOpen(true)
  }

  const submit = async () => {
    if (!isAdmin) return
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    setBusy(true)
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() ? slug.trim() : undefined,
        sortOrder: Number.parseInt(sortOrder || "0", 10) || 0,
      }
      const res =
        mode === "create"
          ? await authFetch("/categories", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await authFetch(`/categories/${editingId}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message ?? "Request failed")
      }
      toast.success(mode === "create" ? "Category created" : "Category updated")
      setOpen(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: number) => {
    if (!isAdmin) return
    const ok = await confirmToast({
      title: "Delete this category?",
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!ok) return
    setBusy(true)
    try {
      const res = await authFetch(`/categories/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message ?? "Request failed")
      }
      toast.success("Category deleted")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="rounded-2xl border bg-card/50 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Categories</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-xl"
              onClick={() => scrollerRef.current?.scrollBy({ left: -260, behavior: "smooth" })}
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-xl"
              onClick={() => scrollerRef.current?.scrollBy({ left: 260, behavior: "smooth" })}
              aria-label="Scroll categories right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {isAdmin ? (
              <Button size="sm" variant="outline" className="rounded-xl" onClick={openCreate} disabled={busy}>
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            ) : null}
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="ks-scrollbar-x mt-3 flex gap-2 overflow-x-auto pb-2 pr-1 [scrollbar-width:thin]"
        >
          {categories.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group relative flex shrink-0 items-center gap-2 rounded-full border bg-background/60 px-3 py-1.5 text-sm",
                "hover:bg-background/80"
              )}
              title={c.slug}
            >
              <span className="max-w-[180px] truncate">{c.name}</span>

              {isAdmin ? (
                <>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full border bg-background/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    onClick={() => openEdit(c)}
                    disabled={busy}
                    aria-label="Edit category"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="ml-1 h-7 w-7 rounded-full text-destructive opacity-80 hover:opacity-100"
                    onClick={() => void remove(c.id)}
                    disabled={busy}
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-slug">Slug (optional)</Label>
              <Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={busy} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-sort">Sort order</Label>
              <Input
                id="cat-sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={busy}
                inputMode="numeric"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={busy} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={() => void submit()} disabled={busy} className="rounded-xl">
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

