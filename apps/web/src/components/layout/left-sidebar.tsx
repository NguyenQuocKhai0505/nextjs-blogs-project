"use client"

import Link from "next/link"
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
  Compass,
} from "lucide-react"

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/post/create", label: "Create", icon: PlusSquare },
  { href: "/contact", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/about", label: "About", icon: Info },
]

export default function LeftSidebar() {
  const pathname = usePathname()

  return (
    <div className="rounded-2xl border bg-card/50 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="mb-3 flex items-center justify-between px-2">
        <p className="text-sm font-semibold">Navigation</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Compass className="h-4 w-4" />
          <Bell className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-1">
        {nav.map(item => {
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
        <p className="text-sm font-semibold">Quick actions</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Post something new or jump into messages.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/post/create">Post</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href="/contact">Chat</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

