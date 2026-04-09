import { PostListProps } from "@/lib/types"
import PostCard from "./post-card"


function PostList({ posts, viewerId = null }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} viewerId={viewerId} />
      ))}
    </div>
  )
}
export default PostList