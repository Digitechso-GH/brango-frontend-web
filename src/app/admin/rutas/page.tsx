"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  useRoutesQuery, 
  useRouteDetailQuery, 
  useDeleteRouteMutation 
} from "@/features/rutas/hooks/useRutasQueries";
import { useDriversQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { 
  ROUTE_STATUS, 
  ROUTE_STATUS_DETAILS, 
  ROUTE_STATUS_FILTER_OPTIONS,
  RouteStatus 
} from "@/shared/constants/route-status";
import { ORDER_STATUS_DETAILS } from "@/shared/constants/order-status";
import { ROUTES } from "@/shared/constants/routes";
import { Select } from "@/shared/components/ui/Select";
import { 
  IconRoute, 
  IconPlus, 
  IconCalendar, 
  IconSteeringWheel, 
  IconFilter, 
  IconRefresh, 
  IconEye, 
  IconTrash, 
  IconX, 
  IconBox, 
  IconMapPin, 
  IconClock, 
  IconCheck, 
  IconAlertCircle,
  IconChevronRight
} from "@tabler/icons-react";

export default function RutasPage() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Queries
  const { data: drivers = [] } = useDriversQuery();
  const { 
    data: routesData, 
    isLoading, 
    refetch, 
    isFetching 
  } = useRoutesQuery({
    date: selectedDate || undefined,
    driverId: selectedDriverId || undefined,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
  });

  const { data: routeDetail, isLoading: isLoadingDetail } = useRouteDetailQuery(selectedRouteId);
  const deleteRouteMutation = useDeleteRouteMutation();

  const routes = routesData?.data || [];

  // Summary Metrics
  const totalRoutes = routes.length;
  const inProgressRoutes = routes.filter((r) => r.status === ROUTE_STATUS.IN_PROGRESS).length;
  const pendingRoutes = routes.filter((r) => r.status === ROUTE_STATUS.PENDING).length;
  const completedRoutes = routes.filter((r) => r.status === ROUTE_STATUS.COMPLETED).length;

  const handleClearFilters = () => {
    setSelectedDate("");
    setSelectedDriverId("");
    setSelectedStatus("ALL");
  };

  const handleDeleteRoute = (id: string, name?: string | null) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la ruta "${name || id}"? Los pedidos asociados volverán al estado pendiente sin asignar.`)) {
      deleteRouteMutation.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <IconRoute size={22} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Gestión de Rutas
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Control, historial y auditoría de rutas planificadas y en ejecución.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A24] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
            title="Refrescar lista"
          >
            <IconRefresh size={18} className={isFetching ? "animate-spin text-blue-600" : ""} />
          </button>

          <Link
            href={ROUTES.ADMIN.TORRE_CONTROL}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <IconPlus size={18} />
            <span>Crear Ruta en Torre</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rutas</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalRoutes}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">En Progreso</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{inProgressRoutes}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendientes</span>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{pendingRoutes}</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Completadas</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedRoutes}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
          <IconFilter size={15} />
          <span>Filtros</span>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#13131A] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <IconCalendar size={15} className="text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          />
        </div>

        {/* Driver filter */}
        <Select
          value={selectedDriverId}
          onChange={setSelectedDriverId}
          options={[
            { label: "Todos los choferes", value: "" },
            ...drivers.map((d: any) => ({
              label: `${d.name}${d.unit ? ` (${d.unit})` : ""}`,
              value: d.id,
            })),
          ]}
          variant="filter"
          icon={<IconSteeringWheel size={15} />}
        />

        {/* Status filter */}
        <Select
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={ROUTE_STATUS_FILTER_OPTIONS}
          variant="filter"
        />

        {(selectedDate || selectedDriverId || selectedStatus !== "ALL") && (
          <button
            onClick={handleClearFilters}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-auto cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Routes Table */}
      <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-400">Cargando rutas...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <IconRoute size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No se encontraron rutas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              No hay rutas que coincidan con los filtros seleccionados o aún no se han planificado rutas para este día.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/30">
                  <th className="py-4 px-6 text-left">Identificador / Nombre</th>
                  <th className="py-4 px-6 text-left">Conductor</th>
                  <th className="py-4 px-6 text-center">Unidad</th>
                  <th className="py-4 px-6 text-center">Fecha Programada</th>
                  <th className="py-4 px-6 text-center">Pedidos</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {routes.map((route) => {
                  const statusConf = ROUTE_STATUS_DETAILS[route.status] || ROUTE_STATUS_DETAILS.PENDING;
                  const isDeletable = route.status === ROUTE_STATUS.PENDING || route.ordersCount === 0;

                  return (
                    <tr
                      key={route.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black shrink-0">
                            #{route.sequenceIndex}
                          </span>
                          <span>{route.name || `Ruta #${route.sequenceIndex}`}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-left">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {route.driverName}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        {route.unit ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {route.unit}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center text-slate-600 dark:text-slate-300">
                        {new Date(route.date).toLocaleDateString("es-PE", {
                          timeZone: "UTC",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="py-4 px-6 text-center">
                        {route.ordersCount === 0 ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            0 pedidos (Vacía)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            <IconBox size={14} />
                            {route.ordersCount} {route.ordersCount === 1 ? "pedido" : "pedidos"}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${statusConf.badgeBg} ${statusConf.badgeText}`}>
                          {statusConf.label}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedRouteId(route.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Ver paradas de la ruta"
                          >
                            <IconEye size={18} />
                          </button>

                          {isDeletable && (
                            <button
                              onClick={() => handleDeleteRoute(route.id, route.name)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar ruta"
                            >
                              <IconTrash size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Route Stops Detail Drawer */}
      {selectedRouteId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay oscuro sin blur para máximo rendimiento */}
          <div
            className="fixed inset-0 bg-gray-900/50 transition-opacity"
            onClick={() => setSelectedRouteId(null)}
          />

          {/* Panel Lateral */}
          <div className="relative w-full max-w-xl bg-white dark:bg-[#1A1A24] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle de Ruta</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  {routeDetail?.name || `Ruta #${routeDetail?.sequenceIndex || ""}`}
                </h2>
                {routeDetail && (
                  <p className="text-xs text-slate-500 mt-1">
                    Chofer: <b>{routeDetail.driver?.user?.name}</b> {routeDetail.driver?.unit ? `(Unidad: ${routeDetail.driver.unit})` : ""}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedRouteId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Drawer Body: Stops Timeline */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {isLoadingDetail ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-slate-400">Cargando paradas...</p>
                </div>
              ) : !routeDetail?.assignments || routeDetail.assignments.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                    <IconBox size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ruta sin pedidos asignados</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Esta ruta fue creada vacía y está lista para recibir paradas desde la Torre de Control.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Secuencia de Entregas ({routeDetail.assignments.length} paradas)
                  </span>

                  {routeDetail.assignments.map((assignment, index) => {
                    const statusConf = ORDER_STATUS_DETAILS[assignment.status] || ORDER_STATUS_DETAILS.PENDING;

                    return (
                      <div
                        key={assignment.id}
                        className="bg-slate-50/80 dark:bg-[#13131A] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs"
                      >
                        {/* Stop Number Circle */}
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                          {assignment.sequenceIndex || index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              #{assignment.order.code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConf.badgeBg} ${statusConf.badgeText}`}>
                              {statusConf.label}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {assignment.order.recipientName || "Cliente"}
                          </p>

                          <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <IconMapPin size={14} className="shrink-0 mt-0.5 text-slate-400" />
                            <span className="line-clamp-2 leading-relaxed">
                              {assignment.order.formattedAddress || assignment.order.rawAddress}
                            </span>
                          </div>

                          {assignment.order.waybill && (
                            <span className="inline-block text-[11px] font-medium text-slate-400 mt-1.5">
                              Guía: {assignment.order.waybill}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRouteId(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
