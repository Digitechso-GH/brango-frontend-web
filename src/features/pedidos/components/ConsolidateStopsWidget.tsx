"use client";

import React, { useState } from "react";
import {
  IconSparkles,
  IconMapPin,
  IconLink,
  IconUnlink,
  IconCheck,
  IconX,
  IconLayersLinked,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useDuplicateSuggestionsQuery } from "../hooks/usePedidosQueries";
import { useGroupStopsMutation, useUngroupStopMutation } from "../hooks/usePedidosMutations";
import { Button } from "@/shared/components/ui/Button";
import { formatLocalDate } from "@/shared/utils/date";

interface ConsolidateStopsWidgetProps {
  date?: string;
}

export const ConsolidateStopsWidget: React.FC<ConsolidateStopsWidgetProps> = ({ date }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"suggested" | "consolidated">("suggested");
  
  // Confirmation state
  const [clusterToConfirm, setClusterToConfirm] = useState<any | null>(null);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);

  const { data: suggestions = [], isLoading } = useDuplicateSuggestionsQuery(date);
  const groupMutation = useGroupStopsMutation();
  const ungroupMutation = useUngroupStopMutation();

  const suggestedClusters = suggestions.filter((g: any) => !g.isGrouped);
  const consolidatedGroups = suggestions.filter((g: any) => g.isGrouped);

  // Ordenar grupos consolidados de forma estable por menor código de pedido (#2242 antes que #2244)
  const sortedConsolidatedGroups = React.useMemo(() => {
    return [...consolidatedGroups].sort((a: any, b: any) => {
      const minCodeA = Math.min(...a.assignments.map((x: any) => Number(x.orderCode) || 0));
      const minCodeB = Math.min(...b.assignments.map((x: any) => Number(x.orderCode) || 0));
      return minCodeA - minCodeB;
    });
  }, [consolidatedGroups]);

  if (isLoading || (suggestedClusters.length === 0 && consolidatedGroups.length === 0)) {
    return null;
  }

  const totalSuggestedOrders = suggestedClusters.reduce(
    (acc: number, c: any) => acc + c.assignments.length,
    0
  );

  const handleConfirmSingleGroup = async () => {
    if (!clusterToConfirm) return;
    const ids = clusterToConfirm.assignments.map((a: any) => a.id);
    await groupMutation.mutateAsync(ids);
    setClusterToConfirm(null);
  };

  const handleConfirmGroupAll = async () => {
    for (const cluster of suggestedClusters) {
      if (cluster.canModify) {
        const ids = cluster.assignments.map((a: any) => a.id);
        await groupMutation.mutateAsync(ids);
      }
    }
    setConfirmAllOpen(false);
  };

  return (
    <>
      {/* Compact Trigger Button placed on the Table Toolbar */}
      {suggestedClusters.length > 0 ? (
        <button
          onClick={() => {
            setActiveTab("suggested");
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-sm shadow-indigo-500/20 text-xs font-bold transition-all transform hover:scale-[1.02] cursor-pointer"
        >
          <IconSparkles size={15} className="animate-pulse" />
          <span>
            {suggestedClusters.length} {suggestedClusters.length === 1 ? "parada por consolidar" : "paradas por consolidar"}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black">
            {totalSuggestedOrders} pedidos
          </span>
        </button>
      ) : (
        <button
          onClick={() => {
            setActiveTab("consolidated");
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all cursor-pointer"
        >
          <IconLayersLinked size={15} />
          <span>
            {consolidatedGroups.length} {consolidatedGroups.length === 1 ? "consolidado activo" : "consolidados activos"}
          </span>
        </button>
      )}

      {/* Main Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                  <IconLayersLinked size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    Optimización de Paradas Multi-Pedido
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unifica pedidos con la misma dirección y chofer en una sola visita.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("suggested")}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all ${
                    activeTab === "suggested"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Por Consolidar ({suggestedClusters.length})
                </button>
                <button
                  onClick={() => setActiveTab("consolidated")}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all ${
                    activeTab === "consolidated"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Ya Consolidadas ({consolidatedGroups.length})
                </button>
              </div>

              {activeTab === "suggested" && suggestedClusters.length > 1 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setConfirmAllOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold py-1.5 px-3"
                >
                  <IconSparkles size={14} />
                  <span>Consolidar todas</span>
                </Button>
              )}
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[58vh] flex flex-col gap-3 pr-3 sm:pr-4">
              {activeTab === "suggested" ? (
                suggestedClusters.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <IconCheck size={36} className="mx-auto mb-2 text-emerald-500 opacity-80" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      ¡Todo al día! No hay paradas pendientes de consolidar.
                    </p>
                  </div>
                ) : (
                  suggestedClusters.map((cluster: any, idx: number) => (
                    <div
                      key={`cluster-${idx}`}
                      className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <IconMapPin size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-sm">
                            {cluster.address || "Dirección de entrega"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {cluster.date && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-fit">
                              {formatLocalDate(cluster.date)}
                            </span>
                          )}
                          {cluster.driverName && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 w-fit">
                              Chofer: {cluster.driverName} {cluster.unit ? `(U-${cluster.unit})` : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#1A1A24] rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Pedidos en este punto ({cluster.assignments.length}):
                        </p>
                        <div className="flex flex-col gap-1.5 divide-y divide-slate-100 dark:divide-slate-800/40">
                          {cluster.assignments.map((a: any) => (
                            <div key={a.id} className="flex items-center justify-between pt-1.5 first:pt-0 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white font-mono">
                                  #{a.orderCode}
                                </span>
                                {a.waybill && (
                                  <span className="text-[11px] font-mono text-slate-400">
                                    Guía: #{a.waybill}
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                {a.clientName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          {cluster.canModify ? "Ruta pendiente" : `Ruta ${cluster.routeStatus || "bloqueada"}`}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!cluster.canModify || groupMutation.isPending}
                          onClick={() => setClusterToConfirm(cluster)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold py-1.5 px-3.5"
                        >
                          <IconLink size={14} />
                          <span>Unir en 1 parada</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                consolidatedGroups.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-sm font-semibold">No hay paradas consolidadas registradas para hoy.</p>
                  </div>
                ) : (
                  sortedConsolidatedGroups.map((group: any, idx: number) => (
                    <div
                      key={`grouped-${idx}`}
                      className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <IconLink size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-sm">
                            {group.address}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1 w-fit">
                          <IconCheck size={12} /> Consolidado #{idx + 1}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-[#1A1A24] rounded-xl p-3 border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-1.5">
                        {group.assignments.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between text-xs py-1">
                            <span className="font-bold text-slate-900 dark:text-white font-mono">
                              #{a.orderCode} {a.waybill && <span className="font-normal text-slate-400 font-sans">({a.waybill})</span>}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600 dark:text-slate-400">{a.clientName}</span>
                              {group.canModify && (
                                <button
                                  title="Separar este pedido de la parada"
                                  disabled={ungroupMutation.isPending}
                                  onClick={() => ungroupMutation.mutate(a.id)}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors"
                                >
                                  <IconUnlink size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>Chofer: {group.driverName || "Asignado"}</span>
                        {!group.canModify && (
                          <span className="text-amber-500 font-medium">Ruta en curso (bloqueada)</span>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Cluster */}
      {clusterToConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 mx-auto">
              <IconLink size={24} />
            </div>

            <div className="text-center">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                ¿Consolidar pedidos en 1 sola parada?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Los siguientes pedidos se entregarán juntos en una sola visita por el chofer{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {clusterToConfirm.driverName || "asignado"}
                </span>:
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium truncate">
                <IconMapPin size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{clusterToConfirm.address}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {clusterToConfirm.assignments.map((a: any) => (
                  <span
                    key={a.id}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white text-[11px]"
                  >
                    #{a.orderCode}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
              El chofer podrá realizar la entrega conjunta y registrar una sola foto de evidencia para ambos pedidos en la app.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                disabled={groupMutation.isPending}
                onClick={() => setClusterToConfirm(null)}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={groupMutation.isPending}
                onClick={handleConfirmSingleGroup}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                {groupMutation.isPending ? "Consolidando..." : "Sí, consolidar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Group All */}
      {confirmAllOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#1A1A24] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60 mx-auto">
              <IconAlertTriangle size={24} />
            </div>

            <div className="text-center">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                ¿Consolidar todas las paradas sugeridas?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Se unificarán {suggestedClusters.length} paradas compartidas ({totalSuggestedOrders} pedidos en total).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                disabled={groupMutation.isPending}
                onClick={() => setConfirmAllOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={groupMutation.isPending}
                onClick={handleConfirmGroupAll}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                {groupMutation.isPending ? "Consolidando..." : "Sí, consolidar todas"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
