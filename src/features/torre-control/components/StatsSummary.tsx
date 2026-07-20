"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/api/axios";
import { IconPackage, IconTruckDelivery, IconChecklist } from "@tabler/icons-react";

export const StatsSummary = () => {
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data.data || [];
    },
  });

  const pendingCount = orders.filter((o: any) => o.estado === "PENDING").length;
  const inTransitCount = orders.filter((o: any) => o.estado === "IN_TRANSIT").length;
  const deliveredCount = orders.filter((o: any) => o.estado === "DELIVERED").length;

  const stats = [
    { 
      title: "Pedidos Pendientes", 
      value: pendingCount, 
      icon: <IconPackage className="text-orange-500" size={24} />, 
      bg: "bg-orange-50 dark:bg-orange-900/20" 
    },
    { 
      title: "En Camino", 
      value: inTransitCount, 
      icon: <IconTruckDelivery className="text-blue-500" size={24} />, 
      bg: "bg-blue-50 dark:bg-blue-900/20" 
    },
    { 
      title: "Entregados", 
      value: deliveredCount, 
      icon: <IconChecklist className="text-green-500" size={24} />, 
      bg: "bg-green-50 dark:bg-green-900/20" 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{stat.title}</p>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{stat.value}</h3>
          </div>
          <div className={`p-4 rounded-xl ${stat.bg}`}>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
