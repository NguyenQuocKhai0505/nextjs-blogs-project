"use client"

import { PostListProps } from "@/lib/types"
import PostCard from "./post-card"

function PostList({ posts, viewerId = null, viewerRole = null }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="ks-post-enter"
          style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
        >
          <PostCard post={post} viewerId={viewerId} viewerRole={viewerRole} />
        </div>
      ))}
    </div>
  )
}

export default PostList
