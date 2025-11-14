import PostList from "@/components/post/post-list";
import { getAllPost } from "@/lib/db/queries";
import { Metadata } from "next";
import Image from "next/image";


export const metadata: Metadata = {
  title: "Next.js 15 Blog",
  description:"Next.js 15 Blog"
}

export default async function Home() {
  const post = await getAllPost()
  return (
   <main className="py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-2">Wellcome to the Blog</h1>
        {
          post.length === 0 ?
          <div className="text-center py-10">
            <h2 className="text-xl font-medium">No post yet</h2>
          </div>:
          <PostList posts={post}/>
        }

      </div>
   </main>
  );
}
