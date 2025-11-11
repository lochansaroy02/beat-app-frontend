"use client";

import UserTable from "@/components/Table";
import DatePicker from "@/components/ui/datePicker"; // Assuming DatePicker is a reusable component
import InputComponent from "@/components/ui/InputComponent";
import { useAuthStore } from "@/store/authStore";
import { usePersonStore } from "@/store/personStore";
import { useQRstore } from "@/store/qrStore";
import { Person, QRDataItem } from "@/types/type";
import { cordToAddress } from "@/utils/cordToAddress";
import { useCallback, useEffect, useMemo, useState } from "react";

// --- MODIFICATION: Define Time Phases ---
interface TimePhase {
    label: string;
    startHour: number; // 24-hour format (0-23)
    endHour: number;   // 24-hour format (0-23)
}

const TIME_PHASES: TimePhase[] = [
    { label: "Day Phase 1 (6AM - 9AM)", startHour: 6, endHour: 9 },
    { label: "Day Phase 2 (9AM - 12PM)", startHour: 9, endHour: 12 },
    { label: "Day Phase 3 (12PM - 3PM)", startHour: 12, endHour: 15 },
    { label: "Day Phase 4 (3PM - 6PM)", startHour: 15, endHour: 18 },
    { label: "Night Phase 1 (6PM - 9PM)", startHour: 18, endHour: 21 },
    { label: "Night Phase 2 (9PM - 12AM)", startHour: 21, endHour: 0 }, // Special case for midnight boundary
    { label: "Night Phase 3 (12AM - 3AM)", startHour: 0, endHour: 3 },
    { label: "Night Phase 4 (3AM - 6AM)", startHour: 3, endHour: 6 },
];
// ----------------------------------------


const Page = () => { // Renamed 'page' to 'Page' for convention
    // 1. Get the store data and actions
    const { getPerson, personData } = usePersonStore();
    const { getQRData } = useQRstore();

    // 2. Safely get userData and initialization status from Auth Store
    const { userData: authUserData, initializeStore, isInitialized } = useAuthStore();

    // Initialize displayData with personData. It will be [] initially.
    const [displayData, setDisplayData] = useState<Person[]>(personData);

    // State to store QR data: Map<pnoNo, QRDataItem[]>
    const [qrDataMap, setQrDataMap] = useState<Map<string, QRDataItem[]>>(new Map());
    const [addressMap, setAddressMap] = useState<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Date/Time States ---
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    // State for formatted dates (DD-MM-YYYY)
    const [actualStartDate, setActualStartDate] = useState<string>("");
    const [actualEndDate, setActualEndDate] = useState<string>("");
    // New state for time phase filter
    const [selectedTimePhase, setSelectedTimePhase] = useState<string>(""); // Stores the phase label
    // New state for police station filter
    const [selectedPoliceStation, setSelectedPoliceStation] = useState<string>(""); // Stores the police station name
    // -------------------------------------

    /** * Fetches the initial person data for the current user. */
    const handleGetPersonData = useCallback(async (userId: number | undefined) => {
        if (userId) {
            //@ts-ignore
            await getPerson(userId);
        } else {
            setIsLoading(false);
        }
    }, [getPerson]);


    // Initialize the Auth Store on mount
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


    // Synchronize displayData when personData is fetched and updated in the store.
    useEffect(() => {
        setDisplayData(personData);
    }, [personData]);


    const fetchQRDataForPerson = useCallback(async (pnoNumber: string): Promise<QRDataItem[]> => {
        try {
            const response = await getQRData(pnoNumber);
            if (response?.data.success) {
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
                    // Check if we already have data for this pnoNo, and use existing if available
                    if (qrDataMap.has(person.pnoNo)) {
                        newQrDataMap.set(person.pnoNo, qrDataMap.get(person.pnoNo)!);
                        return;
                    }

                    const data = await fetchQRDataForPerson(person.pnoNo);
                    newQrDataMap.set(person.pnoNo, data);
                });

                await Promise.all(fetchPromises);

                // Merge the new data with existing data to ensure map stability
                setQrDataMap(prevMap => new Map([...prevMap, ...newQrDataMap]));
                setIsLoading(false);
            };

            fetchAllQrData();
        } else if (personData && personData.length === 0) {
            setIsLoading(false);
        }
    }, [personData, fetchQRDataForPerson]);


    // 3. Address Geocoding
    useEffect(() => {
        if (qrDataMap.size > 0) {
            const fetchAllAddresses = async () => {
                const newAddressMap = new Map<string, string>();
                const addressPromises: Promise<void>[] = [];
                let needsUpdate = false;

                for (const [pnoNo, qrData] of qrDataMap.entries()) {
                    // Skip if address is already mapped
                    if (addressMap.has(pnoNo)) continue;

                    needsUpdate = true;

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
                        newAddressMap.set(pnoNo, 'N/A');
                    }
                }

                if (needsUpdate) {
                    await Promise.all(addressPromises);
                    // Only update the state if new addresses were added
                    setAddressMap(prevMap => new Map([...prevMap, ...newAddressMap]));
                }
            };

            fetchAllAddresses();
        }
    }, [qrDataMap, addressMap.size]); // Added addressMap.size to ensure this runs correctly when new people are loaded


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

    // Run formatting when start/end date pickers change
    useEffect(() => {
        formatDateString(startDate, setActualStartDate);
    }, [startDate]);

    useEffect(() => {
        formatDateString(endDate, setActualEndDate);
    }, [endDate]);


    // Helper function to determine if a scan time falls within a selected phase
    const isTimeInPhase = (timeStr: string, phase: TimePhase): boolean => {
        if (!timeStr) return false;

        const parts = timeStr.trim().split(' '); // ["09:03", "PM"]
        if (parts.length < 2) return false;

        const [timePart, ampm] = parts;
        const [hourStr] = timePart.split(':');
        let scanHour = parseInt(hourStr, 10);

        if (isNaN(scanHour)) return false;

        // Convert 12-hour time to 24-hour time
        if (ampm === 'PM' && scanHour !== 12) {
            scanHour += 12;
        } else if (ampm === 'AM' && scanHour === 12) {
            scanHour = 0; // 12:XX AM (midnight hour) is 00 in 24-hour time
        }
        // If it's 1AM-11AM or 12PM-1PM, scanHour is already correct

        // Now compare the 24-hour time
        if (phase.startHour >= phase.endHour) {
            // Crosses midnight (e.g., 21 to 0, or 0 to 3)
            return scanHour >= phase.startHour || scanHour < phase.endHour;
        } else {
            // Standard phase (e.g., 6 to 9)
            return scanHour >= phase.startHour && scanHour < phase.endHour;
        }
    };
    // --------------------------------------------------------------------------------

    // 4. Extract unique police stations from QR Data Map (CORRECTED LOGIC)
    const uniquePoliceStations = useMemo(() => {
        const stations = new Set<string>();
        // Iterate through all QR data arrays in the map
        for (const qrData of qrDataMap.values()) {
            qrData.forEach(item => {
                if (item.policeStation) {
                    stations.add(item.policeStation);
                }
            });
        }
        return Array.from(stations).sort();
    }, [qrDataMap]);


    const applyFilters = useCallback(() => {
        let filteredData = personData;
        const selectedPhase = TIME_PHASES.find(p => p.label === selectedTimePhase);

        // --- Core Filtering Logic ---

        // This is a comprehensive filter that combines Search, Date, Time, and Police Station.
        // We calculate which PNOs match the QR/Scan filters (Date/Time/Police Station) first,
        // then combine that with the Name/PNO search filter.

        const pnoNosWithScanMatch = new Set<string>();
        const needsScanFiltering = actualStartDate || actualEndDate || selectedTimePhase || selectedPoliceStation;

        if (needsScanFiltering) {
            const startOfDay = actualStartDate ? (() => {
                const [sDay, sMonth, sYear] = actualStartDate.split('-').map(Number);
                const date = new Date(sYear, sMonth - 1, sDay);
                date.setHours(0, 0, 0, 0);
                return date;
            })() : null;

            const endOfDay = actualEndDate ? (() => {
                const [eDay, eMonth, eYear] = actualEndDate.split('-').map(Number);
                const date = new Date(eYear, eMonth - 1, eDay);
                date.setHours(23, 59, 59, 999);
                return date;
            })() : null;

            // Iterate over all QR data to find matches
            for (const [pnoNo, qrData] of qrDataMap.entries()) {
                const hasScanMatch = qrData.some(item => {
                    if (!item.scannedOn) {
                        return false;
                    }

                    // 1. Police Station Filter
                    let stationMatches = true;
                    if (selectedPoliceStation) {
                        stationMatches = item.policeStation === selectedPoliceStation;
                    }
                    if (!stationMatches) return false;


                    // 2. Date/Time Parsing
                    const parts = item.scannedOn.split(' ');
                    const datePart = parts[0]; // DD-MM-YYYY
                    const timeStr = parts.slice(1).join(' '); // HH:MM AM/PM


                    // 3. Date Filtering Logic
                    let dateMatches = true;
                    if (actualStartDate || actualEndDate) {
                        const [qDay, qMonth, qYear] = datePart.split('-').map(Number);
                        if (qDay === undefined || qMonth === undefined || qYear === undefined) return false;

                        const scanDate = new Date(qYear, qMonth - 1, qDay);
                        scanDate.setHours(12, 0, 0, 0); // Normalize time for comparison

                        let startMatch = startOfDay ? scanDate.getTime() >= startOfDay.getTime() : true;
                        let endMatch = endOfDay ? scanDate.getTime() <= endOfDay.getTime() : true;

                        // Refine single-date matches if only one is set
                        if (startOfDay && !endOfDay) {
                            startMatch = datePart === actualStartDate;
                        }
                        if (endOfDay && !startOfDay) {
                            endMatch = datePart === actualEndDate;
                        }

                        dateMatches = startMatch && endMatch;
                    }
                    if (!dateMatches) return false;


                    // 4. Time Phase Filtering Logic
                    let timeMatches = true;
                    if (selectedPhase && timeStr) {
                        timeMatches = isTimeInPhase(timeStr, selectedPhase);
                    }

                    return dateMatches && timeMatches && stationMatches;
                });

                if (hasScanMatch) {
                    pnoNosWithScanMatch.add(pnoNo);
                }
            }

            // Filter the person data based on PNOs that had a matching scan
            filteredData = filteredData.filter((person: Person) =>
                pnoNosWithScanMatch.has(person.pnoNo)
            );
        }

        // 5. Filter by Search Query (Name or PNO No.) on the result set
        if (searchQuery) {
            filteredData = filteredData.filter((item: Person) =>
                item.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()) ||
                item.pnoNo.includes(searchQuery)
            );
        }

        setDisplayData(filteredData);
    }, [personData, searchQuery, actualStartDate, actualEndDate, selectedTimePhase, selectedPoliceStation, qrDataMap]);


    // Apply filters automatically when any dependency changes
    useEffect(() => {
        applyFilters();
    }, [searchQuery, actualStartDate, actualEndDate, selectedTimePhase, selectedPoliceStation, applyFilters]);


    const handleSearchClick = () => {
        // Since filters are applied in useEffect, this button mainly triggers the dependency change if used.
        // It's technically redundant if the inputs immediately update state, but kept for convention.
        applyFilters();
    };


    return (
        <div className='w-full p-4'>
            <div className="glass-effect my-4 h-24 flex items-center gap-4 px-4 ">

                {/* Police Station Selector (NEW - Based on QR Data) */}
                <div>
                    <label className="text-sm">Police Station</label>
                    <select
                        value={selectedPoliceStation}
                        onChange={(e) => setSelectedPoliceStation(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md h-10 w-48 text-sm"
                    >
                        <option value="">All Stations</option>
                        {uniquePoliceStations.map((station) => (
                            <option key={station} value={station}>
                                {station}
                            </option>
                        ))}
                    </select>
                </div>

                {/* DatePickers for Start and End Date */}
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
                {/* Time Phase Selector */}
                <div>
                    <label className="text-sm">Time Phase</label>
                    <select
                        value={selectedTimePhase}
                        onChange={(e) => setSelectedTimePhase(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md h-10 w-48 text-sm"
                    >
                        <option value="">All Times</option>
                        {TIME_PHASES.map((phase) => (
                            <option key={phase.label} value={phase.label}>
                                {phase.label}
                            </option>
                        ))}
                    </select>
                </div>
                {/* ------------------------------------------- */}
                <div className="flex gap-4 items-center">
                    <InputComponent
                        value={searchQuery}
                        setInput={setSearchQuery}
                        placeholder="Search by name or PNO..."
                    />
                </div>
            </div>

            <UserTable
                addressMap={addressMap}
                personData={displayData.reverse()} // Use displayData for the table
                qrDataMap={qrDataMap}
                isLoading={isLoading}
            />
        </div>
    );
}

export default Page;
