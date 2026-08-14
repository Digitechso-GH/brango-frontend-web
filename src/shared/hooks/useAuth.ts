"use client";

import { useState, useEffect } from "react";
import api from "@/shared/api/axios";
import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verificar sesión activa
    api
      .get("/auth/me")
      .then((res) => {
        const userData = res.data.data || res.data;
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (credentials: Record<string, any>) => {
    setIsLoading(true);
    try {
      const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const data = res.data.data || res.data;
      setUser(data.user || data);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      setUser(null);
      setIsLoading(false);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };
};
