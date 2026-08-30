"use client";

import React, { useEffect, useState } from "react";
import { useAvailableDriversQuery, usePedidosTodayQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { IconMapPin, IconGripVertical, IconPlus, IconX, IconDeviceFloppy } from "@tabler/icons-react";
import { routesApi } from "../api/routes.api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ORDER_STATUS } from "@/shared/constants/order-status";

interface RouteBuilderPanelProps {
  onRouteSaved?: () => void;
  selectedOrderIds: string[];
  onSelectOrder: (id: string) => void;
  onRemoveOrder: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
}

export const RouteBuilderPanel: React.FC<RouteBuilderPanelProps> = ({
  onRouteSaved,
  selectedOrderIds,
  onSelectOrder,
  onRemoveOrder,
  onReorder
}) => {
  const queryClient = useQueryClient();
  const [routeName, setRouteName] = useState("");
  const [driverId, setDriverId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: driversResponse } = useAvailableDriversQuery();
  const availableDrivers = Array.isArray(driversResponse) ? driversResponse : [];

  const { data: ordersResponse } = usePedidosTodayQuery();
  const allOrders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.data || []);

  const pendingOrders = allOrders.filter(
    (o: any) => o.status === ORDER_STATUS.PENDING && !o.routeAssignmentId && !o.driverId
  );

  const [localOrderIds, setLocalOrderIds] = useState<string[]>(selectedOrderIds);

  // Sincronizar estado local con props (cuando se agregan/quitan pedidos desde fuera)
  useEffect(() => {
    setLocalOrderIds(selectedOrderIds);
  }, [selectedOrderIds]);

  const selectedOrdersData = localOrderIds.map(id => allOrders.find((o: any) => o.id === id)).filter(Boolean);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newArr = [...localOrderIds];
    const draggedItem = newArr[draggedIdx];
    newArr.splice(draggedIdx, 1);
    newArr.splice(idx, 0, draggedItem);
    
    setLocalOrderIds(newArr);
    setDraggedIdx(idx);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIdx(null);
    // SOLO propagar el cambio al padre (y al mapa) cuando el drag termina
    onReorder(localOrderIds);
  };

  const handleSaveRoute = async () => {
    if (!driverId) {
      toast.error("Debes seleccionar un chofer");
      return;
    }
    if (selectedOrderIds.length === 0) {
      toast.error("Debes agregar al menos un pedido a la ruta");
      return;
    }

    try {
      setIsSaving(true);
      await routesApi.createRoute({
        name: routeName || undefined,
        driverId,
        date: new Date(date).toISOString(),
        assignments: selectedOrderIds.map(id => ({ orderId: id }))
      });
      toast.success("¡Ruta creada y asignada correctamente!");
      setRouteName("");
      setDriverId("");
      
      // Invalidar caché para que los pedidos desaparezcan de los "Pendientes"
      await queryClient.invalidateQueries({ queryKey: ["orders-today"] });
      await queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
      
      if (onRouteSaved) onRouteSaved();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear la ruta");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1A1A24] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2D2D3D] overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-[#2D2D3D] bg-gray-50/50 dark:bg-white/5">
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Armar Nueva Ruta</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Nombre de la Ruta (Opcional)</label>
            <input 
              type="text" 
              value={routeName}
              onChange={e => setRouteName(e.target.value)}
              placeholder="Ej. Ruta Norte Mañana"
              className="w-full bg-white dark:bg-[#13131A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white dark:bg-[#13131A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Chofer Disponible</label>
              <select 
                value={driverId}
                onChange={e => setDriverId(e.target.value)}
                className="w-full bg-white dark:bg-[#13131A] border border-gray-200 dark:border-[#2D2D3D] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Seleccione...</option>
                {availableDrivers.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name} {d.unit ? `(${d.unit})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
            <span>Paradas en la Ruta</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedOrderIds.length}</span>
          </h3>
          
          {selectedOrdersData.length === 0 ? (
            <div className="text-center p-6 border-2 border-dashed border-gray-200 dark:border-[#2D2D3D] rounded-xl">
              <IconMapPin className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500">Haz clic en los marcadores rojos del mapa o añádelos desde la lista de pendientes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedOrdersData.map((order, idx) => (
                <div 
                  key={order.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  className={`flex items-center gap-3 p-3 bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-xl shadow-sm transition-all ${draggedIdx === idx ? 'opacity-50' : 'cursor-grab active:cursor-grabbing'}`}
                >
                  <div className="text-gray-400">
                    <IconGripVertical size={16} />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{order.code}</p>
                    <p className="text-xs text-gray-500 truncate">{order.recipientName || order.customer?.name}</p>
                  </div>
                  <button onClick={() => onRemoveOrder(order.id)} className="text-gray-400 hover:text-red-500">
                    <IconX size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Pendientes sin Ruta</h3>
          <div className="space-y-2">
            {pendingOrders.filter((o: any) => !selectedOrderIds.includes(o.id)).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-[#2D2D3D] rounded-xl">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{order.code}</p>
                  <p className="text-xs text-gray-500 truncate">{order.formattedAddress}</p>
                </div>
                <button 
                  onClick={() => onSelectOrder(order.id)}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <IconPlus size={16} />
                </button>
              </div>
            ))}
            {pendingOrders.filter((o: any) => !selectedOrderIds.includes(o.id)).length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">No hay más pedidos pendientes.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24]">
        <button
          onClick={handleSaveRoute}
          disabled={isSaving || selectedOrderIds.length === 0 || !driverId}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all"
        >
          <IconDeviceFloppy size={20} />
          {isSaving ? "Guardando..." : "Guardar Ruta"}
        </button>
      </div>
    </div>
  );
};
