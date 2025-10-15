"use client";

import { Button } from "@/components/ui/button";
import InputComponent from "@/components/ui/InputComponent";
import { useAuthStore, USER_DATA_KEY } from "@/store/authStore";
import { useUserStore } from "@/store/userStore";
import { useState } from "react";
import CreateUsers from "./CreateUsers";

// Define the interface for bulk user data (must match the modal's ExcelUserData)
interface BulkUserData {
    name: string;
    pnoNo: string;
    password: string;
}

const CreateUsersPage = () => {
    // --- State and Store Hooks ---
    const { userData } = useAuthStore()
    const [name, setName] = useState<string>("")
    const [pnoNo, setPnoNo] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [isModalOpen, setIsModalOpen] = useState(false) // State for modal visibility

    // NOTE: Assuming useUserStore was updated to use 'createUserOrBulk'
    // If not, you must rename 'createUsers' to 'createUserOrBulk' in your store
    const { createUsers } = useUserStore()

    // --- Helper to get Admin ID ---
    const getAdminId = (): string | undefined => {
        const admin = localStorage.getItem(USER_DATA_KEY)
        if (!admin) {
            return undefined
        }
        try {
            const parsedData = JSON.parse(admin)
            return parsedData?.id
        } catch (e) {
            console.error("Failed to parse admin data from localStorage:", e)
            return undefined
        }
    }

    // --- Single User Creation Handler ---
    const handleGenerate = async () => {
        try {
            const adminId = getAdminId()
            if (!adminId) {
                alert("Admin ID not found. Cannot create user.")
                return
            }

            const sentData = {
                name: name,
                pnoNo: pnoNo,
                password: password,
            }

            // Call the store action for a single user
            await createUsers(sentData, adminId)

            // Clear form fields on success
            setName("");
            setPnoNo("");
            setPassword("");

        } catch (error) {
            console.error(error)
        }
    }

    // --- Bulk User Creation Handler ---
    const handleBulkUpload = async (data: BulkUserData[]) => {
        try {
            if (data.length === 0) {
                alert("No valid user data found in the file.")
                return
            }

            const adminId = getAdminId()
            if (!adminId) {
                alert("Admin ID not found. Cannot perform bulk signup.")
                return
            }

            // Call the store action for bulk users
            await createUsers(data, adminId)

        } catch (error) {
            console.error("Bulk upload error:", error)
        }
    }


    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">

            {/* Modal for Bulk Upload */}
            <CreateUsers
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpload={handleBulkUpload}
            />

            <div className="my-4 text-center">
                <h1 className="text-3xl font-bold text-gray-800">Create Users</h1>
                <p className="text-sm text-gray-500 mt-1">Single entry or bulk upload</p>
            </div>

            <div className="w-full max-w-2xl mt-8">

                {/* Bulk Upload Button */}
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        variant="default" // Using default, but you might want a distinct style
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        ⬆️ Bulk Upload (Excel/CSV)
                    </Button>
                </div>

                {/* Single User Creation Form */}
                <div className="bg-white shadow-xl border border-gray-200 p-8 rounded-xl flex flex-col gap-4">
                    <h2 className="text-xl font-semibold mb-2 text-gray-700">Single User Entry</h2>

                    <InputComponent label="Name" value={name} setInput={setName} />
                    <InputComponent label="PNo No" value={pnoNo} setInput={setPnoNo} type="text" />
                    <InputComponent label="Password" value={password} setInput={setPassword} type="password" />

                    <div className="flex justify-center mt-4">
                        <Button onClick={handleGenerate} className="w-1/3">Create User</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateUsersPage