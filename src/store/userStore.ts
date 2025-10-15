import { api } from '@/utils/constatns';
import axios from 'axios';
import toast from 'react-hot-toast';
import { create } from 'zustand';

// --- Type Definitions ---

interface UserDataInput {
    pnoNo: string,
    password: string,
    name: string,
}

// Data passed to the create action: either a single object or an array of objects
type CreateUserInput = UserDataInput | UserDataInput[];

interface UserProps {
    userData: any, // Consider defining a more specific type for the retrieved user data
    setUserData: (personData: any) => void
    getPerson: (adminId: string | undefined) => Promise<any>
    // Updated function signature to handle bulk or single input
    createUsers: (data: CreateUserInput, adminId: string | undefined) => Promise<void>
}

// --- Zustand Store ---

export const useUserStore = create<UserProps>((set) => ({
    userData: [],

    // Setter for retrieved user data
    setUserData: (data: any) => {
        set({
            userData: data
        })
    },

    // Action to fetch users for a given admin
    getPerson: async (adminId: string | undefined) => {
        if (!adminId) {
            console.error("Admin ID is undefined for getPerson");
            return null;
        }
        try {
            const response = await axios.get(`${api}/admin/get-users/${adminId}`)
            set({
                userData: response.data.data
            })
            return response.data.data;
        } catch (error) {
            console.error("Error fetching persons:", error);
            toast.error("Error fetching users");
            return null;
        }
    },

    // Action for single or bulk user creation (modified)
    createUsers: async (inputData: CreateUserInput, adminId: string | undefined) => {
        if (!adminId) {
            toast.error("Admin ID is missing");
            return;
        }

        // The body for the API call is now the inputData directly
        const body = inputData;

        // Determine the toast message based on single or bulk operation
        const isBulk = Array.isArray(inputData);
        const operationType = isBulk ? 'Bulk user creation' : 'User creation';

        try {
            // Note: The backend endpoint handles whether the body is an array or a single object
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup/${adminId}`,
                body
            );


            if (response.status === 207 && isBulk) {
                // Handle 207 Multi-Status for bulk operation
                const { message, errors } = response.data;
                toast.success(`${message}`);
                if (errors && errors.length > 0) {
                    // Show a specific error for the failed signups
                    toast.error(`Failed to create ${errors.length} user(s). Check console for details.`);
                    console.error("Bulk Signup Errors:", errors);
                }
            } else if (response.status === 201) {
                // Handle 201 Created for single or successful bulk
                toast.success(`${operationType} successful!`);
            } else {
                toast.success(`${operationType} complete.`);
            }


        } catch (error) {
            console.error(`${operationType} error:`, error);

            // Try to extract a specific error message from the response if available
            const errorMessage = axios.isAxiosError(error) && error.response
                ? error.response.data.message || error.response.data.error || 'unexpected error'
                : 'unexpected error';

            toast.error(errorMessage);
        }
    }
}));