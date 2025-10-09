
import { api } from '@/utils/constatns';
import axios from 'axios';
import { create } from 'zustand';



interface QrProps {
    lattitude: string,
    longitude: string,
    policeStation: string
}

interface QRStoreProps {

    createQR: (data: QrProps) => Promise<any>
    getQRData: (userId: string | undefined) => Promise<any>
}

export const useQRstore = create<QRStoreProps>((set) => ({

    createQR: async (data: QrProps) => {

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/qr/create`, data)
            return response.data
        } catch (error) {
            console.error(error)
            return null
        }
    },
    createBulkQR: async (data: QrProps[]) => {
        try {
            // Assuming your backend has a new route for bulk creation: /qr/create/bulk
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/qr/create/bulk`, { bulkData: data });
            return response.data
        } catch (error) {
            console.error("Bulk QR creation error:", error)
            return null
        }
    },
    getQRData: async (userId: string | undefined) => {
        try {
            const response = await axios.get(`${api}/qr/get/${userId}`)

            return response
        } catch (error) {

            return null
        }
    }

}));

