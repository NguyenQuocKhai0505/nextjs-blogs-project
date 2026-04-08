"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, PlusSquare, MessageCircle, User } from "lucide-react"

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/post/create", label: "Post", icon: PlusSquare },
  { href: "/contact", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Me", icon: User },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/80 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-[520px] grid-cols-4 px-4 py-2">
        {items.map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs text-muted-foreground",
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

