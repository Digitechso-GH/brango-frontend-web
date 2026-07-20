"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/api/axios";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { 
  IconMapPin, 
  IconMapPinFilled, 
  IconReceipt, 
  IconClock, 
  IconCheck, 
  IconPhoto, 
  IconInfoCircle,
  IconUserCheck
} from "@tabler/icons-react";

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export const OrderDetailDrawer = ({ isOpen, onClose, orderId }: OrderDetailDrawerProps) => {
  // Query para obtener detalles completos del pedido
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await api.get(`/orders/${orderId}`);
      return res.data.data;
    },
    enabled: !!orderId && isOpen,
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "IN_TRANSIT":
        return (
          <Badge variant="warning">
            <IconMapPinFilled size={12} />
            En camino {order?.chofer ? `— ${order.chofer.usuario?.nombre}` : ""}
          </Badge>
        );
      case "DELIVERED":
        return (
          <Badge variant="success">
            <IconCheck size={12} />
            Entregado
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="danger">
            <IconInfoCircle size={12} />
            Fallido / Observado
          </Badge>
        );
      default:
        return (
          <Badge variant="default">
            <IconClock size={12} />
            Pendiente de Asignación
          </Badge>
        );
    }
  };

  const getTimelineEventLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pedido registrado en el sistema";
      case "IN_TRANSIT":
        return "Pedido en tránsito (En camino)";
      case "DELIVERED":
        return "Entregado con éxito (e-POD subida)";
      case "FAILED":
        return "Entrega fallida / Observada";
      default:
        return `Estado cambiado a ${status}`;
    }
  };

  const getTimelineEventIcon = (status: string) => {
    switch (status) {
      case "IN_TRANSIT":
        return <IconMapPinFilled size={16} className="text-amber-500" />;
      case "DELIVERED":
        return <IconCheck size={16} className="text-emerald-500" />;
      case "FAILED":
        return <IconInfoCircle size={16} className="text-red-500" />;
      default:
        return <IconClock size={16} className="text-slate-400" />;
    }
  };

  return (
    <BaseDrawer isOpen={isOpen} onClose={onClose}>
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          Cargando detalles del pedido...
        </div>
      ) : !order ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          No se pudo encontrar el pedido.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Header Info */}
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
              {order.cliente?.nombre || "Detalle del Pedido"}
            </h2>
            <p className="text-sm font-bold text-gray-500">Guía de Remisión: {order.guia || "Sin Guía"}</p>
          </div>

          <div>
            {getStatusBadge(order.estado)}
          </div>

          {/* Foto ePOD */}
          <div className="w-full h-56 bg-gray-100 dark:bg-[#13131A] rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2D2D3D] flex flex-col items-center justify-center relative overflow-hidden">
            {order.evidencias && order.evidencias.length > 0 ? (
              <img 
                src={order.evidencias[0].s3Url} 
                alt="Evidencia ePOD" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-gray-400 p-4 text-center">
                <IconReceipt size={32} className="text-gray-300 dark:text-gray-500" />
                <span className="text-xs font-bold">Foto ePOD disponible al confirmarse la entrega</span>
              </div>
            )}
          </div>

          {/* Data List */}
          <div className="flex flex-col border-t border-gray-100 dark:border-[#2D2D3D]">
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-sm font-medium text-gray-500">Cliente</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {order.cliente?.nombre || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-sm font-medium text-gray-500">Razón Social / RUC</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {order.cliente?.empresa?.nombre || "-"} (RUC: {order.cliente?.empresa?.ruc || "-"})
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-sm font-medium text-gray-500 shrink-0">Dirección</span>
              <div className="flex items-center gap-2 text-right">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {order.direccionOriginal || "-"}
                </span>
                <span className="shrink-0 text-gray-400">
                  <IconMapPin size={14} />
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-sm font-medium text-gray-500">DNI Destinatario</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {order.documentoDestinatario || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-sm font-medium text-gray-500">Chofer asignado</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {order.chofer 
                  ? `${order.chofer.usuario?.nombre || "Chofer"} — ${order.chofer.unidad || "Sin Placa"}` 
                  : "No asignado"}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-4 mt-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Línea de tiempo</h3>
            
            <div className="relative pl-6 flex flex-col gap-6">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-100 dark:bg-[#2D2D3D]"></div>

              {order.orderTimelines && order.orderTimelines.length > 0 ? (
                order.orderTimelines.map((timeline: any) => (
                  <div key={timeline.id} className="relative">
                    <div className="absolute -left-[30px] top-0.5 bg-white dark:bg-[#1A1A24] p-0.5 z-10">
                      {getTimelineEventIcon(timeline.estadoNuevo)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {getTimelineEventLabel(timeline.estadoNuevo)}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 mt-0.5">
                        Por: {timeline.usuario?.nombre || "Sistema"} · {new Date(timeline.createdAt).toLocaleString("es-PE")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400">Sin historial registrado.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </BaseDrawer>
  );
};
