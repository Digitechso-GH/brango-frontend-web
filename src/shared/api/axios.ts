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

// --- COLA DE ESPERA PARA PETICIONES CONCURRENTES DURANTE EL REFRESH ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- RESPONSE INTERCEPTORS: REFRESH AUTOMÁTICO TRANSPARENTE ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authStorage = localStorage.getItem("auth-storage");
        let refreshToken = "";
        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            refreshToken = parsed?.state?.refreshToken;
          } catch {
            // Error parsing storage
          }
        }

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Llamar con instancia pura de axios para evitar loops en interceptores
        const res = await axios.post(`${apiUrl}/auth/refresh`, { refreshToken });
        const data = res.data.data ?? res.data;
        const newToken = data.token;
        const newRefreshToken = data.refreshToken;

        if (authStorage) {
          try {
            const parsed = JSON.parse(authStorage);
            parsed.state.token = newToken;
            if (newRefreshToken) parsed.state.refreshToken = newRefreshToken;
            localStorage.setItem("auth-storage", JSON.stringify(parsed));
          } catch {
            // Storage update error
          }
        }

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        // Acceso prohibido por rol
      } else if (status === 500) {
        toast.error("Ocurrió un error interno en el servidor. Por favor, intente de nuevo.");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
