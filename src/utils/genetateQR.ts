// src/utils/genetateQR.ts (or genetateQR.tsx if rendering JSX)

import QRCode from 'qrcode';

// Define the interface for strong typing
interface LocationData {
    lattitude: string;
    longitude: string;
    policeStation: string;
}

/**
 * Generates a QR code image as a Base64 Data URL (PNG) from the location data.
 *
 * @param {LocationData} data - The location data object to encode.
 * @returns {Promise<string>} A promise that resolves to the Base64 Data URL of the QR code image.
 */
export const generateQrcode = async (data: LocationData): Promise<string> => {
    // 1. Convert the structured data into a JSON string
    const dataString = JSON.stringify(data);

    // 2. Options for the QR code (size, error correction, colors)
    const options: QRCode.QRCodeToDataURLOptions = {
        width: 256, // Set desired size
        margin: 2,
        color: {
            dark: '#000000ff', // Black (Dark modules)
            light: '#ffffffff' // White (Light modules)
        },
        errorCorrectionLevel: 'H' // High correction level
    };

    try {
        // 3. Generate the Data URL using the 'toDataURL' method
        const url = await QRCode.toDataURL(dataString, options);
        console.log("QR Code Data URL generated successfully.");
        // alert("Generated QR Code: Check console for data URL."); // Removed alert as it's too long
        return url;
    } catch (err) {
        console.error("Error generating QR code:", err);
        throw new Error("Failed to generate QR code image.");
    }
};

// You should also update the `handleGenerate` in your main component
// to handle the promise and display the result.