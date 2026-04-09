"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { authFetch } from "@/lib/auth-fetch"
import { apiUrl } from "@/lib/api"
import { getAccessToken } from "@/lib/token"
import type { PostCategory } from "@/lib/types"
import { useMe } from "@/lib/use-me"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { confirmToast } from "@/lib/confirm-toast"

export default function AdminCategoriesPage() {
  const router = useRouter()
  const [hasToken, setHasToken] = useState(false)
  useEffect(() => setHasToken(!!getAccessToken()), [])
  const { me, loading } = useMe(hasToken)

  const isAdmin = me?.role === "ADMIN"

  const [categories, setCategories] = useState<PostCategory[]>([])
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [sortOrder, setSortOrder] = useState("0")

  const canRender = useMemo(() => !loading && hasToken, [loading, hasToken])

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

  useEffect(() => {
    if (canRender && !isAdmin) {
      router.replace("/")
    }
  }, [canRender, isAdmin, router])

  const create = async () => {
    setBusy(true)
    try {
      const res = await authFetch("/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug.trim() ? slug.trim() : undefined,
          sortOrder: Number.parseInt(sortOrder || "0", 10) || 0,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Request failed")
      toast.success("Category created")
      setName("")
      setSlug("")
      setSortOrder("0")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed")
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: number) => {
    const ok = await confirmToast({
      title: "Delete this category?",
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!ok) return
    setBusy(true)
    try {
      const res = await authFetch(`/categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Request failed")
      toast.success("Category deleted")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  if (!hasToken) return null

  return (
    <main className="py-10">
      <div className="mx-auto max-w-3xl space-y-4 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Manage categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={busy} />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  disabled={busy}
                  inputMode="numeric"
                />
              </div>
            </div>
            <Button onClick={() => void create()} disabled={busy || !name.trim()}>
              Create category
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.slug}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => void remove(c.id)} disabled={busy}>
                  Delete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

