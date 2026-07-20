import React from "react";
import { IconPackage, IconTruckDelivery, IconChecklist } from "@tabler/icons-react";

export const StatsSummary = () => {
  const stats = [
    { title: "Pedidos Pendientes", value: 14, icon: <IconPackage className="text-orange-500" size={24} />, bg: "bg-orange-50 dark:bg-orange-900/20" },
    { title: "En Camino", value: 8, icon: <IconTruckDelivery className="text-blue-500" size={24} />, bg: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "Entregados Hoy", value: 32, icon: <IconChecklist className="text-green-500" size={24} />, bg: "bg-green-50 dark:bg-green-900/20" },
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
