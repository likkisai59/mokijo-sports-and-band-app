import { siteConfig } from "@/config/site";
import axios from "axios";

export const API_BASE_URL = siteConfig.apiUrl || "http://127.0.0.1:8001";

export const api = axios.create({
  baseURL: `${siteConfig.apiUrl}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT Bearer token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Pass responses and errors through — no automatic redirects
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
