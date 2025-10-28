import { Person } from "@/types/type";
import { Trash2 } from "lucide-react"; // Icon for the delete button
import ImageSlider from "./ImageSlider";

// Define a type for a single QR scan record for better clarity
type QrScanData = {
    id: string; // Assuming a unique ID for the scan record
    scannedOn: string;
    policeStation: string;
    lattitude: number;
    longitude: number;
    dutyPoint: string
    // Add other properties of a QR scan record here
};

// Update the props type, removing isAdmin and keeping onDeleteRow
type UserTableProps = {
    personData: Person[], // Use Person[] for better typing
    qrDataMap: any, // Map<PNO_NO, QR_SCAN_ARRAY>
    addressMap: Map<string, string>, // Map<PNO_NO, ADDRESS_STRING>
    isLoading: boolean,
    // Function to handle deletion. personId is required, scanId is optional (only for rows with scan data)
}

const UserTable = ({ personData, qrDataMap, addressMap, isLoading }: UserTableProps) => {

    // --- Loading and Empty State ---

    if (isLoading) {
        return (
            <div className='w-full h-full p-4 flex items-center justify-center'>
                <p className='text-center'>Loading person and QR data... Please wait.</p>
            </div>
        );
    }

    if (!personData || personData.length === 0) {
        return (
            <div className='w-full p-4 '>
                <p className='text-center'>No person data found for this user or no results match the current filter.</p>
            </div>
        );
    }

    // --- Utility Function for Delete Action ---



    const handleDelete = (personId: string, scanId?: string) => {
        // Simple confirmation before calling the delete handler from the parent
        if (window.confirm(`Are you sure you want to delete this ${scanId ? 'scan record' : 'person record'}?`)) {
                
        }
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
                            Duty Point
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Images
                        </th>
                        {/* Actions Header (No longer conditional) */}
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
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
                                // CASE 1: No scan data found (render a single row for the person)
                                // IMPORTANT: Total columns must match header (9 in total)
                                return (
                                    <tr key={person.id || index} className='hover:bg-gray-100 transition-colors bg-red-50/50'>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td> {/* 1. Sr No. */}
                                        <td className="px-6 py-4 text-sm text-gray-700">{person.name}</td> {/* 2. Name */}
                                        <td className="px-6 py-4 text-sm text-gray-700">{person.pnoNo}</td> {/* 3. PNO No. */}
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">{address}</td> {/* 4. Location (Address) */}
                                        <td className="px-6 py-4 text-sm text-gray-700">Never Scanned</td> {/* 5. Scanned On */}
                                        <td className="px-6 py-4 text-sm text-gray-700">N/A</td> {/* 6. Police Station */}
                                        <td className="px-6 py-4 text-sm text-gray-700">N/A</td> {/* 7. Duty Point */}
                                        <td className="px-6 py-4"><ImageSlider photos={person.photos} /></td> {/* 8. Images */}
                                        {/* 9. Actions Column for no-scan row (Person Deletion) */}
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <button
                                                onClick={() => handleDelete(person.id!)} // Delete the entire person record
                                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                                title="Delete Person Record (No Scans)"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }

                            // CASE 2: Scan data exists (render multiple rows with rowSpan)
                            return personQrData.map((scan: QrScanData, scanIndex: number) => {
                                return (
                                    <tr key={`${person.id}-${scan.id || scanIndex}`} className='hover:bg-gray-100 transition-colors'>

                                        {/* RowSpan Columns: Only render these on the FIRST row of the person's scans */}
                                        {scanIndex === 0 && (
                                            <>
                                                {/* Column 1: Sr No. */}
                                                <td rowSpan={scanCount} className="px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">
                                                    {index + 1}
                                                </td>
                                                {/* Column 2: Name */}
                                                <td rowSpan={scanCount} className="px-6 py-4 text-sm text-gray-700 border-r border-gray-200">
                                                    {person.name}
                                                </td>
                                                {/* Column 3: PNO No. */}
                                                <td rowSpan={scanCount} className="px-6 py-4 text-sm text-gray-700 border-r border-gray-200">
                                                    {person.pnoNo}
                                                </td>
                                                {/* Column 4: Location (ADDRESS) */}
                                                <td rowSpan={scanCount} className="px-6 py-4 whitespace-normal text-sm text-gray-700 border-r border-gray-200">
                                                    {address}
                                                </td>
                                            </>
                                        )}

                                        {/* Non-RowSpan Columns (Scan-specific data) */}

                                        {/* Column 5: Scanned On */}
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {scan.scannedOn}
                                        </td>

                                        {/* Column 6: Police Station */}
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {scan.policeStation}
                                        </td>

                                        {/* Column 7: Duty Point */}
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {scan.dutyPoint}
                                        </td>


                                        {/* Column 8: Images (RowSpan) */}
                                        {scanIndex === 0 && (
                                            <td rowSpan={scanCount} className="px-6 py-4 border-l border-gray-200">
                                                <ImageSlider photos={person.photos} />
                                            </td>
                                        )}

                                        {/* 9. Actions Column (Scan-specific Deletion) */}
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {/* Delete button for the specific scan row */}
                                            <button
                                                onClick={() => handleDelete(person.id!, scan.id)} // Delete the specific scan record
                                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                                title="Delete Scan Record"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
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