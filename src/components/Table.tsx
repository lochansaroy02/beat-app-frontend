import { Person } from "@/types/type";
import ImageSlider from "./ImageSlider";

const UserTable = ({ personData, qrDataMap, addressMap, isLoading }: {
    personData: any,
    qrDataMap: any, addressMap: any, isLoading: boolean

}) => {

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
                <p className='text-center'>No person data found for this user.</p>
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
                            // 1. Get the QR Scan data (pre-fetched)
                            const personQrData = qrDataMap.get(person.pnoNo);
                            const firstScan = personQrData && personQrData.length > 0 ? personQrData[personQrData.length - 1] : null;

                            // 2. Get the Address data (fetched after scan data)
                            const address = addressMap.get(person.pnoNo) || (
                                firstScan ? 'Fetching Address...' : 'N/A'
                            );

                            return (
                                <tr key={person.id || index} className='hover:bg-gray-100 transition-colors'>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {index + 1}
                                    </td>
                                    {/* Column 2: Name */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {person.name}
                                    </td>
                                    {/* Column 3: PNO No. */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {person.pnoNo}
                                    </td>

                                    {/* Column 4: Location (ADDRESS - MODIFIED) */}
                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">
                                        {/* Display the fetched address */}
                                        {address}
                                    </td>

                                    {/* Column 5: Scanned On */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {firstScan ?
                                            firstScan.scannedOn :
                                            'Never Scanned'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {firstScan ?
                                            firstScan.policeStation :
                                            'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <ImageSlider photos={person.photos} />
                                    </td>
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
        </div>
    )
}

export default UserTable