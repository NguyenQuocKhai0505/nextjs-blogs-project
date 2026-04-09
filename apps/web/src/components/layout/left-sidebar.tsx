"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  MessageCircle,
  PlusSquare,
  User,
  Bell,
  Info,
} from "lucide-react"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { useLocale } from "@/lib/i18n/locale-context"

export default function LeftSidebar() {
  const pathname = usePathname()
  const { t } = useLocale()

  const nav = useMemo(
    () => [
      { href: "/", label: t("sidebar.home"), icon: Home },
      { href: "/post/create", label: t("sidebar.create"), icon: PlusSquare },
      { href: "/contact", label: t("sidebar.messages"), icon: MessageCircle },
      { href: "/profile", label: t("sidebar.profile"), icon: User },
      { href: "/about", label: t("sidebar.about"), icon: Info },
    ],
    [t]
  )

  return (
    <div className="rounded-2xl border bg-card/50 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="mb-3 flex items-center justify-between px-2">
        <p className="text-sm font-semibold">{t("sidebar.navigation")}</p>
        <div className="flex items-center gap-1 text-muted-foreground">
          <LanguageSwitcher />
          <span className="inline-flex p-1" aria-hidden>
            <Bell className="h-4 w-4 opacity-60" />
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Button
              key={item.href}
              asChild
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 rounded-xl",
                active && "bg-primary/10 text-primary hover:bg-primary/15"
              )}
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl border bg-background/60 p-3">
        <p className="text-sm font-semibold">{t("sidebar.quickActions")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("sidebar.quickActionsHint")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/post/create">{t("sidebar.post")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/contact">{t("sidebar.chat")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
