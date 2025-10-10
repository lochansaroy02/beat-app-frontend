"use client";
import { CheckCircle, List, QrCode, Table, Trash2, XCircle } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { generatePdfWithQRCodes } from '@/utils/genetateQR';
import { CustomCheckbox } from './CustomCheckbox';
import { Button } from './ui/button'; // Assuming this is your Shadcn button component

// --- Helper Functions (Unchanged) ---

/**
 * Helper function to convert a camelCase or snake_case string into Title Case.
 * e.g., 'policeStation' -> 'Police Station'
 */
const toTitleCase = (str) => {
    if (!str) return '';
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Helper function to format cell values based on their type.
 */
const formatValue = (value) => {
    if (typeof value === 'boolean') {
        return value ? (
            <span className="inline-flex items-center text-green-600 font-semibold">
                <CheckCircle className="w-4 h-4 mr-1" /> Yes
            </span>
        ) : (
            <span className="inline-flex items-center text-red-600 font-semibold">
                <XCircle className="w-4 h-4 mr-1" /> No
            </span>
        );
    }

    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        try {
            return new Date(value).toLocaleString();
        } catch (e) {
            return value;
        }
    }

    return value === null ? 'N/A' : String(value);
};

// --- QRTable Component with Selection (FIXED) ---

/**
 * DataTable Component
 * Renders data in a responsive table, excluding specified keys.
 * @param {Array<Object>} data - The array of objects to display.
 * @param {Array<string>} excludedKeys - Keys to omit from the table columns.
 */
interface QRTableProps {
    data: any[],
    excludedKeys: string[]
}

const QRTable = ({ data, excludedKeys = [] }: QRTableProps) => {

    // 1. CALL ALL HOOKS UNCONDITIONALLY AT THE TOP LEVEL

    const getRowKey = useCallback((item, index) => item.id ?? index, []);
    const [selectedRows, setSelectedRows] = useState(new Set());

    const dataKeys = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    const filteredKeys = useMemo(() => {
        return dataKeys.filter(key => !excludedKeys.includes(key));
    }, [dataKeys, excludedKeys]);

    const allRowKeys = useMemo(() => (data || []).map((item, index) => getRowKey(item, index)), [data, getRowKey]);

    // New: Create a map for quick lookup of data objects based on their key/ID
    const dataMap = useMemo(() => {
        const map = new Map();
        (data || []).forEach((item, index) => {
            map.set(getRowKey(item, index), item);
        });
        return map;
    }, [data, getRowKey]);


    // 2. CONDITIONAL CHECK / EARLY RETURN (AFTER all Hooks)
    if (!data || data.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow-inner">
                <List className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                No data records available.
            </div>
        );
    }

    // --- Selection Logic (Unchanged) ---

    const isAllSelected = selectedRows.size === data.length && data.length > 0;
    const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(allRowKeys));
        }
    };

    const handleRowSelect = (rowKey) => {
        setSelectedRows(prevSelectedRows => {
            const newSelected = new Set(prevSelectedRows);
            if (newSelected.has(rowKey)) {
                newSelected.delete(rowKey);
            } else {
                newSelected.add(rowKey);
            }
            return newSelected;
        });
    };

    // --- Generate QR Code Handler (IMPLEMENTED) ---
    const handleGenerateQR = async () => {
        if (selectedRows.size === 0) {
            console.log("No rows selected for QR code generation.");
            return;
        }

        const selectedDataForQR = Array.from(selectedRows).map(key => {
            const item = dataMap.get(key);
            if (!item) return null;

            // FIX 1: Map must return the object to build the array
            return {
                lattitude: item.lattitude || '', // Checking both casings
                longitude: item.longitude || item.Longitude || '',
                dutyPoint: item.dutyPoint || item.DutyPoint || '',
                policeStation: item.policeStation || item.PoliceStation || '',
            };
        }).filter(item => item !== null);

        if (selectedDataForQR.length > 0) {
            try {
                // FIX 2: Call with the correctly filtered array
                await generatePdfWithQRCodes(selectedDataForQR, 'selected-qr-codes.pdf');
            } catch (error) {
                console.error("PDF Generation Failed:", error);
                // Handle UI error here (e.g., toast notification)
            }
        }
    };

    // --- Component JSX ---
    const isActionDisabled = selectedRows.size === 0;

    return (
        <div className="bg-neutral-200 rounded-xl shadow-2xl p-4 md:p-6 overflow-x-auto">
            <div className='flex p-4m justify-between items-center'>

                <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center">
                    <Table className="w-6 h-6 mr-2" />
                    Duty Point Scans
                </h2>
                <div className='flex gap-4 '>
                    <Button
                        onClick={handleGenerateQR}
                        className={`cursor-pointer bg-green-700 ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}
                        disabled={isActionDisabled}
                    >
                        <QrCode className="w-5 h-5 mr-2" />
                        Generate QrCode ({selectedRows.size})
                    </Button>
                    <Button
                        className={`cursor-pointer bg-red-500 ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600/70'}`}
                        disabled={isActionDisabled}
                    >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete ({selectedRows.size})
                    </Button>
                </div>

            </div>
            {/* Display Selected Count for context */}
            <p className="mb-3 text-sm text-gray-600">
                {selectedRows.size} of {data.length} row(s) selected.
            </p>

            {/* Table structure */}
            <table className="min-w-full divide-y divide-gray-200">

                {/* Table Header */}
                <thead className="bg-indigo-50 sticky top-0">
                    <tr>
                        {/* Select All Column Header */}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider whitespace-nowrap w-1">
                            <CustomCheckbox
                                checked={isAllSelected}
                                indeterminate={isIndeterminate}
                                onClick={handleSelectAll}
                            />
                        </th>
                        {/* Data Columns */}
                        {filteredKeys.map((key) => (
                            <th
                                key={key}
                                className="px-4 py-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider whitespace-nowrap"
                            >
                                {toTitleCase(key)}
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Table Body */}
                <tbody className="bg-white divide-y divide-gray-100">
                    {data.map((item, rowIndex) => {
                        const rowKey = getRowKey(item, rowIndex);
                        const isSelected = selectedRows.has(rowKey);
                        return (
                            <tr
                                key={rowKey}
                                className={`transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`}
                                onClick={() => handleRowSelect(rowKey)}
                            >
                                {/* Row Selection Checkbox */}
                                <td className="px-4 py-4 text-sm font-medium text-gray-800 whitespace-nowrap w-1">
                                    <CustomCheckbox
                                        checked={isSelected}
                                        indeterminate={false}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRowSelect(rowKey);
                                        }}
                                    />
                                </td>
                                {/* Data Cells */}
                                {filteredKeys.map((key) => (
                                    <td
                                        key={key}
                                        className="px-4 py-4 text-sm font-medium text-gray-800 whitespace-nowrap"
                                    >
                                        {formatValue(item[key])}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default QRTable;