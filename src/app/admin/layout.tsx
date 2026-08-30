"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";
import { ROLES } from "@/shared/constants/roles";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { authApi } from "@/features/auth/api/auth.api";
import { 
  IconMap2, 
  IconBox, 
  IconRoute,
  IconSteeringWheel, 
  IconSettings,
  IconLogout,
  IconMapPinFilled,
  IconMenu2,
  IconX
} from "@tabler/icons-react";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { useUIStore } from "@/shared/store/useUIStore";

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
  const { user, logout, hasHydrated } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar, isMobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useUIStore();

  const handleLogout = async () => {
    logout();
    try {
      await authApi.logout();
    } catch {
      // Ignorar
    }
    window.location.href = ROUTES.LOGIN;
  };

  const menuGroups: MenuGroup[] = [
    {
      title: "OPERACIÓN",
      items: [
        { label: "Torre de Control", path: ROUTES.ADMIN.TORRE_CONTROL, icon: <IconMap2 size={20} /> },
        { label: "Pedidos", path: ROUTES.ADMIN.PEDIDOS, icon: <IconBox size={20} /> },
        { label: "Rutas", path: ROUTES.ADMIN.RUTAS, icon: <IconRoute size={20} /> },
        { label: "Choferes", path: ROUTES.ADMIN.CHOFERES, icon: <IconSteeringWheel size={20} /> },
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

  const userInitials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  const userRoleLabel = user?.role === ROLES.SYS_ADMIN
    ? "Administrador"
    : user?.role === ROLES.SYS_OPERATOR
    ? "Operador Despachador"
    : "Usuario";

  if (!hasHydrated) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-[#0F0F17] flex items-center justify-center text-slate-400 text-sm font-sans">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/50 dark:bg-[#13131A] overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#1A1A24] border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out md:relative md:translate-x-0
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isSidebarCollapsed ? "md:w-[80px]" : "md:w-64"} w-64
        `}
      >
        <div className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? "px-4 justify-between md:justify-center md:px-0" : "px-4 justify-between"}`}>
          <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"}`}>
            <IconMapPinFilled size={24} className="text-blue-600 dark:text-blue-500 shrink-0" />
            <h1 className="text-xl font-black text-blue-600 tracking-tight shrink-0">Bran<span className="text-slate-900 dark:text-white">Go</span></h1>
          </div>
          
          <button 
            onClick={toggleSidebar} 
            className="hidden md:flex p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
            title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <IconMenu2 size={20} />
          </button>

          <button 
            onClick={closeMobileSidebar} 
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-3 flex flex-col gap-8">
          {menuGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className={`text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-1 transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? "md:w-0 md:opacity-0 md:px-0" : "w-auto opacity-100"}`}>
                {group.title}
              </span>
              <nav className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      title={isSidebarCollapsed ? item.label : undefined}
                      onClick={() => closeMobileSidebar()}
                      className={`flex items-center py-2.5 rounded-xl text-sm font-semibold transition-all group overflow-hidden ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                      } ${isSidebarCollapsed ? "md:justify-center md:px-0 md:gap-0 px-3 gap-3" : "px-3 gap-3"}`}
                    >
                      <span className={`shrink-0 transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"}`}>
                        {item.icon}
                      </span>
                      <span className={`transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <div className="hidden">
            <ThemeToggle />
          </div>
          <div className={`flex items-center py-2 transition-all duration-300 ${isSidebarCollapsed ? "md:justify-center md:px-0 md:gap-0 px-2 gap-3" : "px-2 gap-3"}`}>
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100 dark:border-blue-900/50 shrink-0" title={isSidebarCollapsed ? user?.name : undefined}>
              {userInitials}
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"}`}>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">{user?.name || "Administrador"}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate">{userRoleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Nav Header */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#1A1A24] flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleMobileSidebar}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <IconMenu2 size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{pageTitle}</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            >
              <IconLogout size={16} />
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 pb-12 min-h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
