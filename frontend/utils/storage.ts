/**
 * Helper to safely extract keys from localStorage.
 * Handles server-side rendering (SSR) checking.
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("localStorage get error:", error);
    return defaultValue;
  }
}

/**
 * Helper to safely write keys into localStorage.
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("localStorage set error:", error);
  }
}

/**
 * Helper to safely clear keys from localStorage.
 */
export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error("localStorage remove error:", error);
  }
}

/**
 * Helper to write keys into cookies.
 */
export function setCookie(name: string, value: string, days = 7): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    // NOTE: Do NOT add the `Secure` flag here — it causes browsers to silently
    // discard the cookie on HTTP origins (http://localhost). The Next.js
    // middleware reads this cookie to gate dashboard routes; if it is never
    // stored the user is always redirected to /login even after a successful
    // login. The `Secure` attribute is enforced by the reverse-proxy / CDN
    // layer (nginx / Vercel) in production environments.
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (error) {
    console.error("cookie set error:", error);
  }
}

/**
 * Helper to clear keys from cookies.
 */
export function removeCookie(name: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  } catch (error) {
    console.error("cookie remove error:", error);
  }
}

