import { useQuery } from "@tanstack/react-query";
import { pedidosApi } from "../api/pedidos.api";

export const usePedidosQuery = (params?: { search?: string; page?: number; limit?: number; driverId?: string }) => {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => pedidosApi.getOrders(params),
  });
};

export const usePedidosTodayQuery = (driverId?: string) => {
  return useQuery({
    queryKey: ["orders-today", driverId],
    queryFn: () => pedidosApi.getOrdersToday(driverId),
  });
};

export const useDriversQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: pedidosApi.getDrivers,
    enabled,
  });
};

export const useAvailableDriversQuery = (date?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["available-drivers", date],
    queryFn: () => pedidosApi.getAvailableDrivers(date),
    enabled,
  });
};

export const useSedesQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["sedes"],
    queryFn: pedidosApi.getSedes,
    enabled,
  });
};

export const useDuplicateSuggestionsQuery = (date?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["duplicate-suggestions", date],
    queryFn: () => pedidosApi.getDuplicateSuggestions(date),
    enabled,
  });
};
