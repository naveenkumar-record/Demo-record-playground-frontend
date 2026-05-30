const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "auth_access_token";

type RequestOptions = {
  accessToken?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  /** AbortSignal to cancel the in-flight request */
  signal?: AbortSignal;
};

type ApiResponse<TData = undefined> = {
  success: boolean;
  message: string;
  data?: TData;
};

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// Deduplicate concurrent refresh calls - if two requests both get a 401 at the
// same time, only one actual refresh POST is sent; the second awaits the first.
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh-token`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.data?.accessToken) {
        const newToken = data.data.accessToken as string;
        if (typeof window !== "undefined") {
          // Must match auth-client.ts which reads from sessionStorage
          sessionStorage.setItem(ACCESS_TOKEN_KEY, newToken);
          const secure = window.location.protocol === "https:" ? "; Secure" : "";
          document.cookie = `auth_token=${newToken}; path=/; max-age=${16 * 60}; SameSite=Lax${secure}`;
        }
        return newToken;
      }
    } catch {

    }
    return null;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${BASE_URL}/api/v1${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return url.toString();
}

async function request<TData = undefined>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<ApiResponse<TData>> {
  const { headers, params } = options;
  let { accessToken } = options;

  const doFetch = (token?: string) =>
    fetch(buildUrl(path, params), {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
    });

  let response = await doFetch(accessToken);

  // Auto-refresh on 401 then retry once
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      accessToken = refreshed;
      response = await doFetch(refreshed);
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? `Request failed with status ${response.status}`,
      response.status,
      data
    );
  }

  if (!data) {
    throw new ApiError("Invalid server response", response.status);
  }

  return data as ApiResponse<TData>;
}

export const getRequest = <TData = undefined>(
  path: string,
  options?: RequestOptions
): Promise<ApiResponse<TData>> => request<TData>("GET", path, undefined, options);

export const postRequest = <TData = undefined, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: RequestOptions
): Promise<ApiResponse<TData>> => request<TData>("POST", path, body, options);

export const putRequest = <TData = undefined, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: RequestOptions
): Promise<ApiResponse<TData>> => request<TData>("PUT", path, body, options);

export const patchRequest = <TData = undefined, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: RequestOptions
): Promise<ApiResponse<TData>> => request<TData>("PATCH", path, body, options);

export const deleteRequest = <TData = undefined>(
  path: string,
  options?: RequestOptions
): Promise<ApiResponse<TData>> => request<TData>("DELETE", path, undefined, options);

/** Upload a file (FormData) - does NOT set Content-Type so browser adds the boundary */
export const uploadRequest = async <TData = undefined>(
  path: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<ApiResponse<TData>> => {
  const { params } = options;
  let { accessToken } = options;

  const doFetch = (token?: string) =>
    fetch(buildUrl(path, params), {
      method: "POST",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

  let response = await doFetch(accessToken);

  // Auto-refresh on 401 then retry once
  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      accessToken = refreshed;
      response = await doFetch(refreshed);
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? `Upload failed with status ${response.status}`,
      response.status,
      data
    );
  }

  if (!data) throw new ApiError("Invalid server response", response.status);

  return data as ApiResponse<TData>;
};
