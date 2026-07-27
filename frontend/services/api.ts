/**
 * Axios API client — singleton instance for all BandConnect API calls.
 *
 * Interceptors:
 *   Request  — auto-attach JWT Bearer token from localStorage
 *   Response — pass errors through; do NOT redirect on 401 here
 *
 * Why the response interceptor does NOT redirect on 401:
 *   1. AuthProvider calls /auth/me during hydration. A 401 from that call
 *      just means the stored token is expired. AuthProvider calls clearAuth()
 *      and ProtectedRoute redirects after hydration completes. An interceptor
 *      redirect here creates a race condition with the hydration state machine.
 *   2. The login page itself posts to /auth/login. If that returns 401 the
 *      catch block in the login form shows the error toast — a redirect to
 *      /login from within /login creates an infinite loop in history.
 *   3. Developer mode stores a fake (non-JWT) token. The backend returns 401
 *      for it. The interceptor would wipe the dev session before the developer
 *      page can show the dev user in the UI.
 *
 * All redirect logic lives exclusively in ProtectedRoute (client-side) and
 * Next.js middleware (edge).
 */

import { siteConfig } from "@/config/site";
import axios from "axios";

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
