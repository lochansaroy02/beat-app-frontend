// This is the UserTable component code you provided (no changes needed for the fix)

import { Person } from "@/types/type";
import ImageSlider from "./ImageSlider";

// Define a type for a single QR scan record for better clarity
type QrScanData = {
    id: string; // Assuming a unique ID for the scan record
    scannedOn: string;
    policeStation: string;
    lattitude: number; // Added lat/long since they're used for address
    longitude: number;
    // Add other properties of a QR scan record here
};

const UserTable = ({ personData, qrDataMap, addressMap, isLoading }: {
    personData: Person[], // Use Person[] for better typing
    qrDataMap: any, // Map<PNO_NO, QR_SCAN_ARRAY>
    addressMap: Map<string, string>, // Map<PNO_NO, ADDRESS_STRING>
    isLoading: boolean
}) => {

    if (isLoading) {
        return (
            <div className='w-full h-full p-4 flex items-center justify-center'>
                <p className='text-center'>Loading person and QR data... Please wait.</p>
            </div>
        );
    }

    // Now uses the updated displayData from Users.tsx
    if (!personData || personData.length === 0) {
        return (
            <div className='w-full p-4 '>
                <p className='text-center'>No person data found for this user or no results match the current filter.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sr No.
                        </th>

                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PNO No.
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location (Address)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Scanned On
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Police Station
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Images
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {
                        personData.map((person: Person, index: number) => {
                            // Cast for safer access in the map function
                            const personQrData: QrScanData[] = (qrDataMap.get(person.pnoNo) as unknown as QrScanData[]) || [];
                            const scanCount = personQrData.length;

                            // Get the Address data (which is constant for the person/pnoNo)
                            const address = addressMap.get(person.pnoNo) || (scanCount > 0 ? 'Fetching Address...' : 'N/A');

                            if (scanCount === 0) {
                                // CASE 1: No scan data found (render a single row)
                                return (
                                    <tr key={person.id || index} className='hover:bg-gray-100 transition-colors bg-red-50/50'>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{person.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{person.pnoNo}</td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">{address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Never Scanned</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">N/A</td>
                                        <td className="px-6 py-4"><ImageSlider photos={person.photos} /></td>
                                    </tr>
                                );
                            }

                            // CASE 2: One or more scan records found (render multiple rows)
                            // We map over the scan data to create one row per scan
                            return personQrData.map((scan: QrScanData, scanIndex: number) => {

                                return (
                                    <tr key={`${person.id}-${scan.id || scanIndex}`} className='hover:bg-gray-100 transition-colors'>

                                        {/* RowSpan: Only render these cells on the FIRST row of the person's scans */}
                                        {scanIndex === 0 && (
                                            <>
                                                {/* Column 1: Sr No. */}
                                                <td rowSpan={scanCount} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                                                    {index + 1}
                                                </td>
                                                {/* Column 2: Name */}
                                                <td rowSpan={scanCount} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
                                                    {person.name}
                                                </td>
                                                {/* Column 3: PNO No. */}
                                                <td rowSpan={scanCount} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
                                                    {person.pnoNo}
                                                </td>
                                            </>
                                        )}

                                        {/* Column 4: Location (ADDRESS - common for all scans of a PNO) */}
                                        {scanIndex === 0 && (
                                            <td rowSpan={scanCount} className="px-6 py-4 whitespace-normal text-sm text-gray-700 border-r border-gray-200">
                                                {address}
                                            </td>
                                        )}

                                        {/* Column 5: Scanned On (Scan-specific data) */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {scan.scannedOn}
                                        </td>

                                        {/* Column 6: Police Station (Scan-specific data) */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {scan.policeStation}
                                        </td>

                                        {/* Column 7: Images */}
                                        {scanIndex === 0 && (
                                            <td rowSpan={scanCount} className="px-6 py-4 border-l border-gray-200">
                                                <ImageSlider photos={person.photos} />
                                            </td>
                                        )}
                                    </tr>
                                )
                            })
                        })
                    }
                </tbody>
            </table>
        </div>
    )
}

export default UserTable