"use client";

import UserTable from "@/components/Table";
import { USER_DATA_KEY } from "@/store/authStore";
import { usePersonStore } from "@/store/personStore";
import { useQRstore } from "@/store/qrStore";
import { Person, QRDataItem } from "@/types/type";
import { cordToAddress } from "@/utils/cordToAddress";
import { useCallback, useEffect, useState } from "react";



const Page = () => {
    const { getPerson, personData } = usePersonStore();
    const { getQRData } = useQRstore();

    // State to store QR data: Map<pnoNo, QRDataItem[]>
    const [qrDataMap, setQrDataMap] = useState<Map<string, QRDataItem[]>>(new Map());
    const [addressMap, setAddressMap] = useState<Map<string, string>>(new Map());

    const [isLoading, setIsLoading] = useState(true);

    // Retrieve user data from localStorage
    // @ts-ignore
    const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(USER_DATA_KEY) as string) : null;

    /**
     * Fetches the initial person data for the current user.
     */
    const handleGetPersonData = useCallback(async () => {
        if (userData?.id) {
            await getPerson(userData.id);
        } else {
            setIsLoading(false);
        }
    }, [getPerson, userData?.id]);

    /**
     * Fetches the QR scan data for a specific PNO Number.
     */
    const fetchQRDataForPerson = useCallback(async (pnoNumber: string): Promise<QRDataItem[]> => {
        try {
            const response = await getQRData(pnoNumber);
            if (response.data.success) {
                // Assuming response.data.data is the array of QRDataItem
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error(`Error fetching QR data for PNO ${pnoNumber}:`, error);
            return [];
        }
    }, [getQRData]);


    // 1. Initial Load: Fetch person data on component mount
    useEffect(() => {
        handleGetPersonData();
    }, [handleGetPersonData]);

    // 2. Secondary Load: Fetch QR data once personData is available
    useEffect(() => {
        if (personData && personData.length > 0) {
            const fetchAllQrData = async () => {
                setIsLoading(true);
                const newQrDataMap = new Map<string, QRDataItem[]>();

                const fetchPromises = personData.map(async (person: Person) => {
                    const data = await fetchQRDataForPerson(person.pnoNo);
                    newQrDataMap.set(person.pnoNo, data);
                });

                await Promise.all(fetchPromises);
                setQrDataMap(newQrDataMap);
                setIsLoading(false);
            };

            fetchAllQrData();
        } else if (personData && personData.length === 0) {
            setIsLoading(false);
        }
    }, [personData, fetchQRDataForPerson]);

    useEffect(() => {
        if (qrDataMap.size > 0) {
            const fetchAllAddresses = async () => {
                const newAddressMap = new Map<string, string>();
                const addressPromises: Promise<void>[] = [];

                for (const [pnoNo, qrData] of qrDataMap.entries()) {
                    // MODIFICATION HERE: Use the LAST scan (most recent) for location/address.
                    const lastScan = qrData && qrData.length > 0 ? qrData[qrData.length - 1] : null;

                    if (lastScan) {
                        const promise = cordToAddress(lastScan.lattitude, lastScan.longitude).then(address => {
                            if (address) {
                                newAddressMap.set(pnoNo, address);
                            } else {
                                newAddressMap.set(pnoNo, 'Address N/A');
                            }
                        }).catch(e => {
                            // On failure, use a default string
                            newAddressMap.set(pnoNo, 'Error Fetching Address');
                        });
                        addressPromises.push(promise);
                    } else {
                        // Set a default for people without scan data
                        newAddressMap.set(pnoNo, 'N/A');
                    }
                }

                await Promise.all(addressPromises);
                // Merge new addresses with existing map to prevent flashing if other data is present
                setAddressMap(prevMap => new Map([...prevMap, ...newAddressMap]));
            };

            fetchAllAddresses();
        }
    }, [qrDataMap]);





    return (
        <div className='w-full p-4'>
            <div className='flex justify-center w-full mb-6'>
                <h1 className='text-2xl font-bold border-b-2 pb-2'>
                    Person Details
                </h1>
            </div>

            <UserTable addressMap={addressMap} personData={personData} qrDataMap={qrDataMap} isLoading={isLoading} />



        </div>
    );
}

export default Page;