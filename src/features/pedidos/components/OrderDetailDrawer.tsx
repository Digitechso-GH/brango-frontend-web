"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pedidosApi } from "../api/pedidos.api";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Badge } from "@/shared/components/ui/Badge";
import { getOrderStatusConfig } from "@/shared/utils/orderStatus.utils";
import { ORDER_STATUS } from "@/shared/constants/order-status";
import { 
  IconX, 
  IconClock, 
  IconInfoCircle,
  IconChevronDown,
  IconCheck
} from "@tabler/icons-react";
import { GPSBrand } from "@/shared/components/ui/GPSBrand";
import { Select } from "@/shared/components/ui/Select";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
}

export const OrderDetailDrawer = ({ isOpen, onClose, orderId }: OrderDetailDrawerProps) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  
  // Format today's date to YYYY-MM-DD in local time
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-CA'); // 'en-CA' always returns YYYY-MM-DD
  });

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

        if (ev.type === "REGISTERED") {
          const unitStr = assignment.driver?.unit ? `Unidad ${assignment.driver.unit}` : (assignment.driver?.name || "Chofer");
          label = `Asignado a ${unitStr}`;
        } else if (ev.type === "TRANSIT_STARTED") {
          label = "En camino";
          color = "amber";
        } else if (ev.type === "WHATSAPP_NOTIFICATION_SENT") {
          label = "WhatsApp enviado al cliente";
          color = "amber";
        } else if (ev.type === "WHATSAPP_NOTIFICATION_FAILED") {
          label = "Envío a WhatsApp fallido";
          color = "amber";
        } else if (ev.type === "DELIVERED") {
          hasFinalForThisAssignment = true;
          label = "Entrega";
          color = "emerald";
        } else if (ev.type === "OBSERVED") {
          hasFinalForThisAssignment = true;
          label = "Observado";
          color = "red";
        } else if (ev.type === "REASSIGNED") {
          const dateStr = new Date(ev.timestamp).toLocaleDateString("es-PE", { day: 'numeric', month: 'long' });
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

  const latestAssignment = order?.assignments?.[order.assignments.length - 1];
  const evidenceImage = latestAssignment?.evidences?.[0]?.s3Url || null;

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

          {/* 2. Imagen de Evidencia / ePOD */}
          <div className="w-full h-52 bg-slate-50 dark:bg-[#13131A] rounded-2xl border border-gray-200/80 dark:border-[#2D2D3D] flex flex-col items-center justify-center relative overflow-hidden p-3 shadow-sm">
            {showImage ? (
              <>
                {!imgLoaded && (
                  <div className="absolute inset-0 m-3 bg-gray-200 dark:bg-[#2D2D3D] animate-pulse rounded-lg" />
                )}
                <img
                  src={evidenceImage}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  alt="Evidencia / ePOD"
                  className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                />
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
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Cliente</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white text-right">
                {getClientName(order)}
              </span>
            </div>

            {/* Chofer Asignado */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Chofer asignado</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white text-right">
                {order.driver
                  ? `${order.driver.name || "Sin nombre"}${order.driver.unit ? ` — Unidad ${order.driver.unit}` : ""}`
                  : "No asignado"}
              </span>
            </div>

            {/* Contacto Cliente */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Contacto cliente</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white text-right">
                {order.recipientPhone || "-"}
              </span>
            </div>

            {/* Contacto Almacén */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-[#2D2D3D]">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Contacto almacén</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white text-right">
                {order.warehouseContact || "-"}
              </span>
            </div>

            {/* Motivo de Observación (Solo si la asignación activa fue marcada como OBSERVED) */}
            {order.reasonText && (
              <div className="flex justify-between items-start py-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">Motivo de observación</span>
                <span className="text-xs font-bold text-red-500 text-right ml-4 max-w-[220px] leading-snug">
                  {order.reasonText === 'AUTO_CLOSED_EOD' ? 'Cierre automático fin de jornada (Sin finalizar)' : order.reasonText}
                </span>
              </div>
            )}
          </div>

          {/* 4. Línea de Tiempo */}
          <div className="flex flex-col gap-3 pt-2">
            <h4 className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              LÍNEA DE TIEMPO
            </h4>

            <div className="relative pl-1 flex flex-col gap-5">
              <div className="absolute left-[17px] top-3 bottom-3 w-[2px] bg-gray-100 dark:bg-[#2D2D3D]"></div>

              {buildTimelineEvents(order).map((timeline) => {
                if (timeline.isDivider) {
                  return (
                    <div key={timeline.id} className="relative py-3 w-full z-10 bg-white dark:bg-[#1A1A24]">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t-2 border-dashed border-gray-200 dark:border-[#3D3D4D]"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white dark:bg-[#1A1A24] px-3 text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase">
                          {timeline.label} {timeline.subLabel && <span className="font-medium opacity-60">({timeline.subLabel})</span>}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={timeline.id} className="relative flex items-start gap-3">
                    <div className="relative z-10 shrink-0 mt-0.5">
                      <div className={`w-7 h-7 rounded-full bg-white dark:bg-[#1A1A24] flex items-center justify-center shrink-0 z-10 ${
                        timeline.color === 'emerald' ? 'text-emerald-500' : 
                        timeline.color === 'amber' ? 'text-amber-500' : 
                        timeline.color === 'red' ? 'text-red-500' : 
                        'text-gray-400'
                      }`}>
                        {timeline.icon}
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[13px] font-bold leading-tight text-gray-900 dark:text-white">
                        {timeline.label}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-0.5 flex gap-1">
                        <span>{new Date(timeline.date).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                        {timeline.subLabel && <span>· {timeline.subLabel}</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end border-t border-gray-100 dark:border-[#2D2D3D] pt-4">
            <button
              type="button"
              disabled={order.status !== ORDER_STATUS.OBSERVED}
              className={`px-5 py-2.5 border rounded-xl text-[13px] font-bold transition-all ${
                order.status === ORDER_STATUS.OBSERVED
                  ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm'
                  : 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-[#1A1A24] cursor-not-allowed opacity-70'
              }`}
              onClick={() => {
                setIsReassignModalOpen(true);
              }}
            >
              Reasignar unidad
            </button>
          </div>

          {/* Modal Overlay de Reasignación */}
          {isReassignModalOpen && (
            <div className="absolute inset-0 z-50 bg-white/80 dark:bg-[#13131A]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
              <div className="bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2D3D] rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Reasignar Pedido</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  Elige a la nueva unidad que se encargará de realizar este recorrido desde cero.
                </p>

                <div className="relative mb-6">
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
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                    Fecha de reasignación
                  </label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 dark:bg-[#13131A] border border-gray-200 dark:border-[#2D2D3D] text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 transition-colors"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={reassignMutation.isPending}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2D2D3D] text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#2D2D3D]/50 transition-colors"
                    onClick={() => setIsReassignModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedDriverId || reassignMutation.isPending}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    onClick={() => reassignMutation.mutate(selectedDriverId)}
                  >
                    {reassignMutation.isPending ? "Procesando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </BaseDrawer>
  );
};
