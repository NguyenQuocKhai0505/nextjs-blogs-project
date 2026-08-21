"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Header from "./header"
import LeftSidebar from "./left-sidebar"
import RightRail from "./right-rail"
import { PresenceHeartbeat } from "./presence-heartbeat"
import MobileBottomNav from "./mobile-bottom-nav"
import { AiChatWidget } from "@/components/ai/ai-chat-widget"

export default function AppShell({
  children,
  containerClassName,
}: {
  children: ReactNode
  containerClassName?: string
}) {
  const pathname = usePathname()
  const hideRail = pathname === "/contact" || pathname.startsWith("/contact/")

  return (
    <div className="ks-app-shell">
      <Header />

      <div className="relative z-0 mx-auto w-full max-w-[1280px] px-3 pb-24 pt-4 sm:px-5 md:pb-6 lg:px-6">
        <div
          className={cn(
            "grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)] lg:gap-6",
            hideRail
              ? "lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]"
              : "lg:grid-cols-[220px_minmax(0,680px)_280px] xl:grid-cols-[240px_minmax(0,680px)_300px] lg:justify-center"
          )}
        >
          <aside className="hidden md:block">
            <div className="sticky top-[72px]">
              <LeftSidebar />
            </div>
          </aside>

          <main
            className={cn(
              "mx-auto min-w-0 w-full lg:mx-0",
              hideRail ? "max-w-none" : "max-w-[680px]",
              containerClassName
            )}
          >
            {children}
          </main>

          {!hideRail && (
            <aside className="hidden lg:block">
              <div className="sticky top-[72px]">
                <RightRail />
              </div>
            </aside>
          )}
        </div>
      </div>

      <PresenceHeartbeat />
      <MobileBottomNav />
      <AiChatWidget />
    </div>
  )
}
