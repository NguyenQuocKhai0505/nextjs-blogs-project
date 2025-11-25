"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent } from "../ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import Link from "next/link"
import { createCommentAction, deleteCommentAction, getPostCommentsAction } from "@/actions/comment-action"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { Trash2, Send } from "lucide-react"

interface Comment {
    id: number
    content: string
    authorId: string
    author: {
        id: string
        name: string
        email: string
        avatar?: string | null
    }
    createdAt: Date
    updatedAt: Date
}

interface CommentSectionProps {
    postId: number
    initialCommentCount: number
    userId?: string  // Current user ID
}

export function CommentSection({postId,initialCommentCount,userId}: CommentSectionProps)
{
    const [comments,setComments] = useState<Comment[]>([])
    const [commentCount,setCommentCount]= useState(initialCommentCount)
    const [content, setContent]= useState("")
    const [isPending,startTransition] = useTransition()
    const [loading,setLoading] = useState(false)

    //Load comments khi component mount 
    useEffect(()=>{
        fetchComments()
    },[postId])

    const fetchComments = async () =>{
        setLoading(true)
        try{
            const result = await getPostCommentsAction(postId)
            if(result.success && result.comments){
                setComments(result.comments as Comment[])
            }
        }catch(error){
            console.error("Error fetching comments: ",error)
        }finally{
            setLoading(false)
        }
    }

    const handleSubmit = (e:React.FormEvent) =>{
        e.preventDefault()

        if(!content.trim()){
            toast.error("Comment cannot be empty")
            return
        }
        if(!userId){
            toast.error("You must be logged in to comment")
            return
        }
        startTransition(async ()=>{
            const result = await createCommentAction(postId,content.trim())

            if(result.success){
                setContent("")
                toast.success(result.message)

                //Reload comment
                fetchComments()
                setCommentCount(prev => prev +1)
            }else{
                toast.error(result.message)
            }
        })
    }
    const handleDelete = (commentId:number) => {
        startTransition(async()=>{
            const result = await deleteCommentAction(commentId)

            if(result.success){
                toast.success(result.message)

                //Remove comment from state
                setComments(prev => prev.filter(c => c.id !== commentId))
                setCommentCount(prev => prev - 1)
            } else {
                toast.error(result.message)
            }
        })
    }
    return(
        <Card>
            <CardContent className="pt-6 space-y-6">
                {/* Comment count */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        Comments ({commentCount})
                    </h3>
                </div>
                {/* Comment form */}
                {
                    userId ? (
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                            value={content}
                            onChange={(e)=>setContent(e.target.value)}
                            placeholder="Write a comment..."
                            maxLength={1000}
                            disabled={isPending}
                            className="flex-1"
                            />
                            <Button
                            type="submit"
                            disabled={isPending || !content.trim()}
                            size="sm"
                            >
                                <Send className="h-4 w-4"/>
                            </Button>
                        </form>
                    ):(
                        <p className="text-sm text-muted-foreground">
                            Please log in to comment
                        </p>
                    )}
                    {/* Comment List */}
                    <div className="space-y-4">
                        {
                            loading?(
                                <p className="text-center text-muted-foreground py-4">Loading comments...</p>    
                            ): comments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No comments yet. Be the first comment</p>
                            ):(
                                comments.map((comment)=>(
                                    <div key={comment.id} className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <Avatar>
                                            {comment.author.avatar && (
                                                <AvatarImage src={comment.author.avatar} alt={comment.author.name}/>
                                            )}
                                            <AvatarFallback>
                                                {comment.author.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        <Link href={`/profile/${comment.author.id}`} className="hover:underline">
                                                            {comment.author.name}
                                                        </Link>
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                                                        {comment.content}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatDate(comment.createdAt)}
                                                    </p>
                                                </div>
                                                {/* Delete Button - Only show if user is the author */}
                                                {userId === comment.authorId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                        onClick={() => handleDelete(comment.id)}
                                                        disabled={isPending}
                                                        type="button"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        }
                    </div>
            </CardContent>
        </Card>
    )
}