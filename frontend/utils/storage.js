/**
 * Helper to safely extract keys from localStorage.
 * Handles server-side rendering (SSR) checking.
 */
export function getStorageItem(key, defaultValue) {
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
export function setStorageItem(key, value) {
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
export function removeStorageItem(key) {
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
export function setCookie(name, value, days = 7) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (error) {
    console.error("cookie set error:", error);
  }
}

/**
 * Helper to clear keys from cookies.
 */
export function removeCookie(name) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  } catch (error) {
    console.error("cookie remove error:", error);
  }
}
