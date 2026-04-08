"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { useNotification } from "@/contexts/notification-context"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getNotificationText, getNotificationNavigatePath } from "@/lib/notifications/utils"

export function NotificationBell() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    markAsRead,
    refreshNotifications,
  } = useNotification()
  const [open, setOpen] = useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      refreshNotifications().catch(() => {})
      if (unreadCount > 0) {
        markAllAsRead().catch(() => {})
      }
    }
  }

  const handleNavigate = (id: number, path: string) => {
    markAsRead([id]).catch(() => {})
    router.push(path)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full border border-transparent hover:border-primary/40">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {!isLoading && unreadCount === 0 && (
            <span className="text-xs text-muted-foreground">All caught up</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No new notifications</div>
        ) : (
          notifications.map(notification => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "flex flex-col gap-1 py-3 focus:bg-muted",
                notification.read ? "opacity-60" : ""
              )}
              onClick={() => handleNavigate(notification.id, getNotificationNavigatePath(notification))}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={notification.actor.avatar ?? ""} alt={notification.actor.name} />
                  <AvatarFallback>{notification.actor.name?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight">{getNotificationText(notification)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}