"use client";

import React, { useState, useMemo } from "react";
import { usePedidosTodayQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { useRoutesQuery } from "@/features/routes/hooks/useRoutesQueries";
import { Select } from "@/shared/components/ui/Select";
import {
  ORDER_STATUS_FILTER_OPTIONS,
  FRONTEND_TO_BACKEND_STATUS_MAP,
  ORDER_STATUS_DETAILS,
  isOrderUnassignedForToday,
} from "@/shared/constants/order-status";
import { getLocalTodayString, formatLocalTime } from "@/shared/utils/date";
import {
  IconChevronDown,
  IconChevronRight,
  IconInbox,
  IconCheck,
} from "@tabler/icons-react";

interface OrderSideListProps {
  onSelectOrder?: (orderId: string) => void;
  onFocusOrder?: (order: any) => void;
}

export const OrderSideList = ({ onSelectOrder, onFocusOrder }: OrderSideListProps) => {
  const [activeTab, setActiveTab] = useState<"routes" | "unassigned">("routes");
  const [selectedRouteId, setSelectedRouteId] = useState("all");
  const [status, setStatus] = useState("all");

  // Control de acordeón expandido: solo una ruta abierta a la vez (por defecto ninguna)
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  const todayStr = useMemo(() => getLocalTodayString(), []);

  // Consultar pedidos y rutas de hoy
  const { data: ordersResponse, isLoading: isLoadingOrders } = usePedidosTodayQuery();
  const allTodayOrders: any[] = ordersResponse?.data || [];

  const { data: routesResponse, isLoading: isLoadingRoutes } = useRoutesQuery({
    date: todayStr,
  });
  const routes: any[] = routesResponse?.data || [];

  const isLoading = isLoadingOrders || isLoadingRoutes;

  // Opciones del selector de rutas
  const routeOptions = useMemo(() => {
    const list = [{ label: "Todas", value: "all" }];
    routes.forEach((r: any) => {
      list.push({
        label: r.name || `Ruta #${r.sequenceIndex ?? ""}`,
        value: r.id,
      });
    });
    return list;
  }, [routes]);

  // Opciones de estado (Pedido: Todos, Pendientes, En camino, Entregados, Observados)
  const statusOptions = useMemo(() => {
    return [
      { label: "Todos", value: "all" },
      ...ORDER_STATUS_FILTER_OPTIONS.filter((opt) => opt.value !== "all").map((opt) => ({
        label: opt.label,
        value: opt.value,
      })),
    ];
  }, []);

  // Agrupación y separación
  const { routesWithOrders, unassignedOrders } = useMemo(() => {
    const targetStatus = status !== "all" ? FRONTEND_TO_BACKEND_STATUS_MAP[status] : null;

    const routeOrdersMap: Record<string, any[]> = {};
    const unassigned: any[] = [];

    routes.forEach((r: any) => {
      routeOrdersMap[r.id] = [];
    });

    allTodayOrders.forEach((order: any) => {
      if (isOrderUnassignedForToday(order, todayStr)) {
        unassigned.push(order);
      } else {
        const rId = order.routeId;
        if (rId && routeOrdersMap[rId]) {
          routeOrdersMap[rId].push(order);
        } else if (rId) {
          if (!routeOrdersMap[rId]) routeOrdersMap[rId] = [];
          routeOrdersMap[rId].push(order);
        } else {
          unassigned.push(order);
        }
      }
    });

    const routesList = routes.map((route: any) => {
      const ordersInRoute = routeOrdersMap[route.id] || [];
      ordersInRoute.sort((a, b) => (a.sequenceIndex ?? 0) - (b.sequenceIndex ?? 0));

      const deliveredCount = ordersInRoute.filter((o) => o.status === "DELIVERED").length;

      const filteredOrders = ordersInRoute.filter((o) => {
        if (targetStatus && o.status !== targetStatus) return false;
        return true;
      });

      return {
        ...route,
        orders: ordersInRoute,
        filteredOrders,
        totalOrders: ordersInRoute.length,
        deliveredCount,
      };
    });

    return {
      routesWithOrders: routesList,
      unassignedOrders: unassigned,
    };
  }, [routes, allTodayOrders, status, todayStr]);

  const toggleRouteAccordion = (routeId: string) => {
    setExpandedRouteId((prev) => (prev === routeId ? null : routeId));
  };

  const isRouteExpanded = (routeId: string) => {
    return expandedRouteId === routeId;
  };

  const visibleRoutes = useMemo(() => {
    if (selectedRouteId === "all") return routesWithOrders;
    return routesWithOrders.filter((r) => r.id === selectedRouteId);
  }, [routesWithOrders, selectedRouteId]);

  // Render del Pedido idéntico a la imagen:
  // Check/Icono + #Código primero + Nombre Cliente + Hora
  // Debajo Dirección limpia
  const renderOrderItem = (order: any) => {
    const isCompany = order.recipientCustomerType === "COMPANY";
    const clientName = isCompany
      ? order.customer?.name ?? "Cliente"
      : order.recipientName ?? "Cliente";

    const isDelivered = order.status === "DELIVERED";
    const timeStr = formatLocalTime(order.createdAt || order.updatedAt);
    const orderCode = order.code || (order.id || "").slice(0, 5);

    // Dirección legible
    const address =
      order.formattedAddress && !order.formattedAddress.startsWith("http")
        ? order.formattedAddress
        : order.rawAddress && !order.rawAddress.startsWith("http")
        ? order.rawAddress
        : null;

    return (
      <div
        key={order.id}
        onClick={() => onFocusOrder?.(order)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onSelectOrder?.(order.id);
        }}
        className="w-full flex flex-col gap-1 p-2 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer select-none group"
      >
        {/* Línea 1: Check/Icono + #Código + Nombre Cliente        Hora */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Círculo indicador / Check si entregado */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] ${
                isDelivered
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {isDelivered ? (
                <IconCheck size={12} stroke={2.5} />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
              )}
            </div>

            {/* #Código PRIMERO, luego Nombre Cliente */}
            <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 shrink-0">
                #{orderCode}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {clientName}
              </span>
            </div>
          </div>

          {/* Hora */}
          {timeStr && (
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
              {timeStr}
            </span>
          )}
        </div>

        {/* Línea 2: Dirección limpia debajo */}
        {address && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate pl-7">
            {address}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#121218] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col h-full overflow-hidden">
      {/* 1. Header con Título y Resumen global */}
      <div className="p-3 border-b border-gray-100 dark:border-[#2D2D3D] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
            Operación de hoy
          </h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {routes.length} {routes.length === 1 ? "ruta" : "rutas"} · {allTodayOrders.length}{" "}
            {allTodayOrders.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>

        {/* 2. Pestañas: Rutas vs Sin ruta */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("routes")}
            className={`pb-2 px-3 transition-colors flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === "routes"
                ? "text-slate-900 dark:text-white font-bold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <span>Rutas</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "routes"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {routes.length}
            </span>
            {activeTab === "routes" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unassigned")}
            className={`pb-2 px-3 transition-colors flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === "unassigned"
                ? "text-slate-900 dark:text-white font-bold"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <span>Sin ruta</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                unassignedOrders.length > 0
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {unassignedOrders.length}
            </span>
            {activeTab === "unassigned" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>
        </div>

        {/* 3. Filtros: SOLO en pestaña "Rutas" */}
        {activeTab === "routes" && (
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Ruta
              </span>
              <Select
                value={selectedRouteId}
                onChange={setSelectedRouteId}
                options={routeOptions}
                size="sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pedido
              </span>
              <Select
                value={status}
                onChange={setStatus}
                options={statusOptions}
                size="sm"
              />
            </div>
          </div>
        )}

        {/* 4. Subheader en pestaña "Sin ruta" */}
        {activeTab === "unassigned" && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
            <span>Pedidos pendientes de asignación a ruta</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/50">
              {unassignedOrders.length} pedidos
            </span>
          </div>
        )}
      </div>

      {/* 5. Lista de Contenido (Tarjeta con sombra limpia por ruta) */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-gray-400">Cargando operación...</div>
        ) : activeTab === "routes" ? (
          visibleRoutes.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              {selectedRouteId !== "all" || status !== "all"
                ? "Ninguna ruta coincide con los filtros."
                : "No hay rutas planificadas para hoy."}
            </div>
          ) : (
            visibleRoutes.map((route: any) => {
              const expanded = isRouteExpanded(route.id);
              const percent =
                route.totalOrders > 0
                  ? Math.round((route.deliveredCount / route.totalOrders) * 100)
                  : 0;
              const hasOrders = route.filteredOrders.length > 0;
              const isAllDelivered = percent === 100 && route.totalOrders > 0;

              return (
                <div
                  key={route.id}
                  className="bg-[#F8F9FA] dark:bg-white/[0.03] rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all"
                >
                  {/* Cabecera de la Ruta: Flecha + Título + Chofer/Estado + Badge */}
                  <div
                    onClick={() => toggleRouteAccordion(route.id)}
                    className="flex items-start justify-between gap-2 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <div className="pt-0.5 text-slate-400 shrink-0">
                        {expanded ? (
                          <IconChevronDown size={16} />
                        ) : (
                          <IconChevronRight size={16} />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {route.name || `Ruta #${route.sequenceIndex ?? ""}`}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {route.driverName || "Sin chofer"} · {route.deliveredCount} de {route.totalOrders}{" "}
                          {isAllDelivered ? "entregado" : "pedidos"}
                        </span>
                      </div>
                    </div>

                    {/* Badge de estado de la ruta */}
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        isAllDelivered
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50"
                          : route.deliveredCount > 0
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {isAllDelivered
                        ? "Entregado"
                        : route.deliveredCount > 0
                        ? "En curso"
                        : "Pendiente"}
                    </span>
                  </div>

                  {/* Barra de progreso de la Ruta continua a lo ancho */}
                  <div className="w-full h-1 bg-slate-200/70 dark:bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAllDelivered ? "bg-emerald-500 w-full" : percent > 0 ? "bg-blue-600" : "bg-transparent"
                      }`}
                      style={{ width: isAllDelivered ? "100%" : percent > 0 ? `${percent}%` : "0%" }}
                    />
                  </div>

                  {/* Lista de Pedidos desplegados dentro de la tarjeta */}
                  {expanded && (
                    <div className="flex flex-col gap-1 pt-1">
                      {!hasOrders ? (
                        <div className="py-2 text-xs text-slate-400 text-center">
                          Ningún pedido coincide con el filtro.
                        </div>
                      ) : (
                        route.filteredOrders.map((order: any) => renderOrderItem(order))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* Pestaña: Sin ruta */
          unassignedOrders.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center gap-2">
              <IconInbox size={28} className="text-slate-300 dark:text-slate-600" />
              <span>Todos los pedidos de hoy tienen ruta asignada.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {unassignedOrders.map((order: any) => renderOrderItem(order))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
