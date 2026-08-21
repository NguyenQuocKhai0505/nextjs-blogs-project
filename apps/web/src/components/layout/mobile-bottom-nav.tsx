"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, MessageCircle, User, Clapperboard, Aperture } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import { useReelsOverlay } from "@/components/reels/reels-overlay-provider"

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { t } = useLocale()
  const { openReels } = useReelsOverlay()

  const items = [
    { href: "/", label: t("sidebar.home"), icon: Home, action: "link" as const },
    { href: "/reels", label: t("sidebar.reels"), icon: Clapperboard, action: "reels" as const },
    { href: "/moments", label: t("sidebar.moments"), icon: Aperture, action: "link" as const },
    { href: "/contact", label: t("sidebar.chat"), icon: MessageCircle, action: "link" as const },
    { href: "/profile", label: t("sidebar.profile"), icon: User, action: "link" as const },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto max-w-[420px] px-3">
        <div className="flex items-stretch justify-around rounded-2xl border border-border/80 bg-card/95 px-1 py-1 shadow-lg shadow-black/10 backdrop-blur-md dark:shadow-black/40">
          {items.map((item) => {
            const active =
              item.action === "reels"
                ? false
                : item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            if (item.action === "reels") {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={openReels}
                  className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] text-muted-foreground transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="max-w-full truncate px-0.5">{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] text-muted-foreground transition-colors",
                  active && "bg-primary/12 font-semibold text-primary"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "scale-105")} strokeWidth={active ? 2.4 : 2} />
                <span className="max-w-full truncate px-0.5">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
