import PostContent from "@/components/post/post-content"
import { auth } from "@/lib/auth"
import { getPostBySlug } from "@/lib/db/queries"
import { checkUserLiked } from "@/actions/like-actions"
import { headers } from "next/headers"
import { notFound } from "next/navigation"

async function CreatPostPage({
    params,
}:{
    params: Promise<{slug:string}>
}){
    const {slug} = await params
    const post = await getPostBySlug(slug)
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if(!post){
        notFound()
    }

    //get author info
    const isAuthor = session?.user?.id === post.authorId
    
    // Check user đã like post chưa
    const initialLiked = await checkUserLiked(post.id)

    return(
        <main className="py-10">
            <div className="max-w-4xl mx-auto">
                <PostContent 
                    post={post} 
                    isAuthor={isAuthor}
                    initialLiked={initialLiked}
                    userId={session?.user?.id}
                />
            </div>
        </main>
    )
}
export default CreatPostPage