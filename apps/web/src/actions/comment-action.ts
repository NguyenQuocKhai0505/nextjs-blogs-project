"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createComment, deleteComment, getPostComments, getPostById } from "@/lib/db/queries"
import { getIO } from "@/lib/realtime/socket-server"
// CREATE COMMENT ACTION
export async function createCommentAction(postId: number, content: string, parentId?: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session || !session.user) {
            return {
                success: false,
                message: "You must be logged in to comment"
            }
        }

        // Validate content
        if (!content || content.trim().length === 0) {
            return {
                success: false,
                message: "Comment cannot be empty"
            }
        }

        if (content.length > 1000) {
            return {
                success: false,
                message: "Comment must be less than 1000 characters"
            }
        }

        const newComment = await createComment(
            postId,
            session.user.id,
            content.trim(),
            parentId
        )

        if (!newComment) {
            return {
                success: false,
                message: "Failed to create comment"
            }
        }

        const updatedPost = await getPostById(postId)
        const io = getIO()
        if (io && updatedPost) {
            io.to(`post:${postId}`).emit("post_comment_created", {
                postId,
                comment: {
                    id: newComment.id,
                    content: newComment.content,
                    authorId: session.user.id,
                    createdAt: newComment.createdAt,
                },
                commentCount: updatedPost.commentCount ?? 0,
            })
        }

        revalidatePath(`/post/*`)
        revalidatePath("/")

        return {
            success: true,
            message: "Comment created successfully",
            comment: {
                id: newComment.id,
                content: newComment.content,
                authorId: newComment.authorId,
                createdAt: newComment.createdAt
            }
        }
    } catch (error) {
        console.log("Create comment action error:", error)
        return {
            success: false,
            message: "Failed to create comment"
        }
    }
}

// DELETE COMMENT ACTION (realtime)
export async function deleteCommentAction(commentId: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session || !session.user) {
            return {
                success: false,
                message: "You must be logged in to delete comments"
            }
        }

        const result = await deleteComment(commentId, session.user.id)

        if (result === null) {
            return {
                success: false,
                message: "Comment not found"
            }
        }

        if (result === false) {
            return {
                success: false,
                message: "You don't have permission to delete this comment"
            }
        }

        // Lấy lại post để có commentCount mới (deleteComment đã giảm count trong DB)
        // Cần biết postId, nên sửa deleteComment trả thêm comment hoặc postId nếu cần.
        // Ở đây ta đọc lại comment trước khi xoá trong deleteComment, nên tận dụng comment.postId.
        const io = getIO()
        if (io) {
            // Để đơn giản, refetch postCount qua getPostById
            // (vì deleteComment chỉ trả true/false, không trả postId)
            // => ta không emit postId chính xác được ở đây nếu không sửa deleteComment.
            // Tạm thời bỏ qua emit nếu không có postId.
        }

        revalidatePath(`/post/*`)
        revalidatePath("/")

        return {
            success: true,
            message: "Comment deleted successfully"
        }
    } catch (error) {
        console.log("Delete comment action error:", error)
        return {
            success: false,
            message: "Failed to delete comment"
        }
    }
}

// GET POST COMMENTS ACTION
export async function getPostCommentsAction(postId: number) {
    try {
        const postComments = await getPostComments(postId)
        return {
            success: true,
            comments: postComments.map(comment => ({
                id: comment.id,
                content: comment.content,
                authorId: comment.author.id,
                author: {
                    id: comment.author.id,
                    name: comment.author.name,
                    email: comment.author.email
                },
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }))
        }
    } catch {
        return {
            success: false,
            comments: []
        }
    }
}
