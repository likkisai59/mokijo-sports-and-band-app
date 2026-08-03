import { API_BASE_URL } from "@/lib/api";

/**
 * Normalizes access token from API response payloads.
 * Supports both camelCase `accessToken` and snake_case `access_token`.
 */
export function normalizeToken(data) {
    if (!data) return "";
    const token = data.accessToken || data.access_token || "";
    if (typeof token === "string" && token && token !== "undefined" && token !== "null") {
        return token;
    }
    return "";
}

/**
 * Wraps login fetch request with an AbortController timeout to guarantee completion.
 */
export async function loginRequest(endpoint, bodyData, options = {}) {
    const { timeoutMs = 20000 } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (response.ok) {
            return { ok: true, status: response.status, data };
        } else {
            return {
                ok: false,
                status: response.status,
                data,
                detail: data.detail || `Request failed with status ${response.status}`,
            };
        }
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
            return { ok: false, detail: "Server took too long to respond. Please try again." };
        }
        return { ok: false, detail: "Cannot connect to server. Is the backend running?" };
    }
}

/**
 * Persists session data into localStorage consistently.
 */
export function persistSportsSession(sessionMap) {
    if (typeof window === "undefined" || !sessionMap) return;

    Object.entries(sessionMap).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            localStorage.setItem(key, String(value));
        }
    });

    const token = normalizeToken(sessionMap);
    if (token) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("access_token", token);
    }
}

/**
 * Hard navigates to target path after setting session keys.
 */
export function navigateToDashboard(targetPath) {
    if (typeof window !== "undefined") {
        window.location.assign(targetPath);
    }
}
