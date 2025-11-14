

export interface PostListProps{
    posts: Array<{
        id:number,
        title:string,
        description:string,
        slug:string,
        createdAt:Date,
        author:{
            name:string
        }
    }>
}

export interface PostCardProps{
    post: {
        id:number,
        title:string,
        description:string,
        slug:string,
        createdAt:Date,
        author:{
            name:string
        }
    }
}
export interface PostContentProps{
    post:{
        id: number,
        title: string,
        description: string,
        slug: string,
        content: string,
        authorId: string,
        createdAt: Date,
        updatedAt: Date,
        author:{
            id:string,
            name: string,
            email: string
        }
    },
    isAuthor?:boolean
}