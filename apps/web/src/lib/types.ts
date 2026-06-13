export type PostAuthor = {
  id: string
  name: string
  avatarUrl: string | null
}

export type PostCategory = {
  id: number
  name: string
  slug: string
  sortOrder?: number
}

export type FeedPost = {
  id: number
  title: string
  description: string
  slug: string
  content?: string
  imageUrls?: string | string[] | null
  videoUrls?: string | string[] | null
  authorId?: string
  categoryId?: number | null
  category?: PostCategory | null
  likeCount?: number
  commentCount?: number
  shareCount?: number
  createdAt: Date | string
  author: PostAuthor
}

export type PostCardProps = {
  post: FeedPost
  viewerId?: string | null
  viewerRole?: "USER" | "ADMIN" | null
}

export type PostListProps = {
  posts: FeedPost[]
  viewerId?: string | null
  viewerRole?: "USER" | "ADMIN" | null
}
