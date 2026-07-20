import React, { useState } from "react";
import { Badge } from "@/shared/components/ui/Badge";
import { Select } from "@/shared/components/ui/Select";
import { IconMapPinFilled } from "@tabler/icons-react";

interface OrderSideListProps {
  onSelectOrder?: (orderId: string) => void;
}

export const OrderSideList = ({ onSelectOrder }: OrderSideListProps) => {
  const [district, setDistrict] = useState("all");
  const [status, setStatus] = useState("all");

  const mockOrders = [
    { id: "PED-1029", guia: "004521", unit: "Unidad 01", client: "Supermercados Wong", status: "en_camino", address: "Av. La Marina 123, San Miguel" },
    { id: "PED-1030", guia: "004522", unit: null, client: "Distribuidora del Sur", status: "pendiente", address: "Av. Los Proceres 456, Surco" },
    { id: "PED-1031", guia: "004523", unit: "Unidad 02", client: "Tiendas Tambo", status: "entregado", address: "Jr. de la Unión 789, Cercado" },
    { id: "PED-1032", guia: "004524", unit: "Unidad 03", client: "Oxxo Express", status: "en_camino", address: "Av. Javier Prado Este 901, San Borja" },
    { id: "PED-1033", guia: "004525", unit: null, client: "Mercado Central", status: "pendiente", address: "Jr. Puno 202, Cercado" },
  ];

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
                { label: "San Miguel", value: "san_miguel" },
                { label: "Surco", value: "surco" },
                { label: "Miraflores", value: "miraflores" }
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
                { label: "Entregados", value: "entregado" }
              ]}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-2">
        {mockOrders.map((order) => (
          <div 
            key={order.id} 
            onClick={() => onSelectOrder && onSelectOrder(order.id)}
            className="p-4 rounded-xl border border-gray-100 dark:border-[#2D2D3D] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 pr-2">{order.client}</p>
              <Badge variant={
                order.status === 'en_camino' ? 'warning' : 
                order.status === 'entregado' ? 'success' : 'default'
              } className="shrink-0">
                {order.status.replace("_", " ")}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 mb-2 text-gray-500 dark:text-gray-400">
              <IconMapPinFilled size={12} className={`shrink-0 ${
                order.status === 'en_camino' ? 'text-amber-500' : 
                order.status === 'entregado' ? 'text-emerald-500' : 'text-gray-400'
              }`} />
              <p className="text-xs font-medium line-clamp-1">{order.address}</p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-gray-400">Guía #{order.guia}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              {order.unit ? (
                <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                  {order.unit}
                </span>
              ) : (
                <span className="text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  Sin asignar
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
