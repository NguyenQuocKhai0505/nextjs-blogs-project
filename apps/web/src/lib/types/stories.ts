export type StoryMediaType = "IMAGE" | "VIDEO" | "TEXT"

export type StoryUser = {
  id: string
  name: string
  avatarUrl: string | null
}

export type StoryItem = {
  id: number
  mediaType: StoryMediaType
  imageUrl: string | null
  videoUrl: string | null
  textContent: string | null
  backgroundColor: string | null
  createdAt: string
  expiresAt: string
  viewed: boolean
  reactionCount?: number
}

export type StoryGroup = {
  user: StoryUser
  stories: StoryItem[]
  isOwn: boolean
  hasUnviewed: boolean
}

export type StoryFeed = {
  groups: StoryGroup[]
}

export const STORY_TEXT_BACKGROUNDS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
] as const
