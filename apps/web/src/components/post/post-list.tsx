import { PostListProps } from "@/lib/types"
import PostCard from "./post-card"


function PostList({ posts, viewerId = null, viewerRole = null }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} viewerId={viewerId} viewerRole={viewerRole} />
      ))}
    </div>
  )
}
export default PostList