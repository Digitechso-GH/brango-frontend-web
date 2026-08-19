"use client";

import React, { useRef } from "react";
import { Badge } from "@/shared/components/ui/Badge";
import { GPSBrand } from "@/shared/components/ui/GPSBrand";
import { ORDER_STATUS } from "@/shared/constants/order-status";
import { getOrderStatusConfig } from "@/shared/utils/orderStatus.utils";

interface OrderCardProps {
  order: any;
  onFocusOrder?: (order: any) => void;
  onSelectOrder?: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onFocusOrder,
  onSelectOrder,
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
    const targetDate = order.updatedAt || order.createdAt;
    if (!targetDate) return "";
    const d = new Date(targetDate);
    if (isNaN(d.getTime())) return "";
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
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
        <Badge variant={statusConfig.variant} className="text-[9px] px-1.5 py-0.5 font-bold tracking-wider rounded">
          {statusConfig.label}
        </Badge>
      </div>

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
    </div>
  );
};
