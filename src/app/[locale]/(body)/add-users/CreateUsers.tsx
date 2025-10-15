"use client";

import { Button } from "@/components/ui/button";
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// Define the structure of data expected from the Excel sheet
interface ExcelUserData {
    name: string;
    pnoNo: string;
    password: string;
}

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (data: ExcelUserData[]) => void;
}

const CreateUsers: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }

        setLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert the sheet data to a JSON array
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                // Map and validate the required fields
                const formattedData: ExcelUserData[] = json.map(row => ({
                    // Ensure column names match headers in the Excel file (case sensitive)
                    name: String(row.name || ''),
                    pnoNo: String(row.pnoNo || ''),
                    password: String(row.password || ''),
                })).filter(user => user.name && user.pnoNo && user.password); // Filter out rows with missing data

                onUpload(formattedData);
                setLoading(false);
                setFile(null); // Clear file input
                onClose(); // Close modal on successful initiation

            } catch (error) {
                console.error("Error processing file:", error);
                alert("Error processing file. Please ensure it's a valid Excel/CSV file with 'name', 'pnoNo', and 'password' columns.");
                setLoading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h2 className="text-xl font-bold mb-4">Bulk User Upload</h2>
                <p className="text-sm text-gray-600 mb-4">Upload an Excel or CSV file containing columns:
                    <span className="font-semibold ml-1">
                        name, pnoNo, password.
                    </span>
                </p>
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="mb-4 block w-full text-sm text-gray-500
                               file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-violet-50 file:text-violet-700
                               hover:file:bg-violet-100"
                />

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleUploadClick} disabled={loading || !file}>
                        {loading ? 'Processing...' : 'Upload & Create'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CreateUsers;