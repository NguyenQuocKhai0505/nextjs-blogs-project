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
import { PreferenceControls } from "@/components/preference-controls"
import { useLocale } from "@/lib/i18n/locale-context"

const NAV = [
  { href: "/", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/categories", key: "nav.categories", icon: FolderTree },
  { href: "/posts", key: "nav.posts", icon: FileText },
  { href: "/users", key: "nav.users", icon: Users },
  { href: "/reports", key: "nav.reports", icon: Flag },
] as const

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { me } = useAdminSession()
  const { t } = useLocale()

  function logout() {
    clearAccessToken()
    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="flex min-h-dvh bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-panel)]">
        <div className="flex items-center gap-3 border-b border-[var(--admin-border)] px-4 py-4">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl ring-1 ring-sky-400/30">
            <Image src="/logo.png" alt="Ksocial" fill className="object-cover" />
          </div>
          <div>
            <p className="admin-brand text-sm font-semibold text-[var(--admin-text)]">
              Ksocial
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-sky-500">
              {t("nav.admin")}
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
                    ? "bg-[var(--admin-accent-dim)] text-sky-600"
                    : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(item.key)}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-[var(--admin-border)] p-3">
          <PreferenceControls />
          {me ? (
            <div className="rounded-xl bg-[var(--admin-soft)] px-3 py-2.5">
              <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                {me.name}
              </p>
              <p className="truncate text-[11px] text-[var(--admin-muted)]">
                {me.email}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-sky-500">
                {me.role}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--admin-muted)] transition hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <LogOut className="h-4 w-4" />
            {t("common.logout")}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 md:p-8">{children}</main>
    </div>
  )
}
