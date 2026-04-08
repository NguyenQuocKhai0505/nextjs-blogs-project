"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenSquare, Image as ImageIcon, Video } from "lucide-react"

export default function ComposerCard() {
  return (
    <Card className="rounded-2xl bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Create something</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Share an update with text, photos, or videos.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/post/create">
              <PenSquare className="mr-2 h-4 w-4" />
              Create post
            </Link>
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button variant="outline" className="justify-start rounded-xl" asChild>
            <Link href="/post/create">
              <ImageIcon className="mr-2 h-4 w-4" />
              Photo
            </Link>
          </Button>
          <Button variant="outline" className="justify-start rounded-xl" asChild>
            <Link href="/post/create">
              <Video className="mr-2 h-4 w-4" />
              Video
            </Link>
          </Button>
          <Button
            variant="outline"
            className="hidden justify-start rounded-xl sm:flex"
            asChild
          >
            <Link href="/post/create">
              <PenSquare className="mr-2 h-4 w-4" />
              Text
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

