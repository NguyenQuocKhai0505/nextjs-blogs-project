"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import {z} from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { signIn } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

//Schema => 
const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address!"),
    password: z.string().min(6,"Password must be at least 6 character long !")
})

type LoginFormValues = z.infer<typeof loginSchema>
function LoginForm(){
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    
    //initilaze form
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues:{
            email:"",
            password:""
        }
    })
    const onSubmit = async(values:LoginFormValues) =>{
        setIsLoading(true)
        try{
           const {error} = await signIn.email({
            email: values.email,
            password: values.password,
            rememberMe: true
           })
        if(error){
            toast("Login Falied")
            return
        }
        toast("Login Success")
        router.push("/")
        }catch(error){

        }
    }
    return(
       <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* EMAIL */}
            <FormField 
            control={form.control}
            name="email"
            render={({field}) =>(
                <FormItem>
                    <FormLabel>
                        Email
                    </FormLabel>
                    <FormControl>
                        <Input placeholder="Enter your Email" {...field} type="email"/>
                    </FormControl>
                    <FormMessage/>
                </FormItem>
            )}>
            </FormField>
            {/* PASSWORD */}
            <FormField 
            control={form.control}
            name="password"
            render={({field}) =>(
                <FormItem>
                    <FormLabel>
                        Password
                    </FormLabel>
                    <FormControl>
                        <Input placeholder="Enter your Password" {...field} type="password"/>
                    </FormControl>
                    <FormMessage/>
                </FormItem>
            )}>
            </FormField>
            <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
            </Button>
        </form>
       </Form>
    )
}
export default LoginForm