"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Sparkles, Users } from "lucide-react"

export default function RightRail() {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <TrendItem title="Build in public" meta="12 new posts today" />
          <TrendItem title="Next.js 15 + React 19" meta="Hot topic" />
          <TrendItem title="Realtime chat" meta="Socket.IO tips" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Suggested</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border bg-background/70 p-2">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Find people to follow</p>
              <p className="text-xs text-muted-foreground">
                Search users and connect with creators.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-2 rounded-xl">
                <Link href="/profile">Discover</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-gradient-to-br from-primary/15 via-background to-background">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Creator mode
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Share updates regularly to grow your audience.
          </p>
          <Button asChild size="sm" className="mt-3 w-full rounded-xl">
            <Link href="/post/create">
              <TrendingUp className="mr-2 h-4 w-4" />
              Create a post
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function TrendItem({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="group rounded-xl border bg-background/60 p-3 transition-colors hover:bg-background/80">
      <p className="text-sm font-medium leading-5">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
    </div>
  )
}

