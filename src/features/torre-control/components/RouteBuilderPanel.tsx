"use client";

import React, { useState } from "react";
import { IconMapPin, IconRoute } from "@tabler/icons-react";
import { useAvailableDriversQuery, usePedidosTodayQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { getLocalTodayString } from "@/shared/utils/date";
import { useSuggestedRoutesQuery } from "../hooks/useSuggestedRoutes";
import { ManualRouteTab } from "./ManualRouteTab";
import { SuggestedRouteTab } from "./SuggestedRouteTab";

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
  onReorder,
}) => {
  const todayStr = getLocalTodayString();
  const [activeTab, setActiveTab] = useState<"manual" | "suggested">("manual");

  const { data: driversResponse } = useAvailableDriversQuery(todayStr);
  const availableDrivers = Array.isArray(driversResponse) ? driversResponse : [];

  const driverOptions = availableDrivers.map((d: any) => ({
    label: `${d.name}${d.unit ? ` (${d.unit})` : ""}`,
    value: d.id,
  }));

  const { data: ordersResponse } = usePedidosTodayQuery();
  const allOrders = ordersResponse?.data || [];

  const { data: suggestedRoutes = [] } = useSuggestedRoutesQuery(todayStr);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1A1A24] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2D2D3D] overflow-hidden">
      {/* Selector de Pestañas Segmentado */}
      <div className="p-2 border-b border-gray-100 dark:border-[#2D2D3D] bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex bg-gray-200/60 dark:bg-[#252536] p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "manual"
                ? "bg-white dark:bg-[#1A1A24] text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <IconMapPin size={14} />
            <span>Manual</span>
            {selectedOrderIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                {selectedOrderIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("suggested")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "suggested"
                ? "bg-white dark:bg-[#1A1A24] text-blue-600 dark:text-blue-400 font-bold shadow-xs"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <IconRoute size={14} />
            <span>Sugeridas</span>
            {suggestedRoutes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {suggestedRoutes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "manual" ? (
        <ManualRouteTab
          todayStr={todayStr}
          allOrders={allOrders}
          selectedOrderIds={selectedOrderIds}
          driverOptions={driverOptions}
          onSelectOrder={onSelectOrder}
          onRemoveOrder={onRemoveOrder}
          onReorder={onReorder}
          onRouteSaved={onRouteSaved}
        />
      ) : (
        <SuggestedRouteTab
          todayStr={todayStr}
          driverOptions={driverOptions}
          onSelectRouteForMap={onReorder}
          onRouteSaved={onRouteSaved}
        />
      )}
    </div>
  );
};
