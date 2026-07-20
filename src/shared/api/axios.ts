import axios from "axios";
import { toast } from "sonner";


// --- AXIOS INSTANCE CONFIGURATION ---

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  withCredentials: true,
});


// --- RESPONSE INTERCEPTORS ---

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        if (typeof window !== "undefined") {
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
