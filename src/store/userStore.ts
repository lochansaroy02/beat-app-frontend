import { api } from '@/utils/constatns';
import axios from 'axios';
import toast from 'react-hot-toast';
import { create } from 'zustand';

interface UserProps {
    userData: any,
    setUserData: (personData: any) => void
    getPerson: (adminId: string | undefined) => Promise<any>
    createUsers: (data: userDataProps) => Promise<void>
}

interface userDataProps {
    pnoNo: string, password: string, name: string, adminId: string | undefined
}

export const useUserStore = create<UserProps>((set) => ({
    userData: [],
    setUserData: (data: any) => {
        set({
            userData: data
        })
    },
    getPerson: async (adminId: string | undefined) => {
        try {
            const response = await axios.get(`${api}/admin/get-users/${adminId}`)
            set({
                userData: response.data.data
            })
        } catch (error) {
            console.error(error);
            return null

        }
    },
    createUsers: async (data: userDataProps) => {
        try {
            const response = await axios.post<any, any>(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup/${data.adminId}`, data)
            console.log(response.data);
        } catch (error) {
            console.error(error);
            toast.error("unexpected error")
        }

    }
}));

