export type ReelAuthor = {
  id: string
  name: string
  avatarUrl: string | null
}

export type ReelItem = {
  id: number
  videoUrl: string
  caption: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  author: ReelAuthor
}

export type ReelFeed = {
  items: ReelItem[]
  nextCursor: number | null
}
