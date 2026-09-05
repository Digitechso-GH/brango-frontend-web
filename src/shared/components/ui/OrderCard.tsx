"use client";

import React, { useRef } from "react";
import { Badge } from "@/shared/components/ui/Badge";
import { GPSBrand } from "@/shared/components/ui/GPSBrand";
import { ORDER_STATUS } from "@/shared/constants/order-status";
import { getOrderStatusConfig } from "@/shared/utils/orderStatus.utils";
import { formatLocalTime } from "@/shared/utils/date";
import { IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";

interface OrderCardProps {
  order: any;
  onFocusOrder?: (order: any) => void;
  onSelectOrder?: (orderId: string) => void;
  onPauseOrder?: (order: any) => void;
  onResumeOrder?: (order: any) => void;
  isPausedView?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onFocusOrder,
  onSelectOrder,
  onPauseOrder,
  onResumeOrder,
  isPausedView = false,
}) => {
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      if (onSelectOrder) {
        onSelectOrder(order.id);
      }
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        if (onFocusOrder) {
          onFocusOrder(order);
        }
      }, 250);
    }
  };

  const rawStatus = order.status || ORDER_STATUS.PENDING;
  const statusConfig = getOrderStatusConfig(rawStatus);
  const orderCode = order.code ? `#${order.code}` : `#${(order.id || "").slice(0, 5)}`;

  const isCompany = order.recipientCustomerType === "COMPANY";
  const clientName = isCompany
    ? (order.customer?.name ?? "—")
    : (order.recipientName ?? "—");

  const waybillText = order.waybill ? `#${order.waybill}` : "-";
  const driverText = order.driver?.unit 
    ? `Unidad ${order.driver.unit}` 
    : order.driver?.name 
    ? order.driver.name 
    : "Sin asignar";

  const getTimeString = () => {
    return formatLocalTime(order.updatedAt || order.createdAt);
  };

  return (
    <div
      onClick={handleClick}
      className="p-3 rounded-2xl border border-gray-100 dark:border-[#2D2D3D] hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-[#1A1A26] transition-all cursor-pointer shadow-sm group select-none flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 font-mono tracking-tight">
          {orderCode}
        </span>
        <div className="flex items-center gap-1.5">
          {!isPausedView && onPauseOrder && (
            <button
              type="button"
              title="Pausar pedido (sin stock / reprogramar)"
              onClick={(e) => {
                e.stopPropagation();
                onPauseOrder(order);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
            >
              <IconPlayerPause size={14} />
            </button>
          )}
          <Badge variant={isPausedView ? "warning" : statusConfig.variant} className="text-[9px] px-1.5 py-0.5 font-bold tracking-wider rounded">
            {isPausedView ? "PAUSADO" : statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Indicador para pedidos observados (Reintentos) */}
      {!isPausedView && rawStatus === ORDER_STATUS.OBSERVED && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-lg px-2 py-1 text-[10px] text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <span className="font-semibold truncate">
            ⚠️ Reintento: {order.reasonText || "Observado previamente"}
          </span>
        </div>
      )}

      {/* Detalle para vista de pausados */}
      {isPausedView && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-lg px-2 py-1 text-[10px] text-amber-700 dark:text-amber-300">
          <span className="font-semibold block truncate">
            Motivo: {order.pauseReason || "Sin stock en almacén"}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${statusConfig.iconBg}`}>
            <GPSBrand size={18} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">
              {clientName}
            </h4>
            <p className="text-[11px] font-mono text-gray-400 dark:text-gray-500 truncate mt-0.5">
              Guía {waybillText} · {driverText}
            </p>
          </div>
        </div>

        {getTimeString() && (
          <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 shrink-0 self-center">
            {getTimeString()}
          </span>
        )}
      </div>

      {isPausedView && onResumeOrder && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onResumeOrder(order);
          }}
          className="mt-1 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800/40"
        >
          <IconPlayerPlay size={13} /> Reanudar Pedido
        </button>
      )}
    </div>
  );
};
