"use client";
import { Button } from "@/components/ui/button";
import InputComponent from "@/components/ui/InputComponent";
import { useQRstore } from "@/store/qrStore";
import { generateQrcode } from "@/utils/genetateQR";
import axios from "axios";
import { useState } from "react";

const Page = () => {
    const [lat, setLat] = useState("");
    const [long, setLong] = useState("");
    const [policeStation, setPoliceStation] = useState("");
    const [url, setUrl] = useState("")
    // ✅ validation states
    const [latError, setLatError] = useState("");
    const [longError, setLongError] = useState("");
    const [address, setAddress] = useState(null);



    const { createQR } = useQRstore()


    const validateLatitude = (val: string) => {
        const num = Number(val);
        if (val === "") return "Latitude is required";
        if (isNaN(num)) return "Latitude must be a number";
        if (num < -90 || num > 90) return "Latitude must be between -90 and 90";
        return "";
    };

    const validateLongitude = (val: string) => {
        const num = Number(val);
        if (val === "") return "Longitude is required";
        if (isNaN(num)) return "Longitude must be a number";
        if (num < -180 || num > 180) return "Longitude must be between -180 and 180";
        return "";
    };

    const handleLatChange = (val: string) => {
        setLat(val);
        setLatError(validateLatitude(val));
    };

    const handleLongChange = (val: string) => {
        setLong(val);
        setLongError(validateLongitude(val));
    };



    const cordToAddress = async (lat: string, long: string) => {

        try {
            const response = await axios.get(`https://geocode.maps.co/reverse?lat=${lat}&lon=${long}&api_key=${process.env.NEXT_PUBLIC_FREE_MAP_API_KEY}`)
            setAddress(response.data.address);
        } catch (error) {

        }
    }

    const handleGenerate = async () => {
        // Run final validation check
        const finalLatError = validateLatitude(lat);
        const finalLongError = validateLongitude(long);

        setLatError(finalLatError);
        setLongError(finalLongError);

        if (finalLatError || finalLongError || !policeStation) {
            alert("Please correct the errors and fill all fields.");
            return;
        }
        await cordToAddress(lat, long)
        const sentData = {
            lattitude: lat,
            longitude: long,
            policeStation: policeStation
        };

        try {
            const url = await generateQrcode(sentData);

            setUrl(url);
            const data = await createQR(sentData)

        } catch (error) {
            console.error(error);
            alert("Failed to generate QR code.");
        }
    };
    return (
        <div className="h-full flex items-center pt-8  flex-col">
            <div className="w-full justify-center flex   ">
                <h1 className="text-4xl   text-neutral-900 font-bold">Generate QR Code</h1>
            </div>

            <div className="w-1/2 flex bg-neutral-300   border border-neutral-800/50  p-8 rounded-xl mt-12 flex-col gap-4">
                {/* Latitude */}
                <div>
                    <InputComponent
                        label="Latitude"
                        value={lat}
                        setInput={handleLatChange}
                        type="number"
                    />
                    {latError && <p className="text-red-500 text-sm">{latError}</p>}
                </div>

                {/* Longitude */}
                <div>
                    <InputComponent
                        label="Longitude"
                        value={long}
                        setInput={handleLongChange}
                        type="number"
                    />
                    {longError && <p className="text-red-500 text-sm">{longError}</p>}
                </div>

                {/* Police Station */}
                <InputComponent
                    label="Police Station"
                    value={policeStation}
                    setInput={setPoliceStation}
                />
                <div className="flex  justify-center">

                    <Button onClick={handleGenerate}>Genetate</Button>
                </div>
            </div>
            {/* <MapComponent /> */}
            <div>
                {url && (
                    <div className="mt-8 flex flex-col items-center p-6 border rounded-lg shadow-lg bg-white">
                        <h2 className="text-xl font-semibold mb-4">Scan Me!</h2>
                        {/* Display the generated QR code image */}
                        <img
                            src={url}
                            alt="Generated QR Code"
                            className="w-64 h-64 border-4 border-gray-200"
                        />

                    </div>
                )}
            </div>
        </div>
    );
};

export default Page;
