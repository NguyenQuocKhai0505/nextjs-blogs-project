"use client"

import Link from "next/link"
import { Image as ImageIcon, Video } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLocale } from "@/lib/i18n/locale-context"
import { useMe } from "@/lib/use-me"
import { getAccessToken } from "@/lib/token"

type Props = {
  viewerId: string | null
}

export default function FeedComposerInline({ viewerId }: Props) {
  const { t } = useLocale()
  const hasToken = Boolean(viewerId && getAccessToken())
  const { me } = useMe(hasToken)

  const avatarUrl = me?.avatarUrl ?? null
  const name = me?.name ?? "U"

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <Link
        href="/post/create"
        className="flex items-center gap-3 rounded-full bg-muted/60 px-2 py-1.5 transition-colors hover:bg-muted"
      >
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-sm font-semibold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="flex-1 py-2 text-sm text-muted-foreground">
          {t("composer.whatsOnYourMind")}
        </span>
      </Link>
      <div className="mt-2 flex items-center gap-1 border-t border-border pt-2">
        <Link
          href="/post/create"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <ImageIcon className="h-4 w-4" />
          {t("composer.photo")}
        </Link>
        <Link
          href="/post/create"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <Video className="h-4 w-4" />
          {t("composer.video")}
        </Link>
      </div>
    </div>
  )
}
