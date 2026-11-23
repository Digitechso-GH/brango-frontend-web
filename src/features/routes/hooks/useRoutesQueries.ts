import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routesApi } from "../api/routes.api";
import { toast } from "sonner";

export const useRoutesQuery = (params?: {
  date?: string;
  fromDate?: string;
  driverId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["admin-routes", params],
    queryFn: () => routesApi.getRoutes(params),
  });
};

export const useRouteDetailQuery = (id: string | null) => {
  return useQuery({
    queryKey: ["admin-route-detail", id],
    queryFn: () => (id ? routesApi.getRouteDetail(id) : null),
    enabled: !!id,
  });
};

export const useDeleteRouteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => routesApi.deleteRoute(id),
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
