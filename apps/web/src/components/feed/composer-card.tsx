"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenSquare, Image as ImageIcon, Video } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"

export default function ComposerCard() {
  const { t } = useLocale()

  return (
    <Card className="rounded-2xl bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("composer.title")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("composer.subtitle")}</p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/post/create">
              <PenSquare className="mr-2 h-4 w-4" />
              {t("composer.createPost")}
            </Link>
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button variant="outline" className="justify-start rounded-xl" asChild>
            <Link href="/post/create">
              <ImageIcon className="mr-2 h-4 w-4" />
              {t("composer.photo")}
            </Link>
          </Button>
          <Button variant="outline" className="justify-start rounded-xl" asChild>
            <Link href="/post/create">
              <Video className="mr-2 h-4 w-4" />
              {t("composer.video")}
            </Link>
          </Button>
          <Button
            variant="outline"
            className="hidden justify-start rounded-xl sm:flex"
            asChild
          >
            <Link href="/post/create">
              <PenSquare className="mr-2 h-4 w-4" />
              {t("composer.text")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
