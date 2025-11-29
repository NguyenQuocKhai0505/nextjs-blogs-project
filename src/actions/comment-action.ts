"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { createComment, deleteComment, getPostComments } from "@/lib/db/queries"

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

        const newComment = await createComment(postId, session.user.id, content.trim(), parentId)

        if (!newComment) {
            return {
                success: false,
                message: "Failed to create comment"
            }
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

// DELETE COMMENT ACTION
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
