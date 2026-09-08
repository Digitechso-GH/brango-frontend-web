"use client";

import React, { useState, useEffect } from "react";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { 
  IconEye, 
  IconPencil, 
  IconSearch, 
  IconTrash, 
  IconUpload, 
  IconPlus,
  IconLink,
  IconCheck
} from "@tabler/icons-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { pedidosApi } from "../api/pedidos.api";
import { ConsolidateStopsWidget } from "./ConsolidateStopsWidget";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

import { usePedidosQuery } from "../hooks/usePedidosQueries";
import { getOrderStatusConfig } from "@/shared/utils/orderStatus.utils";
import { ORDER_STATUS } from "@/shared/constants/order-status";
import { getOrderValidity } from "@/shared/utils/orderValidity.utils";
import { formatLocalDate } from "@/shared/utils/date";

interface OrderTableProps {
  onEdit?: (order: any) => void;
  onCreate?: () => void;
  onImportExcel?: () => void;
}

export const OrderTable = ({ onEdit, onCreate, onImportExcel }: OrderTableProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>();

  // Estado de Búsqueda y Paginación
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100); // Límite amplio para ver todos los pedidos sin paginación

  // Reiniciar a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // 1. Queries
  const { data: ordersResponse, isLoading } = usePedidosQuery({
    search: debouncedSearch,
    page,
    limit,
  });
  
  const orders = ordersResponse?.data || [];
  const meta = ordersResponse?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 };

  // 2. Mutaciones
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pedidosApi.deleteOrder(id),
    onSuccess: () => {
      toast.success("Pedido eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
        "No se pudo eliminar el pedido. Verifique que siga pendiente y sin chofer."
      );
    },
  });

  const stopGroupMap = React.useMemo(() => {
    const tempMap = new Map<
      string,
      { minCode: number; members: string[]; statuses: string[] }
    >();

    for (const ord of orders) {
      if (ord.stopGroupId) {
        const codeNum = Number(ord.code) || 0;
        if (!tempMap.has(ord.stopGroupId)) {
          tempMap.set(ord.stopGroupId, {
            minCode: codeNum,
            members: [],
            statuses: [],
          });
        }
        const data = tempMap.get(ord.stopGroupId)!;
        if (codeNum < data.minCode) {
          data.minCode = codeNum;
        }
        data.members.push(`#${ord.code}`);
        data.statuses.push(ord.status);
      }
    }

    // Orden ascendente por el menor código del grupo: el anterior se mantiene como #1 y el nuevo es #2, #3...
    const sortedGroups = Array.from(tempMap.entries())
      .map(([stopGroupId, data]) => ({ stopGroupId, ...data }))
      .sort((a, b) => a.minCode - b.minCode);

    const map = new Map<
      string,
      {
        number: number;
        members: string[];
        total: number;
        statusStyle: {
          badge: string;
          dot: string;
          iconType: "check" | "link" | "pulse";
        };
      }
    >();

    sortedGroups.forEach((grp, index) => {
      const num = index + 1;
      const isDelivered = grp.statuses.length > 0 && grp.statuses.every((s) => s === ORDER_STATUS.DELIVERED);
      const isInTransit = grp.statuses.some((s) => s === ORDER_STATUS.IN_TRANSIT);
      const isFailed = grp.statuses.some((s) => s === ORDER_STATUS.FAILED || s === ORDER_STATUS.OBSERVED);

      let statusStyle: {
        badge: string;
        dot: string;
        iconType: "check" | "link" | "pulse";
      } = {
        badge: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-800/60",
        dot: "bg-blue-500",
        iconType: "link",
      };

      if (isDelivered) {
        statusStyle = {
          badge: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800/60",
          dot: "bg-emerald-500",
          iconType: "check" as const,
        };
      } else if (isInTransit) {
        statusStyle = {
          badge: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800/60",
          dot: "bg-amber-500 animate-pulse",
          iconType: "pulse" as const,
        };
      } else if (isFailed) {
        statusStyle = {
          badge: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200/80 dark:border-rose-800/60",
          dot: "bg-rose-500",
          iconType: "link" as const,
        };
      }

      map.set(grp.stopGroupId, {
        number: num,
        members: grp.members,
        total: grp.members.length,
        statusStyle,
      });
    });

    return map;
  }, [orders]);

  const columns = [
    { 
      header: "Pedido", 
      accessorKey: "code",
      meta: { align: "center" },
      cell: (info: any) => {
        const row = info.row.original;
        const groupInfo = row.stopGroupId ? stopGroupMap.get(row.stopGroupId) : null;
        const siblingCodes = groupInfo ? groupInfo.members.filter((m) => m !== `#${row.code}`) : [];

        return (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              #{row.code || info.getValue()}
            </span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {row.waybill ? `#${row.waybill}` : "sin guía"}
            </span>
            {groupInfo && (
              <span
                title={`Consolidado #${groupInfo.number} (${groupInfo.members.join(", ")}): ${groupInfo.statusStyle.iconType === "check" ? "Entregado" : "Parada consolidada"}`}
                className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs mt-1 transition-all ${groupInfo.statusStyle.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${groupInfo.statusStyle.dot}`} />
                {groupInfo.statusStyle.iconType === "check" ? (
                  <IconCheck size={11} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <IconLink size={10} className="shrink-0" />
                )}
                <span>Consolidado #{groupInfo.number}</span>
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: "Cliente",
      accessorFn: (row: any) => {
        if (row.recipientCustomerType === "INDIVIDUAL") {
          return row.recipientName ?? "—";
        }
        return row.customer?.name ?? "—";
      },
      cell: (info: any) => {
        const row = info.row.original;
        const mainName =
          row.recipientCustomerType === "INDIVIDUAL"
            ? (row.recipientName ?? "—")
            : (row.customer?.name ?? "—");

        return (
          <span className="font-bold text-xs text-slate-900 dark:text-white">
            {mainName}
          </span>
        );
      }
    },
    {
      header: "Dirección de Entrega",
      accessorFn: (row: any) => row.formattedAddress || row.rawAddress || "-",
      meta: { align: "center" },
      cell: (info: any) => {
        const row = info.row.original;

        let displayAddress = row.formattedAddress;
        if (!displayAddress || displayAddress.startsWith("http")) {
          displayAddress = row.rawAddress;
        }
        if (!displayAddress || displayAddress.startsWith("http")) {
          displayAddress = row.latitude && row.longitude
            ? `Ubicación GPS (${Number(row.latitude).toFixed(3)}, ${Number(row.longitude).toFixed(3)})`
            : "Dirección de entrega";
        }

        return (
          <span className="text-xs font-normal text-slate-600 dark:text-slate-300 truncate max-w-xs block text-center mx-auto" title={displayAddress}>
            {displayAddress}
          </span>
        );
      }
    },
    {
      header: "Chofer",
      accessorFn: (row: any) => row.driver?.name || "No asignado",
      meta: { align: "center" },
      cell: (info: any) => {
        const driverName = info.row.original.driver?.name;
        if (!driverName) {
          return <span className="text-xs italic text-slate-400 font-normal">No asignado</span>;
        }

        const initial = driverName.charAt(0).toUpperCase();

        return (
          <div className="inline-flex items-center gap-2 justify-center">
            <span className="w-6 h-6 rounded-full bg-blue-100/80 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">
              {initial}
            </span>
            <span className="font-medium text-xs text-slate-800 dark:text-slate-200">
              {driverName}
            </span>
          </div>
        );
      }
    },
    {
      header: "Estado Pedido",
      accessorKey: "status",
      meta: { align: "center" },
      cell: (info: any) => {
        const order = info.row.original;
        if (order?.isPaused) {
          return (
            <Badge variant="warning" withDot>
              Pausado
            </Badge>
          );
        }

        const val = info.getValue();
        const statusConfig = getOrderStatusConfig(val);

        return (
          <Badge variant={statusConfig.variant} withDot>
            {statusConfig.label}
          </Badge>
        );
      }
    },
    {
      header: "Plazo / Vencimiento",
      accessorKey: "dueDate",
      meta: { align: "center" },
      cell: (info: any) => {
        const order = info.row.original;
        const dueText = order.dueDate ? formatLocalDate(order.dueDate, { format: "short" }) : "Fin del día";
        const createdText = order.createdAt ? formatLocalDate(order.createdAt, { format: "short" }) : "-";

        return (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {dueText}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Inicio: {createdText}
            </span>
          </div>
        );
      }
    },
    {
      header: "Vigencia Pedido",
      id: "validity",
      meta: { align: "center" },
      cell: (info: any) => {
        const order = info.row.original;
        const validity = getOrderValidity(order.createdAt, order.dueDate);
        const badgeVariant =
          validity.status === "FRESH"
            ? "success"
            : validity.status === "WARNING"
            ? "warning"
            : "danger";

        return (
          <Badge variant={badgeVariant} withDot>
            {validity.label}
          </Badge>
        );
      }
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      meta: { align: "center" },
      cell: (info: any) => {
        const order = info.row.original;
        const isEditable = order.status === ORDER_STATUS.PENDING && !order.driverId && !order.routeAssignmentId;
        const isDeletable = order.status === ORDER_STATUS.PENDING && !order.driverId && !order.routeAssignmentId;

        return (
          <div className="flex items-center justify-center gap-2">
            <button
              title="Ver Detalles"
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              onClick={() => {
                setActiveOrderId(order.id);
                setDrawerOpen(true);
              }}
            >
              <IconEye size={17} />
            </button>
            <button
              title={
                isEditable
                  ? "Editar Pedido"
                  : order.driverId || order.routeAssignmentId
                  ? "No se puede editar: el pedido ya está asignado a un chofer o ruta"
                  : "Solo se pueden editar pedidos en estado Pendiente y sin asignar"
              }
              disabled={!isEditable}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
              onClick={() => onEdit && onEdit(order)}
            >
              <IconPencil size={17} />
            </button>
            <button
              title={
                isDeletable
                  ? "Eliminar Pedido"
                  : order.driverId || order.routeAssignmentId
                  ? "No se puede eliminar: el pedido ya está asignado a un chofer o ruta"
                  : "Solo se pueden eliminar pedidos en estado Pendiente y sin asignar"
              }
              disabled={!isDeletable || deleteMutation.isPending}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
              onClick={() => {
                if (window.confirm("¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.")) {
                  deleteMutation.mutate(order.id);
                }
              }}
            >
              <IconTrash size={17} />
            </button>
          </div>
        );
      }
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Búsqueda en Paper Card */}
      <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, pedido, guía..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#13131A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
            {meta.total} {meta.total === 1 ? "resultado" : "resultados"}
          </span>

          <ConsolidateStopsWidget />
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <CleanTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        /* pagination={{
          page,
          totalPages: meta.totalPages,
          totalCount: meta.total,
          onPageChange: setPage,
        }} */
      />

      {/* Drawer de Detalle */}
      <OrderDetailDrawer
        orderId={activeOrderId}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setActiveOrderId(undefined);
        }}
      />
    </div>
  );
};
