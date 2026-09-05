import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export const usePausedOrdersQuery = () => {
  return useQuery({
    queryKey: ["orders-paused"],
    queryFn: pedidosApi.getPausedOrders,
  });
};

export const usePauseOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      pedidosApi.pauseOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-today"] });
      queryClient.invalidateQueries({ queryKey: ["orders-paused"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useResumeOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pedidosApi.resumeOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders-today"] });
      queryClient.invalidateQueries({ queryKey: ["orders-paused"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
