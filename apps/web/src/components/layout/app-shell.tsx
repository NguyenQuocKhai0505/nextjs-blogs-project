"use client"

import { ReactNode } from "react"
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
  return (
    <div className="ks-app-shell">
      <Header />

      <div className="relative z-0 mx-auto w-full max-w-[1440px] px-3 pb-20 pt-5 sm:px-6 lg:px-8 md:pb-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)_360px] xl:grid-cols-[300px_minmax(0,1fr)_380px]">
          <aside className="hidden md:block">
            <div className="sticky top-[96px]">
              <LeftSidebar />
            </div>
          </aside>

          <main className={cn("min-w-0", containerClassName)}>{children}</main>

          <aside className="hidden lg:block">
            <div className="sticky top-[96px]">
              <RightRail />
            </div>
          </aside>
        </div>
      </div>

      <PresenceHeartbeat />
      <MobileBottomNav />
      <AiChatWidget />
    </div>
  )
}

