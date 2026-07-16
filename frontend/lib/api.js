import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include userId/owner_id and Authorization header if available
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        const userId = localStorage.getItem("userId");
        if (userId) {
            if (config.method === "get") {
                config.params = { ...config.params, owner_id: userId };
            } else if (config.method === "post" || config.method === "put") {
                if (typeof config.data === "object" && !config.data.owner_id) {
                    config.data.owner_id = userId;
                }
            }
        }
    }
    return config;
});

export default api;
