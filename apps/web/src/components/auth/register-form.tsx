"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import {z} from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { signUp } from "@/lib/auth-client"
import { toast } from "sonner"
// Schema 
//Tao schema Zod login
const registerSchema = z.object({
    name:  z.string().min(3,"Name must be at least 3 characters !"),
    email: z.string().email("Please enter a valid email address !"),
    password: z.string().min(6,"Password must be at least 6 characters !"),
    confirmPassword: z.string().min(6,"Password must be at least 6 characters !")
}).refine(data => data.password === data.confirmPassword, {
    message:"Password does not match",
    path:["confirmPassword"]
})

type registerFormValue = z.infer<typeof registerSchema>

interface RegisterFormProps{
    onSuccess?: () => void
}
function RegisterForm({onSuccess}: RegisterFormProps){
    const [isLoading,setIsLoading] = useState(false)

    //initlaze form
    const form = useForm<registerFormValue>({
        resolver: zodResolver(registerSchema),
        defaultValues:{
            name:"",
            email:"",
            password:"",
            confirmPassword:""
        }
    })
    const onRegisterSubmit = async(values:registerFormValue) =>{
        setIsLoading(true)
        console.log("[REGISTER] Starting registration process...")
        console.log("[REGISTER] Form values:", { 
            name: values.name, 
            email: values.email, 
            passwordLength: values.password.length 
        })
        
        try{
            console.log("[REGISTER] Calling signUp.email()...")
            const result = await signUp.email({
                name: values.name,
                email: values.email,
                password: values.password
            })
            
            console.log("[REGISTER] SignUp response:", result)
            
            if(result.error){
                console.error("[REGISTER] SignUp error:", result.error)
                console.error("[REGISTER] Error details:", JSON.stringify(result.error, null, 2))
                toast.error(`Failed to create account: ${result.error.message || "Unknown error"}`)
                return
            }
            
            console.log("[REGISTER] Registration successful!")
            toast.success("Your account has been created successfully. Please sign in with your email & password")

            if(onSuccess){
                onSuccess()
            }
        }catch(error){
            console.error("[REGISTER] Exception caught:", error)
            console.error("[REGISTER] Error stack:", error instanceof Error ? error.stack : "No stack trace")
            toast.error(`Registration failed: ${error instanceof Error ? error.message : "Unknown error"}`)
        }finally{
            setIsLoading(false)
            console.log("[REGISTER] Registration process completed")
        }
    }
    return(
        <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onRegisterSubmit)}>
                {/* User name */}
                <FormField
                control={form.control}
                name="name"
                render={({field}) =>(
                    <FormItem>
                        <FormLabel>User Name:</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter your Username" {...field}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                >
                </FormField>

                {/* Email */}
                <FormField
                control={form.control}
                name="email"
                render={({field})=>(
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter your Email" type="email" {...field}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}>
                </FormField>

                {/* Password */}
                <FormField 
                control={form.control}
                name="password"
                render={({field})=>(
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter your password" type="password" {...field}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                >
                </FormField>
                {/* Confirm Password */}
                <FormField 
                control={form.control}
                name="confirmPassword"
                render={({field})=>(
                    <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                            <Input placeholder="Please confirm your Password" type="password" {...field}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                >
                </FormField>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account" :"Create Account"}
                </Button>
            </form>
        </Form>
    )
}
export default RegisterForm