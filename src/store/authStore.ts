import { api } from '@/utils/constatns';
import axios, { AxiosError } from 'axios';
import { create } from 'zustand';

// --- Interfaces ---

interface LoginPayload {
    email: string;
    password: string;
}

interface UserData {
    id: number;
    email: string;
    name: string;
}

interface AuthState {
    token: string | null;
    userData: UserData | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    error: string | null;
    isInitialized: boolean;
}

interface AuthActions {
    login: (payload: LoginPayload) => Promise<boolean>;
    logout: () => void;
}

type AuthStore = AuthState & AuthActions;

// --- Helper function for localStorage Keys ---
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'userData';


// --- Zustand Store Implementation ---
export const useAuthStore = create<AuthStore>((set, get) => ({

    token: null,
    userData: null,
    isLoading: false,
    isLoggedIn: false,
    error: null,
    isInitialized: false,


    login: async (payload: LoginPayload): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {


            const response = await axios.post(`${api}/admin/login`, payload);
            const { token, tokenPayload } = response.data;

            // 1. Save details to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(AUTH_TOKEN_KEY, token);
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(tokenPayload));
            }

            // 2. Update Zustand state
            set({
                token: token,
                userData: tokenPayload,
                isLoading: false,
                isLoggedIn: true,
                isInitialized: true,
            });
            return true;

        } catch (err) {
            const axiosError = err as AxiosError<{ message?: string }>;
            const errorMessage = axiosError.response?.data?.message || 'Login failed due to an unexpected error.';

            set({
                token: null,
                userData: null,
                isLoading: false,
                isLoggedIn: false,
                error: errorMessage,
                isInitialized: true,
            });

            if (typeof window !== 'undefined') {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                localStorage.removeItem(USER_DATA_KEY);
            }
            return false;
        }
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(USER_DATA_KEY);
        }

        set({
            token: null,
            userData: null,
            error: null,
            isLoading: false,
            isLoggedIn: false,
            isInitialized: true,
        });
    },

    // CRITICAL: This action reads data back from localStorage and rehydrates the store
}));
