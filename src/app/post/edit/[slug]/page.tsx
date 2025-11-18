import PostForm from "@/components/post/post-form"
import { auth } from "@/lib/auth"
import { getPostBySlug } from "@/lib/db/queries"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

async function EditPostPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    // Lay slug tu params
    const { slug } = await params
    
    // Lay post tu database
    const post = await getPostBySlug(slug)

    // Kiem tra post ton tai
    if (!post) {
        notFound()
    }

    // Kiem tra session (User da dang nhap hay chua)
    const session = await auth.api.getSession({
        headers: await headers()
    })

    // KIEM TRA QUYEN - CHI CO AUTHOR MOI DUOC EDIT
    // Sửa logic: Redirect nếu KHÔNG phải author (!== thay vì ===)
    if (!session || session.user?.id !== post.authorId) {
        redirect("/")  // Khong co quyen truy cap => redirect ve homepage
    }

    // Neu pass tat ca checks -> render form edit
    return (
        <main className="py-10">
            <div className="max-w-4xl mx-auto px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-4xl font-bold">
                            Edit Post
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PostForm 
                            post={{
                                id: post.id,
                                title: post.title,
                                description: post.description,
                                content: post.content,
                                slug: post.slug
                            }}
                            mode="edit"
                        />
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}

export default EditPostPage