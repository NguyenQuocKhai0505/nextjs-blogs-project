import { PostCardProps } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

function PostCard({post}:PostCardProps){
    return(
       <Card className="rounded-2xl bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-5">{post.author.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
                  </div>
                </div>
                <Link href={`/post/${post.slug}`} className="group mt-2 block">
                    <CardTitle className="line-clamp-2 text-xl transition-colors group-hover:text-primary">
                      {post.title}
                    </CardTitle>
                </Link>
                <CardDescription className="line-clamp-2">{post.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/post/${post.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View details
                </Link>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">Community post</span>
              </div>
            </CardContent>
       </Card>
    )
}
export default PostCard