"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import LoginForm from "./login-form"
import RegisterForm from "./register-form"



function AuthLayout(){
    const [activeTabs,setActiveTabs] = useState("login")
    return(
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="w-full max-w-md p-5 bg-card rounded-lg shadow-sm border">
                <h1 className="text-2xl font-bold text-center mb-6">Well come!</h1>
                <Tabs value={activeTabs} onValueChange={setActiveTabs} className="w-full">
                    <TabsList className="grid grid-cols-2 mb-4 w-full">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>
                    {/* Login tabs */}
                    <TabsContent value="login">
                       <LoginForm/>
                    </TabsContent>
                    {/* Register tabs */}
                    <TabsContent value="register">
                        <RegisterForm onSuccess ={() => setActiveTabs("login")}/>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
export default AuthLayout