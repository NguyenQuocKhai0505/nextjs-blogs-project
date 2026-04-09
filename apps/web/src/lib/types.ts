export type PostAuthor = {
  id: string
  name: string
  avatarUrl: string | null
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
  likeCount?: number
  commentCount?: number
  createdAt: Date | string
  author: PostAuthor
}

export type PostCardProps = {
  post: FeedPost
  viewerId?: string | null
}

export type PostListProps = {
  posts: FeedPost[]
  viewerId?: string | null
}
