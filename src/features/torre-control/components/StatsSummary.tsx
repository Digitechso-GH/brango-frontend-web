"use client";

import React from "react";
import { usePedidosTodayQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { useRoutesQuery } from "@/features/rutas/hooks/useRutasQueries";
import { 
  IconRoute, 
  IconTruckDelivery, 
  IconChecklist, 
  IconMapPin 
} from "@tabler/icons-react";
import { ORDER_STATUS } from "@/shared/constants/order-status";
import { ROUTE_STATUS } from "@/shared/constants/route-status";
import { getLocalTodayString } from "@/shared/utils/date";

export const StatsSummary = () => {
  const todayStr = getLocalTodayString();

  // Queries
  const { data: routesResponse } = useRoutesQuery({ date: todayStr });
  const todayRoutes = routesResponse?.data || [];
  const totalRoutes = todayRoutes.length;
  const completedRoutes = todayRoutes.filter((r: any) => r.status === ROUTE_STATUS.COMPLETED).length;
  const inProgressRoutes = todayRoutes.filter((r: any) => r.status === ROUTE_STATUS.IN_PROGRESS).length;

  const { data: ordersResponse } = usePedidosTodayQuery();
  const allTodayOrders = ordersResponse?.data || [];
  const totalOrders = allTodayOrders.length;
  const deliveredOrders = allTodayOrders.filter((o: any) => o.status === ORDER_STATUS.DELIVERED).length;
  const unassignedOrders = allTodayOrders.filter(
    (o: any) => o.status === ORDER_STATUS.PENDING && !o.routeAssignmentId && !o.driverId
  ).length;

  const progressPct = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  const stats = [
    {
      title: "Rutas del Día",
      value: `${completedRoutes} / ${totalRoutes}`,
      subtext: `${inProgressRoutes} en curso`,
      icon: <IconRoute className="text-purple-600 dark:text-purple-400" size={20} />,
      bg: "bg-purple-50 dark:bg-purple-950/40",
    },
    {
      title: "Entregas de Hoy",
      value: `${deliveredOrders} / ${totalOrders}`,
      subtext: `${totalOrders - deliveredOrders} pendientes`,
      icon: <IconTruckDelivery className="text-blue-600 dark:text-blue-400" size={20} />,
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Avance del Día",
      value: `${progressPct}%`,
      subtext: "Efectividad global",
      icon: <IconChecklist className="text-emerald-600 dark:text-emerald-400" size={20} />,
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Pedidos sin Ruta",
      value: `${unassignedOrders}`,
      subtext: "Por asignar en mapa",
      icon: <IconMapPin className="text-slate-600 dark:text-slate-400" size={20} />,
      bg: "bg-slate-100 dark:bg-slate-800/80",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#1A1A24] rounded-xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              {stat.title}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none">
              {stat.value}
            </h3>
            {stat.subtext && (
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 block">
                {stat.subtext}
              </span>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${stat.bg} shrink-0`}>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
