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
  Aperture,
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
      { href: "/moments", label: t("sidebar.moments"), icon: Aperture, action: "link" as const },
      { href: "/saved", label: t("sidebar.saved"), icon: Bookmark, action: "link" as const },
      { href: "/contact", label: t("sidebar.messages"), icon: MessageCircle, action: "link" as const },
      { href: "/profile", label: t("sidebar.profile"), icon: User, action: "link" as const },
      { href: "/about", label: t("sidebar.about"), icon: Info, action: "link" as const },
    ],
    [t]
  )

  return (
    <nav className="flex flex-col gap-1">
      <div className="space-y-0.5">
        {nav.map((item) => {
          const active =
            item.action === "reels"
              ? false
              : item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          const className = cn(
            "h-11 w-full justify-start gap-3 rounded-xl px-3 text-[15px] font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground",
            active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
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
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
                {item.label}
              </Button>
            )
          }

          return (
            <Button key={item.href} asChild variant="ghost" className={className}>
              <Link href={item.href}>
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 2} />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </div>

      <div className="mt-3 px-1">
        <Button
          asChild
          className="h-11 w-full rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
        >
          <Link href="/post/create">
            <PlusSquare className="mr-2 h-5 w-5" />
            {t("sidebar.create")}
          </Link>
        </Button>
      </div>
    </nav>
  )
}
