import axios from "axios";
import { toast } from "sonner";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_API_URL");
}

// --- AXIOS INSTANCE CONFIGURATION ---
const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

// --- REQUEST INTERCEPTOR: BEARER TOKEN & HEADERS CENTRALIZADOS ---
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          const token = parsed?.state?.token || parsed?.token;
          if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          // Token no parseable
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTORS ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      } else if (status === 500) {
        toast.error("Ocurrió un error interno en el servidor. Por favor, intente de nuevo.");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
