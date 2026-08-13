import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

// localStorage keys — kept separate from Mokijo's auth so the two apps
// (sports/club + band) can coexist in the same browser without collisions.
export const BAND_TOKEN_KEY = "bandAccessToken";
export const BAND_USER_ID_KEY = "bandUserId";
export const BAND_USER_NAME_KEY = "bandUserName";
export const BAND_ROLE_KEY = "bandRole";
export const BAND_EMAIL_KEY = "bandEmail";

// Prefixed so the band client only hits Band endpoints.
export const BAND_API_PREFIX = "/band";

const bandApi = axios.create({
    baseURL: `${API_BASE_URL}${BAND_API_PREFIX}`,
});

// Attach the Band JWT to every request when available.
bandApi.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem(BAND_TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default bandApi;
