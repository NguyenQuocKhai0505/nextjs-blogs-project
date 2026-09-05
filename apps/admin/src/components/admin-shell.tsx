"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  FolderTree,
  Flag,
  LayoutDashboard,
  FileText,
  LogOut,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { clearAccessToken } from "@/lib/token"
import { useAdminSession } from "@/components/admin-guard"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/users", label: "Users", icon: Users },
  { href: "/reports", label: "Reports", icon: Flag },
] as const

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { me } = useAdminSession()

  function logout() {
    clearAccessToken()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-panel)]">
        <div className="flex items-center gap-3 border-b border-[var(--admin-border)] px-4 py-4">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-1 ring-sky-400/30">
            <Image src="/logo.png" alt="Ksocial" fill className="object-cover" />
          </div>
          <div>
            <p className="admin-brand text-sm font-semibold text-white">Ksocial</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-sky-400">
              Admin
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--admin-accent-dim)] text-sky-300"
                    : "text-[var(--admin-muted)] hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-[var(--admin-border)] p-3">
          {me ? (
            <div className="rounded-xl bg-black/20 px-3 py-2.5">
              <p className="truncate text-sm font-medium text-white">{me.name}</p>
              <p className="truncate text-[11px] text-[var(--admin-muted)]">{me.email}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-sky-400">
                {me.role}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--admin-muted)] transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/85 px-6 py-3 backdrop-blur-md md:px-8">
          <p className="text-xs text-[var(--admin-muted)]">
            Control plane · API via{" "}
            <code className="text-sky-400/90">NEXT_PUBLIC_API_URL</code>
          </p>
        </header>
        <main className="min-w-0 flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
