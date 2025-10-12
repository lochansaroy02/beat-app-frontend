"use client";
import QRTable from "@/components/QrTable";
import { useQRstore } from "@/store/qrStore";
import { useEffect } from "react";

const page = () => {
    const { getAllQR, allQRData } = useQRstore()


    const excludedKeys = ['createdAt', 'id']

    useEffect(() => {
        getAllQR()
    }, [])
    return (
        <div className="relative">
            <QRTable data={allQRData} excludedKeys={excludedKeys} />
        </div>
    )
}

export default page