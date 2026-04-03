import axios, { type AxiosResponse, type AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err: AxiosError<{ message?: string; error?: string }>) => {
        const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            'Unknown error';
        return Promise.reject(new Error(message));
    },
);
