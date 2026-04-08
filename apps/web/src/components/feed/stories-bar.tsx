"use client"

import { cn } from "@/lib/utils"

const stories = [
  { name: "You", active: true },
  { name: "Design", active: false },
  { name: "Dev", active: false },
  { name: "Travel", active: false },
  { name: "Music", active: false },
  { name: "Food", active: false },
]

export default function StoriesBar() {
  return (
    <div className="rounded-2xl border bg-card/50 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Stories</p>
        <p className="text-xs text-muted-foreground">Fresh updates</p>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stories.map(s => (
          <div key={s.name} className="flex w-[76px] shrink-0 flex-col items-center gap-2">
            <div
              className={cn(
                "grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-muted/60 to-muted/20 text-sm font-semibold",
                s.active && "from-primary/30 to-primary/10"
              )}
            >
              {s.name.slice(0, 1).toUpperCase()}
            </div>
            <p className="w-full truncate text-center text-xs text-muted-foreground">{s.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

