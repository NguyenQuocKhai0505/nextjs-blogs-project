import { PostContentProps } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card"
import { formatDate } from "@/lib/utils"
import { Button } from "../ui/button"
import Link from "next/link"
import { DeletePostButton } from "./delete-post-button"

function PostContent({post,isAuthor = false}: PostContentProps){
    return(
        <div className="space-y-6">
            {/* 1.Header Card- Title, Author, Date */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        {/* Left side: Title and author info */}
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">
                                {post?.title}
                            </h1>
                            <CardDescription className="text-base">
                                By <span className="font-semibold">{post?.author.name}</span> • {formatDate(post?.createdAt)}
                            </CardDescription>
                            {post.description && (
                                <p className="text-lg text-muted-foreground mt-4">
                                    {post?.description}
                                </p>
                            )}
                        </div>
                        {/* Right side: Edit & Delete Buttons - Only display when isAuthor = true */}
                        {isAuthor && (
                            <div className="flex-shrink-0 flex gap-2">
                                <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
                                    <Link href={`/post/edit/${post.slug}`}>
                                        Edit Post
                                    </Link>
                                </Button>
                                <DeletePostButton postId={post.id}/>
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>
            {/* 3. Content Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="prose prose-lg max-w-none">
                        <div className="whitespace-pre-wrap text-foreground">
                            {post?.content}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
export default PostContent