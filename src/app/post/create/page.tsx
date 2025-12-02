
import { redirect } from "next/navigation"
import { headers } from "next/headers"

import PostForm from "../../../components/post/post-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/auth"

// Server-side route protection: only authenticated users can access /post/create.
export default async function CreatePost() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/auth")
  }

  return (
    <main className="py-10">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl font-bold">
              Create New Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PostForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}