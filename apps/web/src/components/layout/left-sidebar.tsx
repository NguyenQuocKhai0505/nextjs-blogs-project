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
  Info,
  Clapperboard,
  Bookmark,
} from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"

export default function LeftSidebar() {
  const pathname = usePathname()
  const { t } = useLocale()

  const nav = useMemo(
    () => [
      { href: "/", label: t("sidebar.home"), icon: Home },
      { href: "/reels", label: t("sidebar.reels"), icon: Clapperboard },
      { href: "/saved", label: t("sidebar.saved"), icon: Bookmark },
      { href: "/contact", label: t("sidebar.messages"), icon: MessageCircle },
      { href: "/profile", label: t("sidebar.profile"), icon: User },
      { href: "/about", label: t("sidebar.about"), icon: Info },
    ],
    [t]
  )

  return (
    <div className="ks-glass-panel flex flex-col p-3">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("sidebar.navigation")}
      </p>

      <div className="space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                "relative w-full justify-start gap-3 rounded-xl border-l-[3px] border-transparent pl-3",
                active &&
                  "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
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

      <div className="mt-4 pt-2">
        <Button asChild className="ks-brand-gradient w-full rounded-xl border-0 text-primary-foreground shadow-md shadow-primary/20">
          <Link href="/post/create">
            <PlusSquare className="mr-2 h-4 w-4" />
            {t("sidebar.create")}
          </Link>
        </Button>
      </div>
    </div>
  )
}
