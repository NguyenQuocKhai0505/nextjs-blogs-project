"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, PlusSquare, MessageCircle, User, Clapperboard } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { t } = useLocale()

  const items = [
    { href: "/", label: t("sidebar.home"), icon: Home },
    { href: "/reels", label: t("sidebar.reels"), icon: Clapperboard },
    { href: "/post/create", label: t("sidebar.post"), icon: PlusSquare },
    { href: "/contact", label: t("sidebar.chat"), icon: MessageCircle },
    { href: "/profile", label: t("sidebar.profile"), icon: User },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/50 bg-background/75 backdrop-blur-xl md:hidden supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto grid max-w-[520px] grid-cols-5 px-1.5 py-1.5">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10px] text-muted-foreground transition-colors",
                active && "ks-nav-pill font-medium"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-105")} />
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
