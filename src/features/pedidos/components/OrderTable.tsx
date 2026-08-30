"use client";

import React, { useState, useEffect } from "react";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { 
  IconEye, 
  IconPencil, 
  IconSearch, 
  IconTrash, 
  IconUpload, 
  IconPlus 
} from "@tabler/icons-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { pedidosApi } from "../api/pedidos.api";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

import { usePedidosQuery, useDriversQuery } from "../hooks/usePedidosQueries";
import { useAssignDriverMutation, useStartRouteMutation } from "../hooks/usePedidosMutations";
import { getOrderStatusConfig } from "@/shared/utils/orderStatus.utils";
import { ORDER_STATUS } from "@/shared/constants/order-status";

interface OrderTableProps {
  onEdit?: (order: any) => void;
  onCreate?: () => void;
  onImportExcel?: () => void;
}

export const OrderTable = ({ onEdit, onCreate, onImportExcel }: OrderTableProps) => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [selectedDriver, setSelectedDriver] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>();

  // Estado de Búsqueda y Paginación
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

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

  const { data: drivers = [] } = useDriversQuery();

  // 2. Mutaciones
  const queryClient = useQueryClient();
  const assignDriverMutation = useAssignDriverMutation(() => {
    setRowSelection({});
    setSelectedDriver("");
  });

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

  const columns = [
    { 
      header: "PEDIDO", 
      accessorKey: "code",
      cell: (info: any) => {
        const row = info.row.original;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              #{row.code || info.getValue()}
            </span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {row.waybill ? `#${row.waybill}` : "sin guía"}
            </span>
          </div>
        );
      }
    },
    {
      header: "CLIENTE",
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
      header: "DIRECCIÓN DE ENTREGA",
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
      header: "CHOFER",
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
            <span className="w-6 h-6 rounded-full bg-purple-100/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[11px] shrink-0">
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
      header: "ESTADO",
      accessorKey: "status",
      meta: { align: "center" },
      cell: (info: any) => {
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
      header: "ACCIONES",
      accessorKey: "actions",
      meta: { align: "center" },
      cell: (info: any) => {
        const order = info.row.original;
        const isEditable = order.status === ORDER_STATUS.PENDING;
        const isDeletable = order.status === ORDER_STATUS.PENDING && !order.driverId;

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
              title={isEditable ? "Editar Pedido" : "Solo se pueden editar pedidos en estado Pendiente"}
              disabled={!isEditable}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
              onClick={() => onEdit && onEdit(order)}
            >
              <IconPencil size={17} />
            </button>
            <button
              title={isDeletable ? "Eliminar Pedido" : "Solo se pueden eliminar pedidos en estado Pendiente y sin asignar"}
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

  // Mapear choferes a opciones de Select
  const driverOptions = [
    { label: "Seleccionar chofer...", value: "" },
    ...drivers.map((d: any) => ({
      label: `${d.name || "Sin nombre"}${d.unit ? ` (${d.unit})` : ""}`,
      value: d.id,
    })),
  ];

  // Resolver IDs de pedidos seleccionados usando los índices de rowSelection
  const selectedOrderIds = Object.keys(rowSelection)
    .filter((k) => rowSelection[k])
    .map((indexKey) => orders[parseInt(indexKey)]?.id)
    .filter(Boolean);

  const handleAssignDriver = () => {
    if (selectedOrderIds.length > 0 && selectedDriver) {
      assignDriverMutation.mutate({
        orderIds: selectedOrderIds,
        driverId: selectedDriver,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Asignación por Lote */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-3.5 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-semibold">
              {selectedOrderIds.length}
            </span>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Pedidos seleccionados para asignar
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-60">
              <Select
                options={driverOptions}
                value={selectedDriver}
                onChange={(val) => setSelectedDriver(val)}
                variant="filter"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedDriver || assignDriverMutation.isPending}
              onClick={handleAssignDriver}
            >
              {assignDriverMutation.isPending ? "Asignando..." : "Asignar Chofer"}
            </Button>
          </div>
        </div>
      )}

      {/* Barra Superior: Buscador + Contador + Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, pedido, guía..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1A24] border border-slate-200/90 dark:border-slate-800 rounded-2xl text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {meta.total} resultados
          </span>

          {onImportExcel && (
            <Button variant="outline" size="md" onClick={onImportExcel} className="rounded-xl">
              <IconUpload size={16} />
              <span>Cargar Excel</span>
            </Button>
          )}

          {onCreate && (
            <Button variant="primary" size="md" onClick={onCreate} className="rounded-xl">
              <IconPlus size={16} />
              <span>Nuevo pedido</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <CleanTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableRowSelection={(row) => row.original.status === ORDER_STATUS.PENDING}
        pagination={{
          page,
          totalPages: meta.totalPages,
          totalCount: meta.total,
          onPageChange: setPage,
        }}
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
