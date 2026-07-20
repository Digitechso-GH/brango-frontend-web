"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/api/axios";
import { Badge } from "@/shared/components/ui/Badge";
import { Select } from "@/shared/components/ui/Select";
import { IconMapPinFilled } from "@tabler/icons-react";

interface OrderSideListProps {
  onSelectOrder?: (orderId: string) => void;
}

export const OrderSideList = ({ onSelectOrder }: OrderSideListProps) => {
  const [district, setDistrict] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data.data || [];
    },
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "IN_TRANSIT":
        return <Badge variant="warning">En camino</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Entregado</Badge>;
      case "FAILED":
        return <Badge variant="danger">Fallido</Badge>;
      default:
        return <Badge variant="default">Pendiente</Badge>;
    }
  };

  // Filtrar pedidos
  const filteredOrders = orders.filter((order: any) => {
    // Filtrado por estado
    if (status !== "all") {
      const statusMap: Record<string, string> = {
        pendiente: "PENDING",
        en_camino: "IN_TRANSIT",
        entregado: "DELIVERED",
        fallido: "FAILED",
      };
      if (order.estado !== statusMap[status]) return false;
    }

    // Filtrado básico por distrito/dirección
    if (district !== "all") {
      const dir = (order.direccionOriginal || "").toLowerCase();
      const distName = district.replace("_", " ");
      if (!dir.includes(distName)) return false;
    }

    return true;
  });

  return (
    <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm flex flex-col h-full min-h-[500px]">
      <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] flex flex-col gap-3">
        <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Pedidos Activos</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select 
              value={district}
              onChange={setDistrict}
              options={[
                { label: "Todos (Lima)", value: "all" },
                { label: "San Miguel", value: "san miguel" },
                { label: "Surco", value: "surco" },
                { label: "Miraflores", value: "miraflores" },
                { label: "San Borja", value: "san borja" }
              ]}
            />
          </div>
          <div className="flex-1">
            <Select 
              value={status}
              onChange={setStatus}
              options={[
                { label: "Estado: Todos", value: "all" },
                { label: "Pendientes", value: "pendiente" },
                { label: "En Camino", value: "en_camino" },
                { label: "Entregados", value: "entregado" },
                { label: "Fallidos", value: "fallido" }
              ]}
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
            <div 
              key={order.id} 
              onClick={() => onSelectOrder && onSelectOrder(order.id)}
              className="p-4 rounded-xl border border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 tracking-wider">
                  {order.codigo}
                </span>
                {getStatusBadge(order.estado)}
              </div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1 leading-snug">
                {order.cliente?.nombre || "Cliente"}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                {order.direccionOriginal}
              </p>
              {order.chofer && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-dashed border-gray-100 dark:border-white/5 text-[9px] font-semibold text-accent">
                  <IconMapPinFilled size={10} />
                  <span>{order.chofer.usuario?.nombre || "Chofer"}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
