export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY"

export const REACTION_TYPES: ReactionType[] = [
  "LIKE",
  "LOVE",
  "HAHA",
  "WOW",
  "SAD",
  "ANGRY",
]

export const REACTION_EMOJI: Record<ReactionType, string> = {
  LIKE: "👍",
  LOVE: "❤️",
  HAHA: "😂",
  WOW: "😮",
  SAD: "😢",
  ANGRY: "😡",
}

export const REACTION_LABEL: Record<ReactionType, string> = {
  LIKE: "Like",
  LOVE: "Love",
  HAHA: "Haha",
  WOW: "Wow",
  SAD: "Sad",
  ANGRY: "Angry",
}

export type ReactionSummary = Partial<Record<ReactionType, number>>

export type ReactionStatus = {
  reaction: ReactionType | null
  reactionCount: number
  summary: ReactionSummary
}
