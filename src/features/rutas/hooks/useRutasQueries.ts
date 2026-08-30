import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rutasApi } from "../api/rutas.api";
import { toast } from "sonner";

export const useRoutesQuery = (params?: {
  date?: string;
  driverId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["admin-routes", params],
    queryFn: () => rutasApi.getRoutes(params),
  });
};

export const useRouteDetailQuery = (id: string | null) => {
  return useQuery({
    queryKey: ["admin-route-detail", id],
    queryFn: () => (id ? rutasApi.getRouteDetail(id) : null),
    enabled: !!id,
  });
};

export const useDeleteRouteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rutasApi.deleteRoute(id),
    onSuccess: () => {
      toast.success("Ruta eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos-today"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "No se pudo eliminar la ruta");
    },
  });
};
