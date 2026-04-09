import PostForm from "@/components/post/post-form"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiUrl } from "@/lib/api"
import { getAccessTokenFromCookies } from "@/lib/server-token"

async function EditPostPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    // Lay slug tu params
    const { slug } = await params
    
    const post = await fetch(apiUrl(`/posts/${encodeURIComponent(slug)}`), {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)

    // Kiem tra post ton tai
    if (!post) {
        notFound()
    }

    const token = await getAccessTokenFromCookies()
    if (!token) redirect("/auth")
    const me = await fetch(apiUrl("/me"), {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    }).then((r) => (r.ok ? r.json() : null))

    if (!me || me.id !== post.authorId) {
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
                                slug: post.slug,
                                imageUrls: post.imageUrls ?? null,
                                videoUrls: post.videoUrls ?? null,
                                categoryId: post.categoryId ?? null,
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