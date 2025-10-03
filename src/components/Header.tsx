"use client";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

const Header = () => {
    const { logout, isLoggedIn } = useAuthStore()
    const router = useRouter()
    return (
        <div className=' h-16  pt-1  fixed w-full  flex justify-center  '>
            <div className='mx-12 px-4   rounded-xl w-full flex  justify-between items-center bg-neutral-200 '>
                <div>
                    Logo
                </div>

                <div>
                    <Button onClick={() => {
                        logout()
                        if (!isLoggedIn) {
                            router.push("/")
                        }
                    }}>Logout</Button>
                </div>
            </div>
        </div>
    )
}

export default Header