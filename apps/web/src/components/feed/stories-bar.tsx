"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { apiUrl } from "@/lib/api"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import type { StoryFeed, StoryGroup } from "@/lib/types/stories"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n/locale-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StoryCreateDialog } from "@/components/feed/story-create-dialog"
import { StoryViewer } from "@/components/feed/story-viewer"

type Props = {
  viewerId: string | null
}

function StoryRing({
  label,
  avatarUrl,
  name,
  hasUnviewed,
  hasStories,
  isOwn,
  onClick,
}: {
  label: string
  avatarUrl: string | null
  name: string
  hasUnviewed: boolean
  hasStories: boolean
  isOwn: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[76px] shrink-0 flex-col items-center gap-2"
    >
      <div
        className={cn(
          "relative rounded-full p-[2.5px]",
          hasStories && hasUnviewed
            ? "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600"
            : hasStories
              ? "bg-muted-foreground/30"
              : isOwn
                ? "border-2 border-dashed border-muted-foreground/40 bg-transparent"
                : "bg-muted-foreground/20"
        )}
      >
        <div className="relative grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-full bg-background sm:h-14 sm:w-14">
          {isOwn && !hasStories ? (
            <Plus className="h-6 w-6 text-muted-foreground" />
          ) : (
            <Avatar className="h-full w-full">
              <AvatarImage src={avatarUrl ?? undefined} alt={name} />
              <AvatarFallback className="text-sm font-semibold">
                {name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          {isOwn && hasStories && (
            <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground">
              <Plus className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
      <p className="w-full truncate text-center text-xs text-muted-foreground">{label}</p>
    </button>
  )
}

export default function StoriesBar({ viewerId }: Props) {
  const { t } = useLocale()
  const [groups, setGroups] = useState<StoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerStartIndex, setViewerStartIndex] = useState(0)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const token = getAccessToken()
      const res = token
        ? await authFetch("/stories/feed", { cache: "no-store" })
        : await fetch(apiUrl("/stories/feed"), { cache: "no-store" })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as StoryFeed
      setGroups(Array.isArray(data.groups) ? data.groups : [])
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed, viewerId])

  function openCreate() {
    if (!getAccessToken()) {
      toast.error(t("stories.loginRequired"))
      return
    }
    setCreateOpen(true)
  }

  function openGroup(displayIndex: number) {
    const g = displayGroups[displayIndex]
    if (!g) return
    if (g.isOwn && g.stories.length === 0) {
      openCreate()
      return
    }
    const realIndex = groups.findIndex((x) => x.user.id === g.user.id)
    if (realIndex < 0) return
    setViewerStartIndex(realIndex)
    setViewerOpen(true)
  }

  const ownGroup = groups.find((g) => g.isOwn)
  const otherGroups = groups.filter((g) => !g.isOwn)

  const displayGroups: (StoryGroup | { isOwn: true; user: StoryGroup["user"]; stories: []; hasUnviewed: false })[] =
    viewerId
      ? [
          ownGroup ?? {
            isOwn: true as const,
            user: { id: viewerId, name: t("stories.you"), avatarUrl: null },
            stories: [],
            hasUnviewed: false,
          },
          ...otherGroups,
        ]
      : otherGroups

  return (
    <>
      <div className="ks-glass-panel p-2.5 sm:p-3">
        <p className="text-xs font-semibold sm:text-sm">{t("stories.title")}</p>

        <div className="mt-2 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 w-[68px] shrink-0 animate-pulse rounded-full bg-muted/50"
              />
            ))
          ) : displayGroups.length === 0 ? (
            <button
              type="button"
              onClick={openCreate}
              className="flex w-[76px] shrink-0 flex-col items-center gap-2"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-muted-foreground/40">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{t("stories.add")}</p>
            </button>
          ) : (
            displayGroups.map((g, index) => (
              <StoryRing
                key={g.user.id}
                label={g.isOwn ? t("stories.you") : g.user.name}
                avatarUrl={g.user.avatarUrl}
                name={g.user.name}
                hasUnviewed={g.hasUnviewed}
                hasStories={g.stories.length > 0}
                isOwn={g.isOwn}
                onClick={() => openGroup(index)}
              />
            ))
          )}
        </div>
      </div>

      <StoryCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void loadFeed()}
      />

      {viewerOpen && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          startGroupIndex={viewerStartIndex}
          viewerId={viewerId}
          onClose={() => setViewerOpen(false)}
          onRefresh={() => void loadFeed()}
          onAddStory={() => {
            setViewerOpen(false)
            openCreate()
          }}
        />
      )}
    </>
  )
}
