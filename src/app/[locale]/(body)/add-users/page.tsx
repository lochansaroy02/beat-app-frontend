"use client";

import { Button } from "@/components/ui/button";
import InputComponent from "@/components/ui/InputComponent";
import { useAuthStore, USER_DATA_KEY } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { useState } from "react";
const page = () => {


    const { userData } = useAuthStore()
    const [name, setName] = useState<string>("")
    const [pnoNo, setPnoNo] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const { createUsers } = useUserStore()

    const handleGenerate = async () => {
        try {


            const admin = localStorage.getItem(USER_DATA_KEY)
            if (!admin) {
                return
            }
            const parsedData = JSON.parse(admin)
            const sentData = {
                name: name,
                pnoNo: pnoNo,
                password: password,
                adminId: parsedData?.id

            }
            await createUsers(sentData)

        } catch (error) {
            console.error(error)
        }
    }
    return (
        <div className=" ">
            <div className="my-4 justify-center flex ">
                <h1 className="text-2xl font-stretch-semi">Create Users</h1>
            </div>
            <div className="  w-1/2 flex bg-neutral-300   border border-neutral-800/50  p-8 rounded-xl mt-24 flex-col gap-4">
                {/* Latitude */}
                <InputComponent
                    label="Name"
                    value={name}
                    setInput={setName}
                />
                <div>
                    <InputComponent
                        label="PNo No"
                        value={pnoNo}
                        setInput={setPnoNo}
                        type="text"
                    />
                    {/* {latError && <p className="text-red-500 text-sm">{latError}</p>} */}
                </div>

                {/* Longitude */}
                <div>
                    <InputComponent
                        label="password"
                        value={password}
                        setInput={setPassword}
                        type="text"
                    />

                </div>

                {/* Police Station */}

                <div className="flex  justify-center">

                    <Button onClick={handleGenerate}>create</Button>
                </div>
            </div>
        </div>
    )
}

export default page