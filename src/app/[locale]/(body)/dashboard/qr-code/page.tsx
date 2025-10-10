"use client";
import QRTable from "@/components/QrTable";
import { useQRstore } from "@/store/qrStore";
import { useEffect, useState } from "react";

const page = () => {
    const { getAllQR } = useQRstore()
    const [qrData, setQrData] = useState([])
    const getQR = async () => {
        try {
            const response = await getAllQR()
            if (response.data.success) {
                setQrData(response.data.data)
            }
        } catch (error) {
            console.log(error);
        }
    }

    const excludedKeys = ['createdAt', 'id']

    useEffect(() => {
        getQR()
    }, [])

    console.log(qrData);
    return (
        <div className="relative">

            <QRTable data={qrData} excludedKeys={excludedKeys} />
        </div>
    )
}

export default page