"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pedidosApi } from "../api/pedidos.api";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { getOrderStatusConfig } from "@/shared/utils/orderStatus.utils";
import { ORDER_STATUS } from "@/shared/constants/order-status";
import { 
  IconX, 
  IconClock, 
  IconInfoCircle,
  IconChevronDown,
  IconCheck,
  IconLink,
  IconUnlink
} from "@tabler/icons-react";
import { GPSBrand } from "@/shared/components/ui/GPSBrand";
import { Select } from "@/shared/components/ui/Select";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useUngroupStopMutation } from "../hooks/usePedidosMutations";
import { usePauseOrderMutation, useResumeOrderMutation } from "../hooks/usePedidosQueries";
import { toast } from "sonner";
import { getOrderValidity } from "@/shared/utils/orderValidity.utils";
import { getLocalTodayString, formatLocalDate, formatLocalTime } from "@/shared/utils/date";

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export const OrderDetailDrawer = ({ isOpen, onClose, orderId }: OrderDetailDrawerProps) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  
  // Format today's date to YYYY-MM-DD in local time
  const [selectedDate, setSelectedDate] = useState(() => getLocalTodayString());

  const queryClient = useQueryClient();

  // Query para obtener detalles completos del pedido
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => (orderId ? pedidosApi.getOrderDetail(orderId) : null),
    enabled: !!orderId && isOpen,
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => pedidosApi.getDrivers(),
    enabled: isOpen,
  });

  const reassignMutation = useMutation({
    mutationFn: (driverId: string) => {
      if (!order?.routeAssignmentId) throw new Error("No hay asignación activa");
      
      // Force strict UTC midnight string to avoid ANY local timezone shifting
      const payloadDate = `${selectedDate}T00:00:00.000Z`;
      
      return pedidosApi.reassignOrder(order.routeAssignmentId, {
        driverId,
        date: payloadDate,
      });
    },
    onSuccess: () => {
      toast.success("Pedido reasignado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-today"] });
      setIsReassignModalOpen(false);
      setSelectedDriverId("");
    },
    onError: (error: any) => {
      toast.error("Error al reasignar: " + (error.response?.data?.message || error.message));
    }
  });

  const ungroupMutation = useUngroupStopMutation(() => {
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
  });

  const pauseMutation = usePauseOrderMutation();
  const resumeMutation = useResumeOrderMutation();

  const handleTogglePause = async () => {
    if (!order) return;
    try {
      if (order.isPaused) {
        await resumeMutation.mutateAsync(order.id);
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        queryClient.invalidateQueries({ queryKey: ["orders-today"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        toast.success("Pedido reanudado correctamente.");
      } else {
        await pauseMutation.mutateAsync({ id: order.id, reason: "Pausado por operador" });
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        queryClient.invalidateQueries({ queryKey: ["orders-today"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        toast.success("Pedido puesto en pausa.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar estado del pedido");
    }
  };

  React.useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [orderId]);

  const cleanMatrizText = (text?: string | null) => {
    if (!text) return "-";
    return text.replace(/\s*-\s*Matriz/gi, "").replace(/\s*Matriz/gi, "").trim();
  };

  const getClientName = (ord: any): string => {
    if (!ord) return "-";
    const rawName = ord.recipientCustomerType === "INDIVIDUAL" ? ord.recipientName : (ord.customer?.name || ord.recipientName);
    return cleanMatrizText(rawName || "");
  };

  const getStatusBadge = (status: string) => {
    if (order?.isPaused) {
      return (
        <Badge variant="warning" className="text-xs px-3 py-1.5 font-bold tracking-wide rounded-lg">
          <IconClock size={14} />
          PAUSADO
        </Badge>
      );
    }

    const statusConfig = getOrderStatusConfig(status);
    let label = statusConfig.label;

    if (status === ORDER_STATUS.IN_TRANSIT && order?.driver) {
      const driverName = order.driver.name || "Sin nombre";
      const unitStr = order.driver.unit ? ` · Unidad ${order.driver.unit}` : "";
      label = `En camino${unitStr}`;
    } else if (status === ORDER_STATUS.PENDING) {
      label = order?.driver ? "Pendiente" : "PENDIENTE DE ASIGNACIÓN";
    }

    return (
      <Badge variant={statusConfig.variant} className="text-xs px-3 py-1.5 font-bold tracking-wide rounded-lg">
        {status === ORDER_STATUS.IN_TRANSIT ? (
          <GPSBrand size={14} className="currentColor" />
        ) : status === ORDER_STATUS.DELIVERED ? (
          <GPSBrand size={14} className="currentColor" />
        ) : status === ORDER_STATUS.OBSERVED || status === ORDER_STATUS.FAILED ? (
          <IconInfoCircle size={14} />
        ) : (
          <IconClock size={14} />
        )}
        {label}
      </Badge>
    );
  };

  const buildTimelineEvents = (order: any) => {
    if (!order) return [];
    const events: any[] = [];

    events.push({
      id: "created",
      label: "Pedido registrado",
      date: order.createdAt,
      color: "gray",
      subLabel: "carga masiva",
      icon: <GPSBrand size={14} className="currentColor" />
    });

    if (!order.assignments || order.assignments.length === 0) {
      return events;
    }

    order.assignments.forEach((assignment: any, index: number) => {
      const isLastAssignment = index === order.assignments.length - 1;
      const dbEvents = assignment.events || [];
      const sorted = [...dbEvents].sort((a: any, b: any) => {
        const tA = new Date(a.timestamp).getTime();
        const tB = new Date(b.timestamp).getTime();
        if (tA === tB) {
          if (a.type === 'REASSIGNED') return -1;
          if (b.type === 'REASSIGNED') return 1;
        }
        return tA - tB;
      });

      let hasFinalForThisAssignment = false;

      for (const ev of sorted) {
        let label = ev.type;
        let color = "gray";
        let subLabel: string | undefined = undefined;

        if (ev.type === "REGISTERED") {
          const unitStr = assignment.driver?.unit ? `Unidad ${assignment.driver.unit}` : (assignment.driver?.name || "Chofer");
          label = `Asignado a ${unitStr}`;
        } else if (ev.type === "TRANSIT_STARTED") {
          label = "En camino";
          color = "amber";
        } else if (ev.type === "WHATSAPP_NOTIFICATION_SENT") {
          label = "WhatsApp enviado al cliente";
          color = "amber";
        } else if (ev.type === "WHATSAPP_WAREHOUSE_NOTIFICATION_SENT") {
          label = "WhatsApp enviado a almacén";
          color = "amber";
        } else if (ev.type === "WHATSAPP_NOTIFICATION_FAILED") {
          label = "Envío a WhatsApp fallido";
          color = "amber";
        } else if (ev.type === "WHATSAPP_WAREHOUSE_NOTIFICATION_FAILED") {
          label = "Envío a almacén fallido";
          color = "amber";
        } else if (ev.type === "DELIVERED") {
          hasFinalForThisAssignment = true;
          label = "Entrega";
          color = "emerald";
        } else if (ev.type === "OBSERVED") {
          hasFinalForThisAssignment = true;
          label = "Observado";
          color = "red";
          subLabel = ev.metadata?.reasonText || assignment.reasonText || ev.metadata?.reason || order.reasonText || undefined;
        } else if (ev.type === "REASSIGNED") {
          const dateStr = formatLocalDate(ev.timestamp, { format: "long", includeYear: false });
          const actorStr = ev.actor ? `POR ${ev.actor}` : "POR SISTEMA";
          events.push({
            id: ev.id,
            isDivider: true,
            label: `NUEVA REASIGNACIÓN — ${dateStr}`,
            subLabel: actorStr
          });
          continue;
        }

        events.push({
          id: ev.id,
          label,
          subLabel,
          date: ev.timestamp,
          color,
          icon: <GPSBrand size={14} className="currentColor" />
        });
      }
    });

    return events;
  };

  const clientTitle = order ? getClientName(order) : "";
  const orderSubtitle = order && order.code ? `Pedido #${order.code}` : "";

  const latestAssignmentWithEvidence = order?.assignments?.slice().reverse().find((a: any) => a.evidences && a.evidences.length > 0) || order?.assignments?.[order.assignments.length - 1];
  const evidenceImage = latestAssignmentWithEvidence?.evidences?.[0]?.s3Url || null;

  const showImage = !!evidenceImage && !imgError;

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={clientTitle}
      subtitle={orderSubtitle}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400 font-medium">
          Cargando detalles del pedido...
        </div>
      ) : !order ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400 font-medium">
          No se pudo encontrar el pedido.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* 1. Estado Badge */}
          <div className="flex items-center">
            {getStatusBadge(order.status)}
          </div>

          {/* Parada Compartida */}
          {order.stopGroupId && (
            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <IconLink size={15} />
                  <span>Parada Compartida</span>
                </div>
                {order.status === ORDER_STATUS.PENDING && order.routeAssignmentId && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ungroupMutation.isPending}
                    onClick={() => {
                      if (window.confirm("¿Deseas separar este pedido de la parada compartida? Volverá a ser una parada individual.")) {
                        ungroupMutation.mutate(order.routeAssignmentId);
                      }
                    }}
                    className="text-[11px] py-1 px-2.5 rounded-lg border-blue-200 dark:border-blue-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <IconUnlink size={13} />
                    <span>{ungroupMutation.isPending ? "Separando..." : "Separar parada"}</span>
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Este pedido comparte ubicación con otra entrega asignada a la misma unidad. Se entregarán en conjunto en una sola parada de la ruta.
              </p>
            </div>
          )}

          {/* 2. Imagen de Evidencia / ePOD */}
          <div
            onClick={() => showImage && setIsImageModalOpen(true)}
            className={`w-full h-56 bg-slate-100 dark:bg-[#1A1A24] rounded-2xl border border-slate-200/90 dark:border-[#2D2D3D] flex flex-col items-center justify-center relative overflow-hidden p-2 shadow-sm ${
              showImage ? "cursor-pointer group hover:border-blue-500/50 transition-all" : ""
            }`}
          >
            {showImage ? (
              <>
                {!imgLoaded && (
                  <div className="absolute inset-0 m-2 bg-slate-200 dark:bg-[#2D2D3D] animate-pulse rounded-lg" />
                )}
                <img
                  src={evidenceImage}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  alt="Evidencia / ePOD"
                  className={`max-w-full max-h-full w-auto h-auto object-contain rounded-md shadow-sm border border-slate-200/80 dark:border-slate-700/80 transition-opacity duration-300 ${
                    imgLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl">
                  <span className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border border-slate-200/80 flex items-center gap-1.5">
                    🔍 Ampliar imagen
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5 text-gray-400 dark:text-gray-500 p-4">
                <svg className="w-10 h-10 stroke-current opacity-50" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-xs font-semibold text-center text-gray-400 dark:text-gray-500 max-w-[200px] leading-relaxed">
                  Foto disponible al confirmarse la entrega
                </span>
              </div>
            )}
          </div>

          {/* 3. Lista de Datos Principales */}
          <div className="flex flex-col border-t border-b border-gray-100 dark:border-[#2D2D3D] py-1">
            {/* Cliente */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cliente</span>
              <span className="text-xs font-medium text-slate-900 dark:text-white text-right">
                {getClientName(order)}
              </span>
            </div>

            {/* Chofer Asignado */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Chofer asignado</span>
              <span className="text-xs font-medium text-slate-900 dark:text-white text-right">
                {order.driver
                  ? `${order.driver.name || "Sin nombre"}${order.driver.unit ? ` — Unidad ${order.driver.unit}` : ""}`
                  : "No asignado"}
              </span>
            </div>

            {/* Contacto Cliente */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Contacto cliente</span>
              <span className="text-xs font-medium text-slate-900 dark:text-white text-right">
                {order.recipientPhone || "-"}
              </span>
            </div>

            {/* Contacto Almacén */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Contacto almacén</span>
              <span className="text-xs font-medium text-slate-900 dark:text-white text-right">
                {order.warehouseContact || "-"}
              </span>
            </div>

            {/* Vencimiento y Vigencia */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vencimiento</span>
              <div className="flex items-center gap-2">
                {(() => {
                  const val = getOrderValidity(order.createdAt, order.dueDate);
                  const badgeVariant = val.status === "FRESH" ? "success" : val.status === "WARNING" ? "warning" : "danger";
                  return (
                    <Badge variant={badgeVariant} withDot className="text-[10px] py-0.5 px-2">
                      {val.label}
                    </Badge>
                  );
                })()}
                <span className="text-xs font-medium text-slate-900 dark:text-white text-right">
                  {order.dueDate ? formatLocalDate(order.dueDate, { format: "short" }) : "Fin del día"}
                </span>
              </div>
            </div>

            {/* Motivo de Observación */}
            {(() => {
              const reason = order.reasonText || order.assignments?.slice().reverse().find((a: any) => a.reasonText)?.reasonText;
              if (!reason) return null;
              return (
                <div className="flex justify-between items-start py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">Motivo de observación</span>
                  <span className="text-xs font-medium text-red-500 text-right ml-4 max-w-[220px] leading-snug">
                    {reason === 'AUTO_CLOSED_EOD' ? 'Cierre automático fin de jornada (Sin finalizar)' : reason}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* 4. Línea de Tiempo */}
          <div className="flex flex-col gap-3 pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              LÍNEA DE TIEMPO
            </h4>

            <div className="relative pl-1 flex flex-col gap-4">
              <div className="absolute left-[17px] top-3 bottom-3 w-[2px] bg-slate-100 dark:bg-slate-800"></div>

              {buildTimelineEvents(order).map((timeline) => {
                if (timeline.isDivider) {
                  return (
                    <div key={timeline.id} className="relative py-2 w-full z-10 bg-white dark:bg-[#1A1A24]">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white dark:bg-[#1A1A24] px-2.5 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                          {timeline.label} {timeline.subLabel && <span className="font-normal opacity-70">({timeline.subLabel})</span>}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={timeline.id} className="relative flex items-start gap-3">
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div className={`w-7 h-7 rounded-full bg-white dark:bg-[#1A1A24] flex items-center justify-center shrink-0 z-10 border border-slate-100 dark:border-slate-800 shadow-2xs ${
                        timeline.color === 'emerald' ? 'text-emerald-500' : 
                        timeline.color === 'amber' ? 'text-amber-500' : 
                        timeline.color === 'red' ? 'text-red-500' : 
                        'text-slate-400'
                      }`}>
                        {timeline.icon}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-medium leading-tight text-slate-900 dark:text-white">
                        {timeline.label}
                      </span>
                      <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5 flex gap-1">
                        <span>{formatLocalTime(timeline.date)}</span>
                        {timeline.subLabel && <span>· {timeline.subLabel}</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-2">
              {/* Botón Pausar / Reanudar */}
              {order.isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={resumeMutation.isPending}
                  onClick={handleTogglePause}
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  {resumeMutation.isPending ? "Reanudando..." : "Reanudar pedido"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pauseMutation.isPending ||
                    order.status === ORDER_STATUS.IN_TRANSIT ||
                    order.status === ORDER_STATUS.DELIVERED
                  }
                  onClick={handleTogglePause}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  {pauseMutation.isPending ? "Pausando..." : "Pausar pedido"}
                </Button>
              )}

              {/* 
                NOTA: Botón temporalmente comentado para evaluación.
                La reasignación se realiza ahora desde la Torre de Control y el armador de rutas.
              */}
              {/* <Button
                variant="outline"
                size="sm"
                disabled={order.status !== ORDER_STATUS.OBSERVED}
                onClick={() => setIsReassignModalOpen(true)}
              >
                Reasignar unidad
              </Button> */}
            </div>
          </div>

          {/* Modal Overlay de Reasignación */}
          {isReassignModalOpen && (
            <div className="absolute inset-0 z-50 bg-gray-900/40 flex flex-col items-center justify-center p-6">
              <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Reasignar Pedido</h3>
                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                  Elige a la nueva unidad que se encargará de realizar este recorrido.
                </p>

                <div className="relative mb-4">
                  <Select
                    options={[
                      { label: "Seleccionar un chofer...", value: "" },
                      ...(drivers?.map((driver: any) => ({
                        label: `${driver.name} ${driver.unit ? `- Unidad ${driver.unit}` : ""}`,
                        value: driver.id
                      })) || [])
                    ]}
                    value={selectedDriverId}
                    onChange={(val) => setSelectedDriverId(val)}
                  />
                </div>

                <div className="relative mb-6">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Fecha de reasignación
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50/60 dark:bg-[#13131A] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-normal rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsReassignModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    disabled={!selectedDriverId || reassignMutation.isPending}
                    onClick={() => reassignMutation.mutate(selectedDriverId)}
                  >
                    {reassignMutation.isPending ? "Procesando..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Modal para ver la imagen completa */}
      {isImageModalOpen && showImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <a
              href={evidenceImage}
              target="_blank"
              rel="noopener noreferrer"
              download="guia-remision.jpg"
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3.5 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
            >
              Abrir original ↗
            </a>
            <button
              type="button"
              onClick={() => setIsImageModalOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold border border-white/20 transition-all"
            >
              ✕
            </button>
          </div>

          <div
            className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={evidenceImage}
              alt="Guía de Remisión Completa"
              className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-lg shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </BaseDrawer>
  );
};
