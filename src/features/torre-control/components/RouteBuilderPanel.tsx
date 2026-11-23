"use client";

import React, { useEffect, useState } from "react";
import {
  useAvailableDriversQuery,
  useAvailableVehiclesQuery,
  usePedidosTodayQuery,
} from "@/features/pedidos/hooks/usePedidosQueries";
import { useRoutesQuery } from "@/features/routes/hooks/useRoutesQueries";
import { rutasApi } from "@/features/routes/api/routes.api";
import {
  IconMapPin,
  IconGripVertical,
  IconPlus,
  IconX,
  IconDeviceFloppy,
  IconSteeringWheel,
  IconTruck,
  IconCalendar,
  IconArrowLeft,
  IconRoute,
  IconBox,
  IconLock,
  IconEdit,
  IconClock,
  IconRefresh,
  IconChevronRight,
} from "@tabler/icons-react";
import { Select } from "@/shared/components/ui/Select";
import { routesApi } from "../api/routes.api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ORDER_STATUS } from "@/shared/constants/order-status";
import { ROUTE_STATUS, ROUTE_STATUS_DETAILS, RouteStatus } from "@/shared/constants/route-status";
import { getLocalTodayString, formatLocalDate } from "@/shared/utils/date";
import { LICENSE_CATEGORY_LABELS } from "@/features/drivers/constants/drivers.constants";

interface RouteBuilderPanelProps {
  onRouteSaved?: () => void;
  selectedOrderIds: string[];
  onSelectOrder: (id: string) => void;
  onRemoveOrder: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
  onSetSelectedOrders: (orderIds: string[]) => void;
  onSetExtraOrders?: (orders: any[]) => void;
  initialRouteId?: string | null;
  onBuildingStateChange?: (isBuilding: boolean) => void;
}

export const RouteBuilderPanel: React.FC<RouteBuilderPanelProps> = ({
  onRouteSaved,
  selectedOrderIds,
  onSelectOrder,
  onRemoveOrder,
  onReorder,
  onSetSelectedOrders,
  onSetExtraOrders,
  initialRouteId,
  onBuildingStateChange,
}) => {
  const queryClient = useQueryClient();
  const todayStr = getLocalTodayString();

  // Mode: 'LIST' (Master - browse routes of the day) | 'FORM' (Detail - create or edit route)
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">(initialRouteId ? "FORM" : "LIST");

  useEffect(() => {
    onBuildingStateChange?.(viewMode === "FORM");
  }, [viewMode, onBuildingStateChange]);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(initialRouteId || null);
  const [editingRouteSequence, setEditingRouteSequence] = useState<number | null>(null);
  const [loadedOrders, setLoadedOrders] = useState<any[]>([]);
  const [currentRouteDriver, setCurrentRouteDriver] = useState<{
    id: string;
    name: string;
    licenseCategory?: string | null;
  } | null>(null);
  const [currentRouteVehicle, setCurrentRouteVehicle] = useState<{
    id: string;
    plate: string;
    brand?: string | null;
    model?: string | null;
    capacityKg?: number | null;
  } | null>(null);

  const [routeName, setRouteName] = useState("");
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [date, setDate] = useState(todayStr);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Queries: Cargar todas las rutas pendientes desde hoy en adelante (hoy y futuras)
  const { data: routesResponse, isLoading: isLoadingRoutes, refetch: refetchRoutes } = useRoutesQuery({
    fromDate: todayStr,
    status: ROUTE_STATUS.PENDING,
    limit: 100,
  });
  const allPendingRoutes = (routesResponse?.data || []).filter(
    (r: any) => r.status === ROUTE_STATUS.PENDING && getLocalTodayString(r.date) >= todayStr
  );

  const { data: driversResponse } = useAvailableDriversQuery(
    date,
    true,
    editingRouteId || undefined,
  );
  const availableDrivers = Array.isArray(driversResponse) ? driversResponse : [];

  const { data: vehiclesResponse } = useAvailableVehiclesQuery(
    date,
    true,
    editingRouteId || undefined,
  );
  const availableVehicles = Array.isArray(vehiclesResponse) ? vehiclesResponse : [];

  const effectiveDrivers: Array<{
    id: string;
    name: string;
    licenseCategory?: string | null;
  }> = [...availableDrivers.filter((d): d is NonNullable<typeof d> => Boolean(d))];
  if (currentRouteDriver && !effectiveDrivers.some((d) => d.id === currentRouteDriver.id)) {
    effectiveDrivers.unshift(currentRouteDriver);
  }

  const effectiveVehicles: Array<{
    id: string;
    plate: string;
    brand?: string | null;
    model?: string | null;
    capacityKg?: number | null;
  }> = [...availableVehicles.filter((v): v is NonNullable<typeof v> => Boolean(v))];
  if (currentRouteVehicle && !effectiveVehicles.some((v) => v.id === currentRouteVehicle.id)) {
    effectiveVehicles.unshift(currentRouteVehicle);
  }

  const driverOptions = effectiveDrivers.map((d: any) => {
    const lic = LICENSE_CATEGORY_LABELS[d.licenseCategory] || d.licenseCategory;
    return {
      label: `${d.name}${lic ? ` (${lic})` : ""}`,
      value: d.id,
    };
  });

  const vehicleOptions = effectiveVehicles.map((v) => ({
    label: `${v.plate}${v.brand || v.model ? ` · ${[v.brand, v.model].filter(Boolean).join(" ")}` : ""}${
      v.capacityKg ? ` (${v.capacityKg} kg)` : ""
    }`,
    value: v.id,
  }));

  const { data: ordersResponse } = usePedidosTodayQuery();
  const allOrders = ordersResponse?.data || [];

  // Combinar pedidos de today con los pedidos de la ruta en edición para que no falte metadata
  const combinedOrdersPool = [
    ...allOrders,
    ...loadedOrders.filter((lo) => !allOrders.some((ao: any) => ao.id === lo.id)),
  ];

  const pendingOrders = combinedOrdersPool.filter((o: any) => {
    // Si ya está agregado en la ruta actual, no mostrar en pendientes
    if (selectedOrderIds.includes(o.id)) return false;

    // Si pertenece a la ruta en edición y se desacopló, debe mostrarse como pendiente
    if (editingRouteId && o.assignments?.some((a: any) => a.routeId === editingRouteId && !a.voidedAt)) {
      return true;
    }

    if (o.status === ORDER_STATUS.OBSERVED) {
      const latestAssignment = o.assignments?.[0];
      if (latestAssignment && latestAssignment.date) {
        const assignmentDateStr = getLocalTodayString(latestAssignment.date);
        if (assignmentDateStr === todayStr) {
          return false;
        }
      }
      return true;
    }

    if (o.driverId && (!editingRouteId || o.driverId !== driverId)) return false;
    return o.status === ORDER_STATUS.PENDING;
  });

  const [localOrderIds, setLocalOrderIds] = useState<string[]>(selectedOrderIds);

  useEffect(() => {
    setLocalOrderIds(selectedOrderIds);
  }, [selectedOrderIds]);

  const selectedOrdersData = localOrderIds
    .map((id) => combinedOrdersPool.find((o: any) => o.id === id))
    .filter(Boolean);

  // Iniciar edición a partir de un ID
  const loadRouteForEdit = async (routeId: string) => {
    try {
      setIsLoadingDetail(true);
      const detail = await rutasApi.getRouteDetail(routeId);
      if (!detail) {
        toast.error("No se pudo cargar la información de la ruta");
        return;
      }

      if (detail.status !== ROUTE_STATUS.PENDING) {
        toast.warning("Esta ruta ya fue iniciada por el chofer y ya no puede ser editada.");
        refetchRoutes();
        handleBackToList();
        return;
      }

      setEditingRouteId(detail.id);
      setEditingRouteSequence(detail.sequenceIndex);
      setRouteName(detail.name || "");
      setDriverId(detail.driverId || "");
      setVehicleId(detail.vehicleId || "");
      setDate(detail.date ? detail.date.slice(0, 10) : todayStr);

      if (detail.driver) {
        setCurrentRouteDriver({
          id: detail.driverId,
          name: detail.driver.user.name,
          licenseCategory: detail.driver.licenseCategory,
        });
      } else {
        setCurrentRouteDriver(null);
      }

      if (detail.vehicle) {
        setCurrentRouteVehicle({
          id: detail.vehicle.id,
          plate: detail.vehicle.plate,
          brand: detail.vehicle.brand,
          model: detail.vehicle.model,
          capacityKg: detail.vehicle.capacityKg,
        });
      } else {
        setCurrentRouteVehicle(null);
      }

      const assignments = detail.assignments || [];
      const orderIds = assignments.map((a: any) => a.orderId);
      const ordersInRoute = assignments.map((a: any) => a.order).filter(Boolean);

      setLoadedOrders(ordersInRoute);
      onSetExtraOrders?.(ordersInRoute);
      onSetSelectedOrders(orderIds);
      setViewMode("FORM");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar la ruta");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Cargar ruta inicial si viene por query param
  useEffect(() => {
    if (initialRouteId) {
      loadRouteForEdit(initialRouteId);
    }
  }, [initialRouteId]);

  const handleStartNewRoute = () => {
    setEditingRouteId(null);
    setEditingRouteSequence(null);
    setCurrentRouteDriver(null);
    setCurrentRouteVehicle(null);
    setRouteName("");
    setDriverId("");
    setVehicleId("");
    setDate(todayStr);
    setLoadedOrders([]);
    onSetExtraOrders?.([]);
    onSetSelectedOrders([]);
    setViewMode("FORM");
  };

  const handleBackToList = () => {
    setViewMode("LIST");
    setEditingRouteId(null);
    setEditingRouteSequence(null);
    setCurrentRouteDriver(null);
    setCurrentRouteVehicle(null);
    setRouteName("");
    setDriverId("");
    setVehicleId("");
    setLoadedOrders([]);
    onSetExtraOrders?.([]);
    onSetSelectedOrders([]);
  };

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newArr = [...localOrderIds];
    const draggedItem = newArr[draggedIdx];
    newArr.splice(draggedIdx, 1);
    newArr.splice(idx, 0, draggedItem);

    setLocalOrderIds(newArr);
    setDraggedIdx(idx);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIdx(null);
    onReorder(localOrderIds);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    onReorder(localOrderIds);
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      toast.error("Debes ingresar el nombre de la ruta");
      return;
    }
    if (!date) {
      toast.error("Debes seleccionar una fecha");
      return;
    }
    if (date < todayStr) {
      toast.error("La fecha de la ruta no puede ser anterior a hoy");
      return;
    }
    if (!driverId) {
      toast.error("Debes seleccionar un chofer disponible");
      return;
    }
    if (!vehicleId) {
      toast.error("Debes seleccionar un vehículo disponible");
      return;
    }
    if (selectedOrderIds.length === 0) {
      toast.error("Debes agregar al menos un pedido a la ruta");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: routeName.trim(),
        driverId,
        vehicleId,
        date: date,
        assignments: selectedOrderIds.map((id) => ({ orderId: id })),
      };

      if (editingRouteId) {
        await routesApi.updateRoute(editingRouteId, payload);
        toast.success("¡Ruta actualizada correctamente!");
      } else {
        await routesApi.createRoute(payload);
        toast.success("¡Ruta creada y asignada correctamente!");
      }

      // Invalidar cachés
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders-today"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["available-drivers"] }),
        queryClient.invalidateQueries({ queryKey: ["available-vehicles"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-routes"] }),
      ]);

      if (onRouteSaved) onRouteSaved();
      handleBackToList();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al procesar la ruta");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid =
    routeName.trim().length > 0 &&
    !!driverId &&
    !!vehicleId &&
    !!date &&
    date >= todayStr &&
    selectedOrderIds.length > 0;

  // ==========================================
  // VISTA 1: LISTADO DE RUTAS (MASTER)
  // ==========================================
  if (viewMode === "LIST") {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#1A1A24] rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        {/* Header de Rutas Planificadas */}
        <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <IconRoute size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">Rutas Planificadas</h2>
                <p className="text-[10px] text-slate-400">Rutas pendientes de hoy y futuras</p>
              </div>
            </div>
            <button
              onClick={() => refetchRoutes()}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Refrescar lista"
            >
              <IconRefresh size={14} className={isLoadingRoutes ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>

          <button
            onClick={handleStartNewRoute}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer text-xs"
          >
            <IconPlus size={15} />
            <span>Armar Nueva Ruta</span>
          </button>
        </div>

        {/* Lista de Rutas (Pendientes de hoy y futuras) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
          {isLoadingRoutes ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[11px] text-slate-400">Cargando rutas...</p>
            </div>
          ) : allPendingRoutes.length === 0 ? (
            <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-white/[0.02]">
              <IconRoute className="mx-auto text-slate-300 dark:text-slate-600 mb-1.5" size={24} />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Sin rutas pendientes</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                No hay rutas pendientes de iniciar para hoy o días futuros. Pulsa "Armar Nueva Ruta" para crear una.
              </p>
            </div>
          ) : (
            allPendingRoutes.map((route: any) => {
              const routeDateStr = getLocalTodayString(route.date);
              const isToday = routeDateStr === todayStr;
              const dateBadge = isToday ? "Hoy" : formatLocalDate(route.date, { format: "short" });

              return (
                <div
                  key={route.id}
                  onClick={() => loadRouteForEdit(route.id)}
                  className="flex items-center gap-3 p-2.5 bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <IconRoute size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {route.name || `Ruta #${route.sequenceIndex}`}
                      </h4>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        isToday 
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}>
                        {dateBadge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {route.driverName || "Sin chofer"} · {route.ordersCount} {route.ordersCount === 1 ? "pedido" : "pedidos"} · Pendiente
                    </p>
                  </div>

                  <IconChevronRight
                    size={16}
                    className="text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: FORMULARIO DE RUTA (DETAIL / CREACIÓN / EDICIÓN)
  // ==========================================
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1A1A24] rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
      {/* Cabecera con botón de Regresar */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <IconArrowLeft size={14} />
            <span>Volver a rutas</span>
          </button>
          {editingRouteId && (
            <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
              Modo Edición
            </span>
          )}
        </div>

        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
          {editingRouteId
            ? `Editando ${routeName || (editingRouteSequence ? `Ruta #${editingRouteSequence}` : "Ruta")}`
            : "Armar Nueva Ruta"}
        </h2>

        {isLoadingDetail ? (
          <div className="py-4 text-center text-xs text-slate-400">Cargando detalles de la ruta...</div>
        ) : (
          <div className="space-y-2">
            {/* Nombre de la ruta */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Nombre de la Ruta <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="Ej. Ruta Norte - Mañana"
                className="w-full bg-white dark:bg-[#13131A] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Fecha */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Fecha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    min={todayStr}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white dark:bg-[#13131A] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer transition-all"
                  />
                </div>
              </div>

              {/* Chofer */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Chofer Disponible <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={driverId}
                  onChange={setDriverId}
                  options={driverOptions}
                  placeholder={driverOptions.length === 0 ? "Sin choferes disponibles" : "Seleccionar..."}
                  size="sm"
                  icon={<IconSteeringWheel size={14} className="text-slate-400" />}
                  className="w-full"
                />
              </div>
            </div>

            {/* Vehículo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                Vehículo Disponible <span className="text-rose-500">*</span>
              </label>
              <Select
                value={vehicleId}
                onChange={setVehicleId}
                options={vehicleOptions}
                placeholder={vehicleOptions.length === 0 ? "Sin vehículos disponibles para esta fecha" : "Seleccionar vehículo..."}
                size="sm"
                icon={<IconTruck size={14} className="text-slate-400" />}
                className="w-full"
              />
              {(driverOptions.length === 0 || vehicleOptions.length === 0) && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  {driverOptions.length === 0 && vehicleOptions.length === 0
                    ? "No hay choferes ni vehículos disponibles para la fecha seleccionada."
                    : driverOptions.length === 0
                      ? "No hay choferes disponibles para la fecha seleccionada."
                      : "No hay vehículos disponibles para la fecha seleccionada."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
        {/* Paradas en la Ruta */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
            <span>Paradas en la Ruta</span>
            <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/40">
              {selectedOrderIds.length} {selectedOrderIds.length === 1 ? "pedido" : "pedidos"}
            </span>
          </h3>

          {selectedOrdersData.length === 0 ? (
            <div className="text-center p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-white/[0.02]">
              <IconMapPin className="mx-auto text-slate-300 dark:text-slate-600 mb-1" size={20} />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Haz clic en los marcadores del mapa o agrégalos desde pendientes.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedOrdersData.map((order, idx) => (
                <div
                  key={order.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-2 bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-xs transition-all ${
                    draggedIdx === idx
                      ? "opacity-40 scale-[0.98]"
                      : "cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="text-slate-400 dark:text-slate-500 shrink-0">
                    <IconGripVertical size={14} />
                  </div>
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm shadow-blue-500/20">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">#{order.code}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {order.recipientName || order.customer?.name || "Cliente"}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveOrder(order.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Quitar parada (desacoplar a pendientes)"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pendientes sin Ruta */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Pendientes sin Ruta</h3>
          <div className="space-y-1.5">
            {pendingOrders
              .filter((o: any) => !selectedOrderIds.includes(o.id))
              .map((order: any) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800/80 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">#{order.code}</p>
                      {order.dueDate && (
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold shrink-0">
                          Despacho: {formatLocalDate(order.dueDate)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {order.formattedAddress || order.rawAddress || "Dirección no disponible"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOrder(order.id);
                    }}
                    className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors cursor-pointer"
                    title="Agregar a la ruta"
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
              ))}
            {pendingOrders.filter((o: any) => !selectedOrderIds.includes(o.id)).length === 0 && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center py-2">
                No hay más pedidos pendientes.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Botón Guardar o Actualizar */}
      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1A1A24]">
        <button
          onClick={handleSaveRoute}
          disabled={isSaving || !isFormValid}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer text-xs"
        >
          <IconDeviceFloppy size={15} />
          <span>{isSaving ? "Guardando..." : editingRouteId ? "Actualizar Ruta" : "Guardar Ruta"}</span>
        </button>
      </div>
    </div>
  );
};

