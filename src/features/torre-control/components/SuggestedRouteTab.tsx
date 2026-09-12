"use client";

import React, { useState, useEffect } from "react";
import {
  IconRefresh,
  IconDeviceFloppy,
  IconSteeringWheel,
} from "@tabler/icons-react";
import { Select } from "@/shared/components/ui/Select";
import { routesApi } from "../api/routes.api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSuggestedRoutesQuery } from "../hooks/useSuggestedRoutes";
import { SuggestedRoute } from "../types/suggested-routes.schemas";

interface SuggestedRouteTabProps {
  todayStr: string;
  driverOptions: Array<{ label: string; value: string }>;
  onSelectRouteForMap: (orderIds: string[]) => void;
  onRouteSaved?: () => void;
}

export const SuggestedRouteTab: React.FC<SuggestedRouteTabProps> = ({
  todayStr,
  driverOptions,
  onSelectRouteForMap,
  onRouteSaved,
}) => {
  const queryClient = useQueryClient();
  const [driverId, setDriverId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const {
    data: suggestedRoutes = [],
    isLoading,
    isFetching,
    refetch,
  } = useSuggestedRoutesQuery(todayStr);

  // Sincronizar primera ruta sugerida automáticamente al cargar
  useEffect(() => {
    if (suggestedRoutes.length > 0) {
      const exists = suggestedRoutes.some((r) => r.id === selectedRouteId);
      if (!exists) {
        const first = suggestedRoutes[0];
        setSelectedRouteId(first.id);
        onSelectRouteForMap(first.orderIds);
      }
    }
  }, [suggestedRoutes, selectedRouteId, onSelectRouteForMap]);

  const activeRoute =
    suggestedRoutes.find((r) => r.id === selectedRouteId) || suggestedRoutes[0] || null;

  const handleSelectRoute = (route: SuggestedRoute) => {
    setSelectedRouteId(route.id);
    onSelectRouteForMap(route.orderIds);
  };

  const handleDispatchRoute = async () => {
    if (!activeRoute) return;
    if (!driverId) {
      toast.error("Debes seleccionar un chofer para despachar esta ruta");
      return;
    }

    try {
      setIsSaving(true);
      await routesApi.createRoute({
        name: activeRoute.name,
        driverId,
        date: todayStr,
        assignments: activeRoute.orderIds.map((id) => ({ orderId: id })),
      });

      toast.success(`¡${activeRoute.name} despachada correctamente!`);
      setDriverId("");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suggested-routes"] }),
        queryClient.invalidateQueries({ queryKey: ["orders-today"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["available-drivers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-routes"] }),
      ]);

      if (onRouteSaved) onRouteSaved();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al despachar la ruta";
      toast.error(msg);
      queryClient.invalidateQueries({ queryKey: ["suggested-routes"] });
      queryClient.invalidateQueries({ queryKey: ["orders-today"] });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-[#2D2D3D] bg-gray-50/30 dark:bg-white/[0.01] flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-gray-900 dark:text-white">Rutas Sugeridas</h2>
          <p className="text-[10px] text-gray-400">
            Selecciona una ruta para previsualizarla en el mapa
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
          title="Actualizar"
        >
          <IconRefresh
            size={14}
            className={isFetching ? "animate-spin text-blue-600" : ""}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-gray-400">
            Calculando rutas óptimas...
          </div>
        ) : suggestedRoutes.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Sin sugerencias pendientes
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Todos los pedidos disponibles ya tienen ruta o están en pausa.
            </p>
          </div>
        ) : (
          suggestedRoutes.map((route) => {
            const isSelected = activeRoute?.id === route.id;

            return (
              <div
                key={route.id}
                onClick={() => handleSelectRoute(route)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/10 shadow-xs ring-1 ring-blue-500/20"
                    : "border-gray-100 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24] hover:border-gray-200 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      {route.name}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    ~{route.estimatedDistanceKm} km
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                  <span>
                    {route.totalStops} {route.totalStops === 1 ? "parada" : "paradas"} · {route.totalOrders} {route.totalOrders === 1 ? "pedido" : "pedidos"}
                  </span>

                  <div className="flex items-center gap-1">
                    {route.criticalCount > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                        {route.criticalCount} crítico
                      </span>
                    )}
                    {route.warningCount > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50">
                        {route.warningCount} por vencer
                      </span>
                    )}
                    {route.freshCount > 0 && route.criticalCount === 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                        Al día
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeRoute && (
        <div className="p-3 border-t border-gray-100 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24] space-y-2">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
              Asignar a {activeRoute.name}
            </label>
            <Select
              value={driverId}
              onChange={setDriverId}
              options={driverOptions}
              placeholder="Seleccionar chofer..."
              size="sm"
              icon={<IconSteeringWheel size={14} className="text-gray-400" />}
              className="w-full"
            />
          </div>

          <button
            type="button"
            onClick={handleDispatchRoute}
            disabled={!driverId || isSaving}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg shadow-sm shadow-blue-500/20 text-xs transition-all cursor-pointer"
          >
            <IconDeviceFloppy size={14} />
            <span>{isSaving ? "Despachando..." : "Despachar Ruta"}</span>
          </button>
        </div>
      )}
    </>
  );
};
