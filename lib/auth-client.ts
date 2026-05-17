import { AuthUser } from "@/interfaces/auth.interface";

export const AUTH_ACCESS_TOKEN_KEY = "auth_access_token";
export const AUTH_USER_KEY = "auth_user";

export const AUTH_TOKEN_COOKIE = "auth_token";
/** Slightly longer than the 15-min JWT to avoid race conditions on SSR reads */
const COOKIE_MAX_AGE_SECONDS = 16 * 60;

const setTokenCookie = (token: string): void => {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_TOKEN_COOKIE}=${token}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
};

const clearTokenCookie = (): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
};

export const setAuthSession = (accessToken: string, user?: AuthUser): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, accessToken);
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
  setTokenCookie(accessToken);
};

export const clearAuthSession = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  clearTokenCookie();
};

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
};

export const getAuthUser = (): AuthUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
};

export const getErrorMessage = (error: unknown, fallback = "Something went wrong. Please try again."): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};
