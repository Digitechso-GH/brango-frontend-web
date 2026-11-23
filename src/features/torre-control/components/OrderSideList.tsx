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
  IconBox,
  IconInbox,
} from "@tabler/icons-react";

interface OrderSideListProps {
  onSelectOrder?: (orderId: string) => void;
  onFocusOrder?: (order: any) => void;
  selectedRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
}

export const OrderSideList = ({
  onSelectOrder,
  onFocusOrder,
  selectedRouteId: controlledRouteId,
  onSelectRoute: setControlledRouteId,
  selectedStatus: controlledStatus,
  onSelectStatus: setControlledStatus,
}: OrderSideListProps) => {
  const [internalRouteId, setInternalRouteId] = useState("all");
  const [internalStatus, setInternalStatus] = useState("all");
  const [activeTab, setActiveTab] = useState<"routes" | "unassigned">("routes");

  const selectedRouteId = controlledRouteId ?? internalRouteId;
  const setSelectedRouteId = setControlledRouteId ?? setInternalRouteId;

  const status = controlledStatus ?? internalStatus;
  const setStatus = setControlledStatus ?? setInternalStatus;

  // Control de acordeones expandidos por ruta
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});

  const todayStr = useMemo(() => getLocalTodayString(), []);

  const { data: ordersResponse, isLoading: isLoadingOrders } = usePedidosTodayQuery();
  const allTodayOrders: any[] = ordersResponse?.data || [];

  const { data: routesResponse, isLoading: isLoadingRoutes } = useRoutesQuery({
    date: todayStr,
  });
  const routes: any[] = routesResponse?.data || [];

  const isLoading = isLoadingOrders || isLoadingRoutes;

  // Opciones del selector de rutas
  const routeOptions = useMemo(() => {
    const list = [
      { label: "Todas", value: "all" },
    ];

    routes.forEach((r: any) => {
      const name = r.name || `Ruta #${r.sequenceIndex ?? ""}`;
      list.push({
        label: name,
        value: r.id,
      });
    });

    return list;
  }, [routes]);

  // Agrupación y filtrado de datos
  const {
    routesWithOrders,
    unassignedOrders,
    totalRoutesCount,
    totalOrdersCount,
    hiddenRoutesCount,
  } = useMemo(() => {
    const targetStatus = status !== "all" ? FRONTEND_TO_BACKEND_STATUS_MAP[status] : null;

    const routeOrdersMap: Record<string, any[]> = {};
    const unassigned: any[] = [];

    routes.forEach((r: any) => {
      routeOrdersMap[r.id] = [];
    });

    allTodayOrders.forEach((order: any) => {
      const rId = order.routeId;
      if (rId && routeOrdersMap[rId]) {
        routeOrdersMap[rId].push(order);
      } else if (isOrderUnassignedForToday(order, todayStr)) {
        unassigned.push(order);
      }
    });

    let hiddenCount = 0;

    const routesList = routes.map((route: any) => {
      const ordersInRoute = routeOrdersMap[route.id] || [];
      ordersInRoute.sort((a, b) => (a.sequenceIndex ?? 0) - (b.sequenceIndex ?? 0));

      const deliveredCount = ordersInRoute.filter((o) => o.status === "DELIVERED").length;
      const pendingCount = ordersInRoute.filter((o) => o.status !== "DELIVERED").length;

      const filteredOrders = ordersInRoute.filter((o) => {
        if (targetStatus && o.status !== targetStatus) return false;
        return true;
      });

      if (targetStatus && filteredOrders.length === 0 && ordersInRoute.length > 0) {
        hiddenCount += 1;
      }

      return {
        ...route,
        orders: ordersInRoute,
        filteredOrders,
        totalOrders: ordersInRoute.length,
        deliveredCount,
        pendingCount,
      };
    });

    const filteredUnassigned = unassigned.filter((o) => {
      if (targetStatus && o.status !== targetStatus) return false;
      return true;
    });

    return {
      routesWithOrders: routesList,
      unassignedOrders: {
        all: unassigned,
        filtered: filteredUnassigned,
      },
      totalRoutesCount: routes.length,
      totalOrdersCount: allTodayOrders.length,
      hiddenRoutesCount: hiddenCount,
    };
  }, [routes, allTodayOrders, status]);

  const toggleRouteAccordion = (routeId: string) => {
    setExpandedRoutes((prev) => ({
      ...prev,
      [routeId]: prev[routeId] === undefined ? true : !prev[routeId],
    }));
  };

  const isRouteExpanded = (routeId: string) => {
    if (selectedRouteId === routeId) return true;
    if (selectedRouteId !== "all" && routeId !== selectedRouteId) return false;
    return !!expandedRoutes[routeId];
  };

  // Filtrar según el selector superior de rutas
  const visibleRoutes = useMemo(() => {
    if (selectedRouteId === "all") {
      // Si hay un filtro de estado activo, ocultar rutas con 0 pedidos en ese estado
      if (status !== "all") {
        return routesWithOrders.filter((r) => r.filteredOrders.length > 0);
      }
      return routesWithOrders;
    }
    if (selectedRouteId === "unassigned") {
      return [];
    }
    return routesWithOrders.filter((r) => r.id === selectedRouteId);
  }, [routesWithOrders, selectedRouteId, status]);

  const handleResetFilters = () => {
    setSelectedRouteId("all");
    setStatus("all");
  };

  // Renderizador limpio de cada pedido (2 líneas con sombreado alternado tipo zebra, #, cliente, estado, hora y dirección)
  const renderOrderItem = (order: any, index: number = 0) => {
    const isCompany = order.recipientCustomerType === "COMPANY";
    const clientName = isCompany
      ? (order.customer?.name ?? "Cliente")
      : (order.recipientName ?? "Cliente");

    const orderStatusDetail =
      ORDER_STATUS_DETAILS[order.status] || ORDER_STATUS_DETAILS.PENDING;

    const timeStr = formatLocalTime(order.createdAt || order.updatedAt);
    const orderCode = order.code || (order.id || "").slice(0, 5);
    const address = order.formattedAddress || order.rawAddress;

    const isZebra = index % 2 === 1;

    return (
      <div
        key={order.id}
        onClick={() => {
          if (onFocusOrder) onFocusOrder(order);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (onSelectOrder) onSelectOrder(order.id);
        }}
        className={`w-full flex flex-col gap-1 px-3 py-2 rounded-lg transition-colors cursor-pointer select-none group ${
          isZebra
            ? "bg-slate-50/90 dark:bg-white/[0.035]"
            : "bg-transparent"
        } hover:bg-slate-100/80 dark:hover:bg-white/[0.08]`}
      >
        {/* Línea 1: #Pedido + Nombre + Estado + Hora */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 shrink-0">
              #{orderCode}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {clientName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full ${orderStatusDetail.badgeBg} ${orderStatusDetail.badgeText}`}
            >
              {orderStatusDetail.label}
            </span>
            {timeStr && (
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                {timeStr}
              </span>
            )}
          </div>
        </div>

        {/* Línea 2: Dirección y/o Guía */}
        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate pl-6">
          {address ? address : "Sin dirección registrada"}
          {order.waybill && ` · Guía: ${order.waybill}`}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#121218] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col h-full overflow-hidden">
      {/* 1. Header Principal: "Operación de hoy" */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Operación de hoy
          </h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {totalRoutesCount} rutas · {totalOrdersCount} pedidos
          </span>
        </div>

        {/* 2. Pestañas: Rutas (3) / Sin ruta (1) */}
        <div className="flex items-center gap-5 border-b border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("routes");
              if (selectedRouteId === "unassigned") {
                setSelectedRouteId("all");
              }
            }}
            className={`pb-2 flex items-center gap-1.5 font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "routes"
                ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <span>Rutas</span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {totalRoutesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("unassigned");
              setSelectedRouteId("unassigned");
              setStatus("all"); // Por defecto lista el total de pedidos sin ruta
            }}
            className={`pb-2 flex items-center gap-1.5 font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "unassigned"
                ? "border-amber-500 text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            }`}
          >
            <span>Sin ruta</span>
            <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-bold">
              {unassignedOrders.all.length}
            </span>
          </button>
        </div>

        {/* 3. Filtros: Solo aplican en la pestaña Rutas */}
        {activeTab === "routes" ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Selector de Ruta */}
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                Ruta
              </span>
              <Select
                value={selectedRouteId}
                onChange={setSelectedRouteId}
                options={routeOptions}
                size="sm"
              />
            </div>

            {/* Selector de Pedido / Estado */}
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
                Pedido
              </span>
              <Select
                value={status}
                onChange={setStatus}
                options={ORDER_STATUS_FILTER_OPTIONS.map((opt) => ({
                  label: opt.value === "all" ? "Todos" : opt.label.replace("Estado: ", ""),
                  value: opt.value,
                }))}
                size="sm"
              />
            </div>
          </div>
        ) : (
          /* En 'Sin ruta': Mensaje directo con conteo total sin selectores innecesarios */
          <div className="flex items-center justify-between py-1.5 px-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Pedidos pendientes de asignación a ruta
            </span>
            <span className="font-bold text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full">
              {unassignedOrders.all.length} {unassignedOrders.all.length === 1 ? "pedido" : "pedidos"}
            </span>
          </div>
        )}
      </div>

      {/* 4. Listado Principal */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-xs text-slate-400 gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Cargando operación...</span>
          </div>
        ) : activeTab === "routes" ? (
          /* Pestaña: Rutas */
          visibleRoutes.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center gap-2">
              <IconInbox size={28} className="text-slate-300 dark:text-slate-600" />
              <span>No se encontraron rutas con el filtro seleccionado.</span>
            </div>
          ) : (
            visibleRoutes.map((route: any) => {
              const expanded = isRouteExpanded(route.id);
              const hasFilteredOrders = route.filteredOrders.length > 0;
              const percent =
                route.totalOrders > 0
                  ? Math.round((route.deliveredCount / route.totalOrders) * 100)
                  : 0;

              return (
                <div
                  key={route.id}
                  className="border-b border-slate-100 dark:border-slate-800/80 pb-2.5 mb-1 last:border-b-0 last:mb-0 last:pb-0"
                >
                  {/* Fila Cabecera de la Ruta */}
                  <button
                    type="button"
                    onClick={() => toggleRouteAccordion(route.id)}
                    className="w-full text-left py-2 px-1.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer select-none"
                  >
                    {/* Flecha + Título y Chofer */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {expanded ? (
                        <IconChevronDown
                          size={16}
                          className="text-slate-600 dark:text-slate-300 shrink-0"
                        />
                      ) : (
                        <IconChevronRight
                          size={16}
                          className="text-slate-400 shrink-0"
                        />
                      )}

                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {route.name || `Ruta #${route.sequenceIndex ?? ""}`}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {route.driverName || "Sin chofer"} · {route.deliveredCount} de {route.totalOrders}
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso + Badge de estado */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                          percent === 100
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50"
                            : route.deliveredCount > 0
                            ? "bg-blue-100/70 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {percent === 100
                          ? "Entregado"
                          : route.deliveredCount > 0
                          ? "En curso"
                          : "Pendiente"}
                      </span>
                    </div>
                  </button>

                  {/* Lista de Pedidos de la Ruta (con barra vertical azul y sombreado zebra) */}
                  {expanded && (
                    <div className="relative pl-3.5 ml-1 flex flex-col gap-0.5 pt-1 pb-1">
                      {/* Barra vertical azul que agrupa visualmente los pedidos a la ruta */}
                      <div className="absolute left-1 top-1.5 bottom-1.5 w-[3.5px] bg-blue-600 rounded-full" />

                      {!hasFilteredOrders ? (
                        <div className="py-2.5 px-3 text-xs text-slate-400">
                          Ningún pedido coincide con el filtro.
                        </div>
                      ) : (
                        route.filteredOrders.map((order: any, idx: number) =>
                          renderOrderItem(order, idx)
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* Pestaña: Sin ruta */
          unassignedOrders.all.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center gap-2">
              <IconInbox size={28} className="text-slate-300 dark:text-slate-600" />
              <span>Todos los pedidos de hoy tienen ruta asignada.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {unassignedOrders.all.map((order: any, idx: number) => renderOrderItem(order, idx))}
            </div>
          )
        )}
      </div>

      {/* 5. Footer: "X rutas ocultas por el filtro" y "Limpiar filtros" */}
      {status !== "all" && hiddenRoutesCount > 0 && activeTab === "routes" && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-[#15151E]">
          <span>
            {hiddenRoutesCount} {hiddenRoutesCount === 1 ? "ruta oculta" : "rutas ocultas"} por el filtro
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};
