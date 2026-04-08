"use client"
import { useState, useTransition } from "react"
import { DeletePost } from "@/actions/post-action"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../ui/alert-dialog"

interface DeletePostButtonProps{
    postId:number
}
export function DeletePostButton({postId}:DeletePostButtonProps)
{
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleDelete = () => {
        //Xoa post 
        startTransition(async()=>{
            const result = await DeletePost(postId)
            if(result.success){
                toast.success(result.message)
                setOpen(false)
                //Redirect ve homepage sau khi xoa thanh cong
                router.push("/")
                router.refresh()
            }else{
                toast.error(result.message)
            }
        })
    }

    return(
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    className="flex items-center gap-2"
                >
                    <Trash2 size={16}/>
                    Delete Post
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this post? This action cannot be undone.
                        The post will be permanently removed from your account.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? "Deleting..." : "Delete Post"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

