import { PostListProps } from "@/lib/types"
import PostCard from "./post-card"


function PostList({posts}:PostListProps){
    return(
        <div className="grid gird-cols-1 md:grids-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {
                posts.map(post =>(
                    <PostCard key={post.id} post={post}/>
                ))
            }
        </div>
    )
}
export default PostList