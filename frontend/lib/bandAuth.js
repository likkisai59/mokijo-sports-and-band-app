import bandApi, {
    BAND_TOKEN_KEY,
    BAND_USER_ID_KEY,
    BAND_USER_NAME_KEY,
    BAND_ROLE_KEY,
    BAND_EMAIL_KEY,
} from "./bandApi";

export const BAND_ROLES = {
    CLIENT: "client",
    ARTIST: "artist",
    VENUE_OWNER: "venue_owner",
    ADMIN: "admin",
};

export const BAND_ROLE_LABELS = {
    client: "Client",
    artist: "Artist / Band",
    venue_owner: "Venue Owner",
    admin: "Admin",
};

/**
 * Persist a Band session to localStorage after login/register.
 * Backend returns { access_token, user: { id, name, role, email, ... } }
 */
export function saveBandSession({ access_token, user }) {
    if (typeof window === "undefined") return;
    localStorage.setItem(BAND_TOKEN_KEY, access_token);
    localStorage.setItem(BAND_USER_ID_KEY, String(user.id));
    localStorage.setItem(BAND_USER_NAME_KEY, user.name || "");
    localStorage.setItem(BAND_ROLE_KEY, user.role || "client");
    localStorage.setItem(BAND_EMAIL_KEY, user.email || "");
}

export function clearBandSession() {
    if (typeof window === "undefined") return;
    [
        BAND_TOKEN_KEY,
        BAND_USER_ID_KEY,
        BAND_USER_NAME_KEY,
        BAND_ROLE_KEY,
        BAND_EMAIL_KEY,
    ].forEach((k) => localStorage.removeItem(k));
}

export function getBandUser() {
    if (typeof window === "undefined") return null;
    const id = localStorage.getItem(BAND_USER_ID_KEY);
    if (!id) return null;
    return {
        id,
        name: localStorage.getItem(BAND_USER_NAME_KEY) || "",
        role: localStorage.getItem(BAND_ROLE_KEY) || "client",
        email: localStorage.getItem(BAND_EMAIL_KEY) || "",
    };
}

export function isBandAuthenticated() {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem(BAND_TOKEN_KEY));
}

export async function bandLogin(email, password) {
    const { data } = await bandApi.post("/auth/login", { email, password });
    saveBandSession(data);
    return data;
}

export async function bandRegister(payload) {
    // payload: { email, password, name, role, phone? }
    const { data } = await bandApi.post("/auth/register", payload);
    saveBandSession(data);
    return data;
}

export async function bandLogout() {
    clearBandSession();
}
