import { useQuery } from "@tanstack/react-query";
import { pedidosApi } from "../api/pedidos.api";

export const usePedidosQuery = (params?: { driverId?: string; todayOnly?: boolean; date?: string }) => {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => pedidosApi.getOrders(params),
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
