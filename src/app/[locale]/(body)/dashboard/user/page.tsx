"use client";

import UserTable from "@/components/Table";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/datePicker"; // Assuming DatePicker is a reusable component
import InputComponent from "@/components/ui/InputComponent";
import { useAuthStore } from "@/store/authStore";
import { usePersonStore } from "@/store/personStore";
import { useQRstore } from "@/store/qrStore";
import { Person, QRDataItem } from "@/types/type";
import { cordToAddress } from "@/utils/cordToAddress";
import { useCallback, useEffect, useState } from "react";


const page = () => {
    // 1. Get the store data and actions
    const { getPerson, personData } = usePersonStore();
    const { getQRData } = useQRstore();

    // 2. Safely get userData and initialization status from Auth Store
    const { userData: authUserData, initializeStore, isInitialized } = useAuthStore();

    // Initialize displayData with personData. It will be [] initially.
    const [displayData, setDisplayData] = useState(personData);

    // State to store QR data: Map<pnoNo, QRDataItem[]>
    const [qrDataMap, setQrDataMap] = useState<Map<string, QRDataItem[]>>(new Map());
    const [addressMap, setAddressMap] = useState<Map<string, string>>(new Map());

    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // --- MODIFICATION: New Date States ---
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    // State for formatted dates (DD-MM-YYYY)
    const [actualStartDate, setActualStartDate] = useState<string>("");
    const [actualEndDate, setActualEndDate] = useState<string>("");
    // -------------------------------------

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
     * Formats the Date object into a DD-MM-YYYY string for searching.
     */
    function formatDateString(dateStr: Date | undefined, setter: React.Dispatch<React.SetStateAction<string>>) {
        if (!dateStr) {
            setter("");
            return;
        }
        const date = new Date(dateStr);
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yyyy = date.getFullYear();

        setter(`${dd}-${mm}-${yyyy}`);
    }

    // --- MODIFICATION: Run formatting when start/end date pickers change ---
    useEffect(() => {
        formatDateString(startDate, setActualStartDate);
    }, [startDate]);

    useEffect(() => {
        formatDateString(endDate, setActualEndDate);
    }, [endDate]);
    // ----------------------------------------------------------------------


    /**
     * Filters the personData based on the current search query and date range.
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

        // --- MODIFICATION: Filter by Date Range ---
        if (actualStartDate && actualEndDate) {
            const pnoNosWithScanInRange = new Set<string>();

            // Convert DD-MM-YYYY dates to Date objects for comparison
            // Note: This conversion is only for comparison; the qrData.scannedOn is still a string.
            const [sDay, sMonth, sYear] = actualStartDate.split('-').map(Number);
            // Months are 0-indexed in Date object, so sMonth - 1
            const startOfDay = new Date(sYear, sMonth - 1, sDay);
            startOfDay.setHours(0, 0, 0, 0); // Start of the start day

            const [eDay, eMonth, eYear] = actualEndDate.split('-').map(Number);
            const endOfDay = new Date(eYear, eMonth - 1, eDay);
            endOfDay.setHours(23, 59, 59, 999); // End of the end day

            // Find all pnoNo's that have a scan within the date range
            for (const [pnoNo, qrData] of qrDataMap.entries()) {
                const hasScanInRange = qrData.some(item => {
                    // item.scannedOn is like "DD-MM-YYYY HH:MM:SS"
                    // Extract DD-MM-YYYY part and convert to a comparable Date object
                    const datePart = item.scannedOn.split(' ')[0]; // DD-MM-YYYY
                    const [qDay, qMonth, qYear] = datePart.split('-').map(Number);
                    // Use new Date(Year, Month-1, Day) for consistent comparison without time component issues
                    const scanDate = new Date(qYear, qMonth - 1, qDay);
                    scanDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone/daylight savings issues

                    return scanDate.getTime() >= startOfDay.getTime() && scanDate.getTime() <= endOfDay.getTime();
                });

                if (hasScanInRange) {
                    pnoNosWithScanInRange.add(pnoNo);
                }
            }

            // Filter the current data set to only include PNOs with a scan in that range
            filteredData = filteredData.filter((person: Person) =>
                pnoNosWithScanInRange.has(person.pnoNo)
            );
        } else if (actualStartDate && !actualEndDate) {
            // Handle case where only start date is selected (filter for that day only)
            const pnoNosWithScanOnDate = new Set<string>();
            for (const [pnoNo, qrData] of qrDataMap.entries()) {
                const hasScanOnDate = qrData.some(item =>
                    item.scannedOn.startsWith(actualStartDate) // DD-MM-YYYY match
                );
                if (hasScanOnDate) {
                    pnoNosWithScanOnDate.add(pnoNo);
                }
            }
            filteredData = filteredData.filter((person: Person) =>
                pnoNosWithScanOnDate.has(person.pnoNo)
            );
        } else if (!actualStartDate && actualEndDate) {
            // Handle case where only end date is selected (filter for that day only)
            const pnoNosWithScanOnDate = new Set<string>();
            for (const [pnoNo, qrData] of qrDataMap.entries()) {
                const hasScanOnDate = qrData.some(item =>
                    item.scannedOn.startsWith(actualEndDate) // DD-MM-YYYY match
                );
                if (hasScanOnDate) {
                    pnoNosWithScanOnDate.add(pnoNo);
                }
            }
            filteredData = filteredData.filter((person: Person) =>
                pnoNosWithScanOnDate.has(person.pnoNo)
            );
        }
        // ------------------------------------------------------------------

        setDisplayData(filteredData);
    }, [personData, searchQuery, actualStartDate, actualEndDate, qrDataMap]);

    // Apply filters automatically when search query or formatted dates changes
    useEffect(() => {
        applyFilters();
    }, [searchQuery, actualStartDate, actualEndDate, applyFilters]);


    // Use the applyFilters function for the Search button
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
                {/* --- MODIFICATION: Two DatePickers for Start and End Date --- */}
                <div>
                    <label className="text-sm">Start Date</label>
                    <DatePicker
                        date={startDate}
                        setDate={setStartDate}
                    />
                </div>
                <div>
                    <label className="text-sm">End Date</label>
                    <DatePicker
                        date={endDate}
                        setDate={setEndDate}
                    />
                </div>
                {/* ------------------------------------------------------------- */}
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

export default page;