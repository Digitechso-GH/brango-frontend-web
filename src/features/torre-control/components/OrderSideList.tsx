"use client";

import React, { useState } from "react";
import {
  useDriversQuery,
  usePedidosTodayQuery,
  usePausedOrdersQuery,
  useResumeOrderMutation,
} from "@/features/pedidos/hooks/usePedidosQueries";
import { Select } from "@/shared/components/ui/Select";
import { OrderCard } from "@/shared/components/ui/OrderCard";
import { PauseOrderModal } from "./PauseOrderModal";
import { toast } from "sonner";
import {
  ORDER_STATUS_FILTER_OPTIONS,
  FRONTEND_TO_BACKEND_STATUS_MAP,
} from "@/shared/constants/order-status";

interface OrderSideListProps {
  onSelectOrder?: (orderId: string) => void;
  onFocusOrder?: (order: any) => void;
}

export const OrderSideList = ({ onSelectOrder, onFocusOrder }: OrderSideListProps) => {
  const [activeTab, setActiveTab] = useState<"active" | "paused">("active");
  const [selectedDriver, setSelectedDriver] = useState("all");
  const [status, setStatus] = useState("all");
  const [orderToPause, setOrderToPause] = useState<any | null>(null);

  const { data: ordersResponse, isLoading: isLoadingToday } = usePedidosTodayQuery();
  const allTodayOrders = ordersResponse?.data || [];
  const { data: pausedOrders = [], isLoading: isLoadingPaused } = usePausedOrdersQuery();
  const { data: drivers = [] } = useDriversQuery();
  const resumeMutation = useResumeOrderMutation();

  const handleResumeOrder = async (order: any) => {
    try {
      await resumeMutation.mutateAsync(order.id);
      toast.success(`Pedido #${order.code} reanudado. Ya está disponible en el mapa.`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "No se pudo reanudar el pedido. Intente nuevamente.",
      );
    }
  };

  const driverOptions = [
    { label: "Chofer: Todos", value: "all" },
    { label: "Sin asignar", value: "unassigned" },
    ...drivers.map((d: any) => ({
      label: d.name || "Sin nombre",
      value: d.id,
    })),
  ];

  // Filtrar pedidos según estado y chofer seleccionado
  const filteredOrders = allTodayOrders.filter((order: any) => {
    if (status !== "all") {
      const targetStatus = FRONTEND_TO_BACKEND_STATUS_MAP[status];
      if (order.status !== targetStatus) return false;
    }

    if (selectedDriver !== "all") {
      const orderDriverId = order.driverId;
      if (selectedDriver === "unassigned") {
        if (orderDriverId) return false;
      } else {
        if (orderDriverId !== selectedDriver) return false;
      }
    }

    return true;
  });

  return (
    <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header con Pestañas */}
      <div className="p-3.5 border-b border-gray-100 dark:border-[#2D2D3D] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-gray-100 dark:bg-[#14141E] p-1 rounded-xl w-full">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "active"
                  ? "bg-white dark:bg-[#1C1C28] text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <span>Activos</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "active"
                    ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {allTodayOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("paused")}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "paused"
                  ? "bg-white dark:bg-[#1C1C28] text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <span>Pausados</span>
              {pausedOrders.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black">
                  {pausedOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filtros solo visibles en pestaña de pedidos activos */}
        {activeTab === "active" && (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={selectedDriver}
                onChange={setSelectedDriver}
                options={driverOptions}
              />
            </div>
            <div className="flex-1">
              <Select
                value={status}
                onChange={setStatus}
                options={ORDER_STATUS_FILTER_OPTIONS}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-2">
        {activeTab === "active" ? (
          isLoadingToday ? (
            <div className="text-center py-8 text-xs text-gray-400">Cargando pedidos...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">No se encontraron pedidos activos.</div>
          ) : (
            filteredOrders.map((order: any) => (
              <OrderCard
                key={order.id}
                order={order}
                onFocusOrder={onFocusOrder}
                onSelectOrder={onSelectOrder}
                onPauseOrder={(ord) => setOrderToPause(ord)}
              />
            ))
          )
        ) : isLoadingPaused ? (
          <div className="text-center py-8 text-xs text-gray-400">Cargando pedidos pausados...</div>
        ) : pausedOrders.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-2 text-gray-400">
            <span className="text-2xl">📦</span>
            <p className="text-xs font-semibold">No hay pedidos pausados</p>
            <p className="text-[11px] text-gray-500 text-center max-w-[200px]">
              Los pedidos sin stock o reprogramados que pongas en pausa aparecerán aquí.
            </p>
          </div>
        ) : (
          pausedOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              isPausedView={true}
              onFocusOrder={onFocusOrder}
              onResumeOrder={handleResumeOrder}
            />
          ))
        )}
      </div>

      {/* Modal de Pausa */}
      <PauseOrderModal
        order={orderToPause}
        onClose={() => setOrderToPause(null)}
      />
    </div>
  );
};
