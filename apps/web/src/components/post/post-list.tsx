import { PostListProps } from "@/lib/types"
import PostCard from "./post-card"


function PostList({posts}:PostListProps){
    return(
        <div className="space-y-4">
            {
                posts.map(post =>(
                    <PostCard key={post.id} post={post}/>
                ))
            }
        </div>
    )
}
export default PostList