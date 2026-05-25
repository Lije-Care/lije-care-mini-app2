import axios from "axios";
import { clearLocalSession } from "@/utils/logout";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

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

    return response;
  },
  (error) => {
    const status = error?.response?.status;

    if (
      typeof window !== "undefined" &&
      status === 401 &&
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
