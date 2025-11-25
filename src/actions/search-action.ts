"use server"

import {searchUsers} from "@/lib/db/queries"

export async function searchUsersAction(query:string,limit:number = 20)
{
    try{
        if(!query || query.trim().length===0){
            return{
                success:true,
                users:[]
            }
        }
        const users = await searchUsers(query.trim(),limit)

        return {
            success: true,
            users: users.map((user) => ({
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
            })),
          }
    }catch(e){
        console.error("Search users action error:",e)
        return{
            success:false,
            users:[],
            message:"Failed to search users"
        }
    }
}