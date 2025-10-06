"use client";

import UserTable from "@/components/Table";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/datePicker";
import InputComponent from "@/components/ui/InputComponent";
import { useAuthStore } from "@/store/authStore"; // 👈 Import useAuthStore
import { usePersonStore } from "@/store/personStore";
import { useQRstore } from "@/store/qrStore";
import { Person, QRDataItem } from "@/types/type";
import { cordToAddress } from "@/utils/cordToAddress";
import { useCallback, useEffect, useState } from "react";


const Users = () => {
    // 1. Get the store data and actions
    const { getPerson, personData } = usePersonStore();
    const { getQRData } = useQRstore();

    // 2. Safely get userData and initialization status from Auth Store
    const { userData: authUserData, initializeStore, isInitialized } = useAuthStore();
    // We will use authUserData.id for fetching.


    // Initialize displayData with personData. It will be [] initially.
    const [displayData, setDisplayData] = useState(personData);

    // State to store QR data: Map<pnoNo, QRDataItem[]>
    const [qrDataMap, setQrDataMap] = useState<Map<string, QRDataItem[]>>(new Map());
    const [addressMap, setAddressMap] = useState<Map<string, string>>(new Map());

    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
    const [actualSearchDate, setActualSearchDate] = useState<string>("");

    // 3. REMOVED the direct localStorage access here ❌

    /** * Fetches the initial person data for the current user.
     */
    const handleGetPersonData = useCallback(async (userId: number | undefined) => {
        if (userId) {
            //@ts-ignore
            await getPerson(userId);
        } else {
            setIsLoading(false);
        }
    }, [getPerson]);


    // New: Initialize the Auth Store on mount
    useEffect(() => {
        initializeStore();
    }, [initializeStore]);


    // 1. Initial Load: Fetch person data once the store is initialized AND we have user data
    useEffect(() => {
        if (isInitialized && authUserData?.id) {
            handleGetPersonData(authUserData.id);
        } else if (isInitialized && !authUserData?.id) {
            // If initialized but no user data (e.g., logged out), stop loading
            setIsLoading(false);
        }
        // Dependency array includes the necessary variables for re-running when ready
    }, [isInitialized, authUserData?.id, handleGetPersonData]);


    // **CRITICAL FIX:** Synchronize displayData when personData is fetched and updated in the store.
    useEffect(() => {
        setDisplayData(personData);
    }, [personData]);


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

    /**
     * Fetches the QR scan data for a specific PNO Number.
     */



    // 3. Address Geocoding (No change needed here)
    useEffect(() => {
        if (qrDataMap.size > 0) {
            const fetchAllAddresses = async () => {
                const newAddressMap = new Map<string, string>();
                const addressPromises: Promise<void>[] = [];

                for (const [pnoNo, qrData] of qrDataMap.entries()) {
                    // Use the LAST scan (most recent) for location/address.
                    const lastScan = qrData && qrData.length > 0 ? qrData[qrData.length - 1] : null;

                    if (lastScan) {
                        const promise = cordToAddress(lastScan.lattitude, lastScan.longitude).then(address => {
                            if (address) {
                                newAddressMap.set(pnoNo, address);
                            } else {
                                newAddressMap.set(pnoNo, 'Address N/A');
                            }
                        }).catch(e => {
                            newAddressMap.set(pnoNo, 'Error Fetching Address');
                        });
                        addressPromises.push(promise);
                    } else {
                        // Set a default for people without scan data
                        newAddressMap.set(pnoNo, 'N/A');
                    }
                }

                await Promise.all(addressPromises);
                setAddressMap(prevMap => new Map([...prevMap, ...newAddressMap]));
            };

            fetchAllAddresses();
        }
    }, [qrDataMap]);

    /**
     * Formats the Date object into a DD-MM-YYYY string for searching. (No change needed here)
     */
    function formatDateString(dateStr: Date | undefined) {
        if (!dateStr) {
            setActualSearchDate("");
            return;
        }
        const date = new Date(dateStr);
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yyyy = date.getFullYear();

        setActualSearchDate(`${dd}-${mm}-${yyyy}`);
    }

    // Run formatting when the date picker changes (No change needed here)
    useEffect(() => {
        formatDateString(searchDate);
    }, [searchDate]);


    /**
     * Filters the personData based on the current search query and actualSearchDate. (No change needed here)
     */
    const applyFilters = useCallback(() => {
        let filteredData = personData;

        // 1. Filter by Search Query (Name or PNO No.)
        if (searchQuery) {
            filteredData = filteredData.filter((item: Person) =>
                item.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()) ||
                item.pnoNo.includes(searchQuery)
            );
        }

        // 2. Filter by Date
        if (actualSearchDate) {
            const pnoNosWithScanOnDate = new Set<string>();

            // Find all pnoNo's that have a scan on the searched date
            for (const [pnoNo, qrData] of qrDataMap.entries()) {
                const hasScanOnDate = qrData.some(item =>
                    item.scannedOn.startsWith(actualSearchDate)
                );
                if (hasScanOnDate) {
                    pnoNosWithScanOnDate.add(pnoNo);
                }
            }

            // Filter the current data set to only include PNOs with a scan on that date
            filteredData = filteredData.filter((person: Person) =>
                pnoNosWithScanOnDate.has(person.pnoNo)
            );
        }

        setDisplayData(filteredData);
    }, [personData, searchQuery, actualSearchDate, qrDataMap]);

    // Apply filters automatically when search query or actualSearchDate changes (No change needed here)
    useEffect(() => {
        applyFilters();
    }, [searchQuery, actualSearchDate, applyFilters]);


    // Use the applyFilters function for the Search button (No change needed here)
    const handleSearchClick = () => {
        applyFilters();
    };


    return (
        <div className='w-full p-4'>
            <div className='flex justify-center w-full mb-6'>
                <h1 className='text-2xl font-bold border-b-2 pb-2'>
                    Person Details
                </h1>
            </div>

            <div className="glass-effect my-4 h-24 flex items-center gap-4 px-4 ">
                <div>
                    <DatePicker
                        date={searchDate}
                        setDate={setSearchDate} />
                </div>
                <div className="flex gap-4 items-center">
                    <InputComponent
                        value={searchQuery}
                        setInput={setSearchQuery}
                        placeholder="Search by name or PNO..."
                    />
                    <Button onClick={handleSearchClick}>Search</Button>
                </div>
            </div>

            <UserTable
                addressMap={addressMap}
                personData={displayData} // Use displayData for the table
                qrDataMap={qrDataMap}
                isLoading={isLoading}
            />
        </div>
    );
}

export default Users;