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

export const useSedesQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["sedes"],
    queryFn: pedidosApi.getSedes,
    enabled,
  });
};
