"use client";

import React from "react";
import { usePedidosTodayQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { IconPackage, IconTruckDelivery, IconChecklist } from "@tabler/icons-react";
import { ORDER_STATUS } from "@/shared/constants/order-status";

export const StatsSummary = () => {
  const { data: ordersResponse } = usePedidosTodayQuery();
  const allTodayOrders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.data || []);
  const pendingCount = allTodayOrders.filter((o: any) => o.status === ORDER_STATUS.PENDING).length;
  const inTransitCount = allTodayOrders.filter((o: any) => o.status === ORDER_STATUS.IN_TRANSIT).length;
  const deliveredCount = allTodayOrders.filter((o: any) => o.status === ORDER_STATUS.DELIVERED).length;

  const stats = [
    {
      title: "Pedidos Pendientes",
      value: pendingCount,
      icon: <IconPackage className="text-orange-500" size={24} />,
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "En Camino",
      value: inTransitCount,
      icon: <IconTruckDelivery className="text-blue-500" size={24} />,
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Entregados",
      value: deliveredCount,
      icon: <IconChecklist className="text-green-500" size={24} />,
      bg: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm"
        >
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
              {stat.title}
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
          </div>
          <div className={`p-4 rounded-xl ${stat.bg}`}>{stat.icon}</div>
        </div>
      ))}
    </div>
  );
};
