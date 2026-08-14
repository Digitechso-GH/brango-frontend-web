"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pedidosApi } from "../api/pedidos.api";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Badge } from "@/shared/components/ui/Badge";
import { getOrderStatusConfig } from "@/shared/utils/orderStatus.utils";
import { ORDER_STATUS } from "@/shared/constants/order-status";
import { 
  IconCheck, 
  IconInfoCircle, 
  IconMapPinFilled, 
  IconClock, 
  IconMapPin 
} from "@tabler/icons-react";

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export const OrderDetailDrawer = ({ isOpen, onClose, orderId }: OrderDetailDrawerProps) => {
  const [imgError, setImgError] = useState(false);

  // Query para obtener detalles completos del pedido
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => (orderId ? pedidosApi.getOrderDetail(orderId) : null),
    enabled: !!orderId && isOpen,
  });

  React.useEffect(() => {
    setImgError(false);
  }, [orderId]);

  const cleanMatrizText = (text?: string | null) => {
    if (!text) return "-";
    return text.replace(/\s*-\s*Matriz/gi, "").replace(/\s*Matriz/gi, "").trim();
  };

  const getClientName = (ord: any): string => {
    if (!ord) return "-";
    const rawName = ord.recipientCustomerType === "INDIVIDUAL" ? ord.recipientName : (ord.customer?.name || ord.recipientName);
    return cleanMatrizText(rawName || "");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = getOrderStatusConfig(status);
    let label = statusConfig.label;

    if (status === ORDER_STATUS.IN_TRANSIT && order?.driver) {
      const driverName = order.driver.name || "Sin nombre";
      const unitStr = order.driver.unit ? ` · Unidad ${order.driver.unit}` : "";
      label = `En camino${unitStr}`;
    } else if (status === ORDER_STATUS.PENDING) {
      label = "PENDIENTE DE ASIGNACIÓN";
    }

    return (
      <Badge variant={statusConfig.variant} className="text-xs px-3 py-1.5 font-bold tracking-wide rounded-lg">
        {status === ORDER_STATUS.IN_TRANSIT ? (
          <IconMapPinFilled size={14} />
        ) : status === ORDER_STATUS.DELIVERED ? (
          <IconCheck size={14} />
        ) : status === ORDER_STATUS.OBSERVED || status === ORDER_STATUS.FAILED ? (
          <IconInfoCircle size={14} />
        ) : (
          <IconClock size={14} />
        )}
        {label}
      </Badge>
    );
  };

  const getTimelineEventLabel = (status: string) => {
    if (status === ORDER_STATUS.PENDING) return "Pedido registrado";
    const config = getOrderStatusConfig(status);
    return config.timelineLabel;
  };

  const getTimelineEventIcon = (status: string) => {
    if (status === ORDER_STATUS.IN_TRANSIT) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 z-10 border-2 border-white dark:border-[#1A1A24]">
          <IconMapPin size={15} />
        </div>
      );
    }
    if (status === ORDER_STATUS.DELIVERED) {
      return (
        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 z-10 border-2 border-white dark:border-[#1A1A24]">
          <IconCheck size={15} />
        </div>
      );
    }
    if (status === ORDER_STATUS.OBSERVED || status === ORDER_STATUS.FAILED) {
      return (
        <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 z-10 border-2 border-white dark:border-[#1A1A24]">
          <IconInfoCircle size={15} />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0 z-10 border-2 border-white dark:border-[#1A1A24]">
        <IconMapPin size={15} />
      </div>
    );
  };

  const clientTitle = order ? getClientName(order) : "";
  const orderSubtitle = order && order.code ? `Pedido #${order.code}` : "";

  const evidenceImage =
    order?.fotoGuiaUrl ||
    order?.guiaUrl ||
    (order?.evidencias && order.evidencias.length > 0 ? order.evidencias[0].s3Url : null);

  const showImage = !!evidenceImage && !imgError;

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={clientTitle}
      subtitle={orderSubtitle}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400 font-medium">
          Cargando detalles del pedido...
        </div>
      ) : !order ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400 font-medium">
          No se pudo encontrar el pedido.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* 1. Estado Badge */}
          <div className="flex items-center">
            {getStatusBadge(order.status)}
          </div>

          {/* 2. Imagen de Evidencia / ePOD */}
          <div className="w-full h-52 bg-slate-50 dark:bg-[#13131A] rounded-2xl border border-gray-200/80 dark:border-[#2D2D3D] flex flex-col items-center justify-center relative overflow-hidden p-3 shadow-sm">
            {showImage ? (
              <img
                src={evidenceImage}
                onError={() => setImgError(true)}
                alt="Evidencia / ePOD"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5 text-gray-400 dark:text-gray-500 p-4">
                <svg className="w-10 h-10 stroke-current opacity-50" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-xs font-semibold text-center text-gray-400 dark:text-gray-500 max-w-[200px] leading-relaxed">
                  Foto disponible al confirmarse la entrega
                </span>
              </div>
            )}
          </div>

          {/* 3. Lista de Datos Principales */}
          <div className="flex flex-col border-t border-b border-gray-100 dark:border-[#2D2D3D] py-1">
            {/* Cliente */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Cliente</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white text-right">
                {getClientName(order)}
              </span>
            </div>

            {/* Chofer Asignado */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Chofer asignado</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white text-right">
                {order.driver
                  ? `${order.driver.name || "Sin nombre"}${order.driver.unit ? ` — Unidad ${order.driver.unit}` : ""}`
                  : "No asignado"}
              </span>
            </div>

            {/* Contacto Cliente */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Contacto cliente</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white text-right">
                {order.recipientPhone || "-"}
              </span>
            </div>

            {/* Contacto Almacén */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Contacto almacén</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white text-right">
                {order.warehouseContact || "-"}
              </span>
            </div>

            {/* Motivo de Observación (Solo si la asignación activa fue marcada como OBSERVED) */}
            {order.reasonText && (
              <div className="flex justify-between items-start py-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">Motivo de observación</span>
                <span className="text-xs font-bold text-red-500 text-right ml-4 max-w-[220px] leading-snug">
                  {order.reasonText}
                </span>
              </div>
            )}
          </div>

          {/* 4. Línea de Tiempo */}
          <div className="flex flex-col gap-3 pt-2">
            <h4 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              LÍNEA DE TIEMPO
            </h4>

            <div className="relative pl-1 flex flex-col gap-5">
              <div className="absolute left-[14px] top-3 bottom-3 w-[2px] bg-gray-100 dark:bg-[#2D2D3D]"></div>

              {order.orderTimelines && order.orderTimelines.length > 0 ? (
                order.orderTimelines.map((timeline: any) => (
                  <div key={timeline.id} className="relative flex items-start gap-3">
                    <div className="relative z-10 shrink-0">
                      {getTimelineEventIcon(timeline.estadoNuevo)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 pt-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {getTimelineEventLabel(timeline.estadoNuevo)}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(timeline.createdAt).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 italic">Sin historial registrado.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </BaseDrawer>
  );
};
