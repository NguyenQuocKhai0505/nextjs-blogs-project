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
import { useReelsOverlay } from "@/components/reels/reels-overlay-provider"

export default function LeftSidebar() {
  const pathname = usePathname()
  const { t } = useLocale()
  const { openReels } = useReelsOverlay()

  const nav = useMemo(
    () => [
      { href: "/", label: t("sidebar.home"), icon: Home, action: "link" as const },
      { href: "/reels", label: t("sidebar.reels"), icon: Clapperboard, action: "reels" as const },
      { href: "/saved", label: t("sidebar.saved"), icon: Bookmark, action: "link" as const },
      { href: "/contact", label: t("sidebar.messages"), icon: MessageCircle, action: "link" as const },
      { href: "/profile", label: t("sidebar.profile"), icon: User, action: "link" as const },
      { href: "/about", label: t("sidebar.about"), icon: Info, action: "link" as const },
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
          const active = item.action === "reels" ? false : pathname === item.href
          const Icon = item.icon
          const className = cn(
            "relative w-full justify-start gap-3 rounded-xl border-l-[3px] border-transparent pl-3",
            active &&
              "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          )

          if (item.action === "reels") {
            return (
              <Button
                key={item.href}
                type="button"
                variant="ghost"
                className={className}
                onClick={openReels}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          }

          return (
            <Button key={item.href} asChild variant="ghost" className={className}>
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </div>

      <div className="mt-4 pt-2">
        <Button asChild className="w-full rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90">
          <Link href="/post/create">
            <PlusSquare className="mr-2 h-4 w-4" />
            {t("sidebar.create")}
          </Link>
        </Button>
      </div>
    </div>
  )
}
