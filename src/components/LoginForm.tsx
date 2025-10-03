"use client";
import { AUTH_TOKEN_KEY, useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import InputComponent from './ui/InputComponent';
import { Button } from './ui/button';

const LoginForm = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const { userData, token, isLoggedIn, isLoading, login } = useAuthStore()
    const router = useRouter();
    const handleLogin = async () => {
        const response = await login({ email, password });
        if (response) {
            router.push("/generate-qr")
        }
    }


    useEffect(() => {
        if (localStorage.getItem(AUTH_TOKEN_KEY)) {
            router.push("/dashboard")
        }
    }, [])

    return (
        <div className=' p-10 rounded-xl  border border-neutral-800/50  shadow-md w-1/2  '>
            <div className='flex flex-col gap-8 '>
                <InputComponent value={email} setInput={setEmail} label='Email' />
                <InputComponent value={password} setInput={setPassword} label='Password' />
            </div>
            <div className='w-full flex justify-center  mt-6 '>
                <Button onClick={handleLogin}>
                    {isLoading ? "Logging In" : "Login"}
                </Button>
            </div>
        </div>
    )
}

export default LoginForm