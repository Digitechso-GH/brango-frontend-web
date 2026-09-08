"use client";

import React, { useState } from "react";
import { useDriversQuery, usePedidosTodayQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { Select } from "@/shared/components/ui/Select";
import { OrderCard } from "@/shared/components/ui/OrderCard";
import {
  ORDER_STATUS_FILTER_OPTIONS,
  FRONTEND_TO_BACKEND_STATUS_MAP,
} from "@/shared/constants/order-status";

interface OrderSideListProps {
  onSelectOrder?: (orderId: string) => void;
  onFocusOrder?: (order: any) => void;
}

export const OrderSideList = ({ onSelectOrder, onFocusOrder }: OrderSideListProps) => {
  const [selectedDriver, setSelectedDriver] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: ordersResponse, isLoading } = usePedidosTodayQuery();
  const allTodayOrders = ordersResponse?.data || [];
  const { data: drivers = [] } = useDriversQuery();

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
      <div className="p-3 border-b border-gray-100 dark:border-[#2D2D3D] flex flex-col gap-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
          Pedidos Activos
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={selectedDriver}
              onChange={setSelectedDriver}
              options={driverOptions}
              size="sm"
            />
          </div>
          <div className="flex-1">
            <Select
              value={status}
              onChange={setStatus}
              options={ORDER_STATUS_FILTER_OPTIONS}
              size="sm"
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-2">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-gray-400">Cargando pedidos...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">No se encontraron pedidos.</div>
        ) : (
          filteredOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              onFocusOrder={onFocusOrder}
              onSelectOrder={onSelectOrder}
            />
          ))
        )}
      </div>
    </div>
  );
};
