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
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/80 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-[520px] grid-cols-5 px-2 py-2">
        {items.map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] text-muted-foreground",
                active && "text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

