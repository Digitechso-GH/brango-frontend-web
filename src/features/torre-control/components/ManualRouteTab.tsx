"use client";

import React, { useState, useEffect } from "react";
import {
  IconMapPin,
  IconGripVertical,
  IconPlus,
  IconX,
  IconDeviceFloppy,
  IconSteeringWheel,
} from "@tabler/icons-react";
import { Select } from "@/shared/components/ui/Select";
import { routesApi } from "../api/routes.api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ORDER_STATUS } from "@/shared/constants/order-status";

interface ManualRouteTabProps {
  todayStr: string;
  allOrders: any[];
  selectedOrderIds: string[];
  driverOptions: Array<{ label: string; value: string }>;
  onSelectOrder: (id: string) => void;
  onRemoveOrder: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
  onRouteSaved?: () => void;
}

export const ManualRouteTab: React.FC<ManualRouteTabProps> = ({
  todayStr,
  allOrders,
  selectedOrderIds,
  driverOptions,
  onSelectOrder,
  onRemoveOrder,
  onReorder,
  onRouteSaved,
}) => {
  const queryClient = useQueryClient();
  const [routeName, setRouteName] = useState("");
  const [driverId, setDriverId] = useState("");
  const [date, setDate] = useState(todayStr);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const [localOrderIds, setLocalOrderIds] = useState<string[]>(selectedOrderIds);

  useEffect(() => {
    setLocalOrderIds(selectedOrderIds);
  }, [selectedOrderIds]);

  const selectedOrdersData = localOrderIds
    .map((id) => allOrders.find((o: any) => o.id === id))
    .filter(Boolean);

  const pendingOrders = allOrders.filter((o: any) => {
    if (o.status === ORDER_STATUS.OBSERVED) return true;
    if (o.driverId) return false;
    return o.status === ORDER_STATUS.PENDING;
  });

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
    onReorder(localOrderIds);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    onReorder(localOrderIds);
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      toast.error("Debes ingresar el nombre de la ruta");
      return;
    }
    if (!date) {
      toast.error("Debes seleccionar una fecha");
      return;
    }
    if (date < todayStr) {
      toast.error("La fecha de la ruta no puede ser anterior a hoy");
      return;
    }
    if (!driverId) {
      toast.error("Debes seleccionar un chofer disponible");
      return;
    }
    if (selectedOrderIds.length === 0) {
      toast.error("Debes agregar al menos un pedido a la ruta");
      return;
    }

    try {
      setIsSaving(true);
      await routesApi.createRoute({
        name: routeName.trim(),
        driverId,
        date: date,
        assignments: selectedOrderIds.map((id) => ({ orderId: id })),
      });
      toast.success("¡Ruta creada y asignada correctamente!");
      setRouteName("");
      setDriverId("");
      setDate(todayStr);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders-today"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["available-drivers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-routes"] }),
        queryClient.invalidateQueries({ queryKey: ["suggested-routes"] }),
      ]);

      if (onRouteSaved) onRouteSaved();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear la ruta");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid =
    routeName.trim().length > 0 &&
    !!driverId &&
    !!date &&
    date >= todayStr &&
    selectedOrderIds.length > 0;

  return (
    <>
      <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-[#2D2D3D] bg-gray-50/30 dark:bg-white/[0.01]">
        <h2 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Armar Nueva Ruta</h2>

        <div className="space-y-2">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
              Nombre de la Ruta <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              placeholder="Ej. Ruta Norte - Mañana"
              className="w-full bg-white dark:bg-[#13131A] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Fecha <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                min={todayStr}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-[#13131A] border border-gray-200 dark:border-[#2D2D3D] rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-0.5">
                Chofer <span className="text-rose-500">*</span>
              </label>
              <Select
                value={driverId}
                onChange={setDriverId}
                options={driverOptions}
                placeholder="Seleccionar..."
                size="sm"
                icon={<IconSteeringWheel size={14} className="text-gray-400" />}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-between">
            <span>Paradas en la Ruta</span>
            <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              {selectedOrderIds.length} {selectedOrderIds.length === 1 ? "pedido" : "pedidos"}
            </span>
          </h3>

          {selectedOrdersData.length === 0 ? (
            <div className="text-center p-3.5 border-2 border-dashed border-gray-200 dark:border-[#2D2D3D] rounded-xl bg-gray-50/50 dark:bg-white/[0.01]">
              <IconMapPin className="mx-auto text-gray-300 dark:text-gray-600 mb-1" size={18} />
              <p className="text-[11px] text-gray-400">
                Haz clic en los marcadores del mapa o agrégalos desde pendientes.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedOrdersData.map((order, idx) => (
                <div
                  key={order.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-2 bg-white dark:bg-[#1A1A24] border border-gray-200/80 dark:border-[#2D2D3D] rounded-xl transition-all ${
                    draggedIdx === idx
                      ? "opacity-40 scale-[0.98]"
                      : "cursor-grab active:cursor-grabbing hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  <div className="text-gray-400 shrink-0">
                    <IconGripVertical size={14} />
                  </div>
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      #{order.code}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {order.recipientName || order.customer?.name || "Cliente"}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveOrder(order.id)}
                    className="p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Quitar parada"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Pendientes sin Ruta</h3>
          <div className="space-y-1.5">
            {pendingOrders
              .filter((o: any) => !selectedOrderIds.includes(o.id))
              .map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-[#2D2D3D] rounded-xl hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      #{order.code}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {order.formattedAddress || order.rawAddress || "Dirección no disponible"}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectOrder(order.id)}
                    className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Agregar a la ruta"
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
              ))}
            {pendingOrders.filter((o: any) => !selectedOrderIds.includes(o.id)).length === 0 && (
              <p className="text-[11px] text-gray-400 text-center py-2">
                No hay más pedidos pendientes.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-2.5 border-t border-gray-100 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24]">
        <button
          onClick={handleSaveRoute}
          disabled={isSaving || !isFormValid}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg shadow-sm shadow-blue-500/20 text-xs transition-all cursor-pointer"
        >
          <IconDeviceFloppy size={14} />
          <span>{isSaving ? "Guardando..." : "Guardar Ruta"}</span>
        </button>
      </div>
    </>
  );
};
