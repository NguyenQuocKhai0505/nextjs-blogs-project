import { notFound } from "next/navigation"

import { apiUrl } from "@/lib/api"
import { getAccessTokenFromCookies } from "@/lib/server-token"
import PostDetailClient, {
  type PostDetailPayload,
} from "@/components/post/post-detail-client"

async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const token = await getAccessTokenFromCookies()
  const me = token
    ? await fetch(apiUrl("/me"), {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    : null

  const post = await fetch(apiUrl(`/posts/${encodeURIComponent(slug)}`), {
    cache: "no-store",
  })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)

  if (!post) {
    notFound()
  }

  const isAuthor = me?.id && post?.authorId ? me.id === post.authorId : false
  const isAdmin = me?.role === "ADMIN"
  const canEdit = isAuthor || isAdmin

  const payload: PostDetailPayload = {
    id: post.id,
    title: post.title,
    description: post.description,
    content: post.content,
    slug: post.slug,
    imageUrls: post.imageUrls ?? null,
    videoUrls: post.videoUrls ?? null,
    categoryId: post.categoryId ?? null,
    category:
      post.category && typeof post.category === "object"
        ? {
            id: post.category.id,
            name: post.category.name,
            slug: post.category.slug,
          }
        : null,
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? 0,
    authorId: post.authorId,
    createdAt:
      typeof post.createdAt === "string"
        ? post.createdAt
        : new Date(post.createdAt).toISOString(),
    author: {
      id: post.author?.id ?? post.authorId,
      name: post.author?.name ?? "User",
      avatarUrl: post.author?.avatarUrl ?? null,
    },
  }

  return (
    <main className="py-10">
      <div className="mx-auto max-w-4xl px-4">
        <PostDetailClient post={payload} canEdit={canEdit} viewerId={me?.id ?? null} />
      </div>
    </main>
  )
}

export default PostPage
