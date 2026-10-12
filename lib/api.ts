import axios, { type AxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<void> | undefined;
let redirectingToLogin = false;

async function forceLogin() {
  if (typeof window === "undefined" || redirectingToLogin) return;
  redirectingToLogin = true;
  try {
    await signOut({ callbackUrl: "/login" });
  } catch {
    window.location.assign("/login");
  }
}

function refreshSession() {
  refreshPromise ??= fetch("/api/auth/refresh", { method: "POST" })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? "Session refresh failed");
      }

      return payload;
    })
    .finally(() => {
      refreshPromise = undefined;
    });
  return refreshPromise;
}

client.interceptors.request.use(async (config) => {
  const session = (await getSession()) as (Awaited<ReturnType<typeof getSession>> & {
    accessToken?: string;
    error?: string;
  }) | null;

  if (session?.error) {
    await forceLogin();
    return Promise.reject(new Error("Session expired"));
  }

  if (session?.accessToken) {
    config.headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  return config;
});

client.interceptors.response.use(undefined, async (error) => {
  const config = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

  if (error.response?.status !== 401 || !config || config._retry) {
    return Promise.reject(error);
  }

  config._retry = true;
  try {
    await refreshSession();
  } catch {
    await forceLogin();
    return Promise.reject(error);
  }

  const refreshed = (await getSession()) as (Awaited<ReturnType<typeof getSession>> & {
    accessToken?: string;
    error?: string;
  }) | null;
  if (!refreshed?.accessToken || refreshed.error) {
    await forceLogin();
    return Promise.reject(error);
  }

  config.headers = { ...config.headers, Authorization: `Bearer ${refreshed.accessToken}` };
  return client.request(config);
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

function handleError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data;
    const message =
      errorData?.message ||
      (typeof errorData?.detail === "string" ? errorData.detail : null) ||
      (Array.isArray(errorData?.detail) ? errorData.detail[0]?.msg : null) ||
      error.message ||
      "An unexpected API error occurred";
    const code = errorData?.error?.code;
    const details = errorData?.error?.details || errorData?.detail;
    throw new ApiError(message, error.response?.status, code, details);
  }
  throw error;
}

function unwrapResponse<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  ) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

export const api = {
  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await client.get<unknown>(path, config);
      return unwrapResponse<T>(response.data);
    } catch (error) {
      handleError(error);
    }
  },

  async post<T, B = unknown>(path: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await client.post<unknown>(path, body, config);
      return unwrapResponse<T>(response.data);
    } catch (error) {
      handleError(error);
    }
  },

  async put<T, B = unknown>(path: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await client.put<unknown>(path, body, config);
      return unwrapResponse<T>(response.data);
    } catch (error) {
      handleError(error);
    }
  },

  async patch<T, B = unknown>(path: string, body?: B, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await client.patch<unknown>(path, body, config);
      return unwrapResponse<T>(response.data);
    } catch (error) {
      handleError(error);
    }
  },

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await client.delete<unknown>(path, config);
      return unwrapResponse<T>(response.data);
    } catch (error) {
      handleError(error);
    }
  },

  async upload<T>(path: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await client.post<unknown>(path, formData, {
        ...config,
        headers: {
          ...config?.headers,
          "Content-Type": "multipart/form-data",
        },
      });
      return unwrapResponse<T>(response.data);
    } catch (error) {
      handleError(error);
    }
  },
};
