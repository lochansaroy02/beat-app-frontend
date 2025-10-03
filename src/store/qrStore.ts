
import { api } from '@/utils/constatns';
import axios from 'axios';
import { create } from 'zustand';



interface QrProps {
    lattitude: string,
    longitude: string,
    policeStation: string
}

interface PersonProps {

    createQR: (data: QrProps) => Promise<any>
    getQRData: (userId: string | undefined) => Promise<any>
}

export const useQRstore = create<PersonProps>((set) => ({

    createQR: async (data: QrProps) => {
        console.log(process.env.NEXT_PUBLIC_BASE_URL)
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/qr/create`, data)
            return response.data
        } catch (error) {
            console.error(error)
            return null
        }
    },
    getQRData: async (userId: string | undefined) => {
        try {
            const response = await axios.get(`${api}/qr/get/${userId}`)
            console.log(response.data);
            return response
        } catch (error) {
            console.log(error);
            return null
        }
    }

}));

