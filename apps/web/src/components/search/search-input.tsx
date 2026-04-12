"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "../ui/input"
import { Search, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Card } from "../ui/card"
import { apiUrl } from "@/lib/api"
import { useLocale } from "@/lib/i18n/locale-context"

interface SearchUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

type SearchInputProps = {
  placeholder?: string
}

export function SearchInput({ placeholder = "Search User..." }: SearchInputProps) {
  const { t } = useLocale()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchUser[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlQuery = searchParams.get("q")
    if (urlQuery) setQuery(urlQuery)
  }, [searchParams])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([])
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const qs = new URLSearchParams({
          q: query.trim(),
          limit: "8",
        })
        const response = await fetch(apiUrl(`/search-users?${qs.toString()}`), {
          cache: "no-store",
        })
        if (!response.ok) {
          setResults([])
          setShowResults(false)
          return
        }
        const data = (await response.json()) as unknown
        if (!Array.isArray(data)) {
          setResults([])
          setShowResults(false)
          return
        }
        const users: SearchUser[] = data
          .filter((r): r is Record<string, unknown> => r != null && typeof r === "object")
          .map((r) => ({
            id: String(r.id ?? ""),
            name: String(r.name ?? ""),
            email: String(r.email ?? ""),
            avatarUrl: r.avatarUrl == null ? null : String(r.avatarUrl),
          }))
          .filter((u) => u.id.length > 0 && u.name.length > 0)
        setResults(users)
        setShowResults(users.length > 0)
      } catch {
        setResults([])
        setShowResults(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/discover?q=${encodeURIComponent(query.trim())}`)
      setShowResults(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="relative w-full max-w-sm" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          onFocus={() => query.trim() && results.length > 0 && setShowResults(true)}
          aria-label={placeholder}
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </form>
      {showResults && results.length > 0 ? (
        <Card className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto shadow-lg">
          <div className="space-y-2 p-2">
            {results.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${encodeURIComponent(user.id)}`}
                onClick={() => {
                  setShowResults(false)
                  setQuery("")
                }}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
              >
                <Avatar className="h-10 w-10">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </Link>
            ))}
            <Link
              href={`/discover?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setShowResults(false)}
              className="block p-2 text-center text-sm text-primary hover:underline"
            >
              {t("header.searchViewAll")}
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
