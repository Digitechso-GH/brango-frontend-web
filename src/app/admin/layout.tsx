"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { 
  IconMap2, 
  IconBox, 
  IconFileSpreadsheet, 
  IconSteeringWheel, 
  IconBuildingStore, 
  IconSettings,
  IconLogout
} from "@tabler/icons-react";

import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { IconBell, IconMapPinFilled } from "@tabler/icons-react";

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuGroups: MenuGroup[] = [
    {
      title: "OPERACIÓN",
      items: [
        { label: "Torre de Control", path: ROUTES.ADMIN.TORRE_CONTROL, icon: <IconMap2 size={20} /> },
        { label: "Pedidos", path: ROUTES.ADMIN.PEDIDOS, icon: <IconBox size={20} /> },
        { label: "Choferes", path: ROUTES.ADMIN.CHOFERES, icon: <IconSteeringWheel size={20} /> },
        { label: "Clientes", path: ROUTES.ADMIN.CLIENTES, icon: <IconBuildingStore size={20} /> },
      ],
    },
    {
      title: "SISTEMA",
      items: [
        { label: "Configuración", path: ROUTES.ADMIN.CONFIGURACION, icon: <IconSettings size={20} /> },
      ],
    },
  ];

  const activeItem = menuGroups.flatMap(g => g.items).find(i => pathname.startsWith(i.path));
  const pageTitle = activeItem ? activeItem.label : "Panel de Control";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#13131A] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#1A1A24] border-r border-gray-200 dark:border-[#2D2D3D] flex flex-col transition-colors z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-[#2D2D3D] gap-2">
          <IconMapPinFilled size={24} className="text-blue-600 dark:text-blue-500" />
          <h1 className="text-xl font-black text-accent tracking-tighter">Bran<span className="text-gray-900 dark:text-white">Go</span></h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 flex flex-col gap-8">
          {menuGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 mb-1">
                {group.title}
              </span>
              <nav className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-accent dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <span className={`transition-colors ${isActive ? "text-accent dark:text-blue-400" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-[#2D2D3D] flex flex-col gap-2">
          {/* Se oculta temporalmente el modo oscuro a pedido del usuario */}
          <div className="hidden">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-accent flex items-center justify-center font-black text-xs border border-blue-100 dark:border-blue-900/50 shrink-0">
              LC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">Luna Campos</p>
              <p className="text-[10px] font-medium text-gray-500 truncate">Despachador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Nav Header */}
        <header className="h-16 border-b border-gray-200 dark:border-[#2D2D3D] bg-white dark:bg-[#1A1A24] flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{pageTitle}</h2>
          
          <div className="flex items-center gap-3">
            <div className="pl-4 border-l border-gray-200 dark:border-[#2D2D3D]">
              {/* 
              <button className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                <IconLogout size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
              </button>
              */}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
