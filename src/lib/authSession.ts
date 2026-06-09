export const AUTH_STORAGE_KEYS = [
  "adnflix_auth_token",
  "adnflix_user_id",
  "adnflix_user_name",
  "adnflix_watchlist",
  "adnflix_favorites",
  "adnflix_reviews",
  "adnflix_history",
] as const;

export const clearUserSession = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("adnflix_sync"));
};

export const getAuthToken = () => localStorage.getItem("adnflix_auth_token");

export const getCurrentUserId = () => {
  const raw = localStorage.getItem("adnflix_user_id");
  return raw ? Number(raw) : null;
};

export const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error("Failed to decode JWT payload", error);
    return null;
  }
};
