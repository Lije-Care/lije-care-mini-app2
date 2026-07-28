import axios from "axios";
import { clearLocalSession } from "@/utils/logout";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const resolveMediaUrl = (value?: string | null): string => {
  const raw = String(value ?? "").trim();
  if (!raw || /^(https?:|data:|blob:)/i.test(raw)) return raw;
  const baseUrl = axiosInstance.defaults.baseURL;
  if (!baseUrl) return raw;
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return raw;
  }
};

const resolveResponseMediaUrls = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(resolveResponseMediaUrls);
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(record)) {
    record[key] = key === "imageUrl" && typeof item === "string"
      ? resolveMediaUrl(item)
      : resolveResponseMediaUrls(item);
  }
  return record;
};

export const getPreferredLanguage = () =>
  localStorage.getItem("user-language") || "en";

const AUTH_RECOVERY_FLAG = "auth_recovery_in_progress";

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTH_RECOVERY_FLAG);
    }

    response.data = resolveResponseMediaUrls(response.data);
    return response;
  },
  (error) => {
    const status = error?.response?.status;

    if (
      typeof window !== "undefined" &&
      status === 401 &&
      !String(error?.config?.url ?? "").includes("/auth/telegram/session") &&
      !sessionStorage.getItem(AUTH_RECOVERY_FLAG)
    ) {
      sessionStorage.setItem(AUTH_RECOVERY_FLAG, "true");
      clearLocalSession();
      window.location.reload();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
