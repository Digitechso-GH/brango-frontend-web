"use client";

import React, { useState, useEffect } from "react";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { IconEye, IconPencil, IconMapPin, IconSearch, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

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
}

export const OrderTable = ({ onEdit }: OrderTableProps) => {
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
  const assignDriverMutation = useAssignDriverMutation(() => {
    setRowSelection({});
    setSelectedDriver("");
  });
  const startRouteMutation = useStartRouteMutation();

  const columns = [
    { header: "Nº Pedido", accessorKey: "code" },
    {
      header: "Guía",
      accessorKey: "waybill",
      cell: (info: any) => {
        const val = info.getValue();
        return val ? <span className="font-mono text-gray-500">#{val}</span> : <span className="text-gray-400">-</span>;
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
          <span className="font-bold text-gray-900 dark:text-white">
            {mainName}
          </span>
        );
      }
    },
    {
      header: "Dirección de Entrega",
      accessorFn: (row: any) => row.formattedAddress || row.rawAddress || "-",
      cell: (info: any) => {
        const row = info.row.original;

        // Preferencia de visualización en UI (dirección formateada de geocoding o cruda)
        let displayAddress = row.formattedAddress;
        if (!displayAddress || displayAddress.startsWith("http")) {
          displayAddress = row.rawAddress;
        }
        if (!displayAddress || displayAddress.startsWith("http")) {
          displayAddress = row.latitude && row.longitude
            ? `Ubicación GPS (${Number(row.latitude).toFixed(3)}, ${Number(row.longitude).toFixed(3)})`
            : "Dirección de entrega";
        }

        // Resolver la URL de Google Maps
        let mapsUrl = "";
        if (row.rawAddress && row.rawAddress.startsWith("http")) {
          mapsUrl = row.rawAddress;
        } else if (row.latitude && row.longitude) {
          mapsUrl = `https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`;
        } else if (displayAddress && !displayAddress.startsWith("http")) {
          mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`;
        }

        return (
          <div className="flex items-start gap-1.5 max-w-xs mx-auto">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Ver ubicación en el mapa"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:scale-110 transition-transform shrink-0 mt-0.5"
              >
                <IconMapPin size={16} />
              </a>
            )}
            <span className="font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
              {displayAddress}
            </span>
          </div>
        );
      }
    },
    {
      header: "Chofer",
      accessorFn: (row: any) => row.driver?.name || "No asignado",
      cell: (info: any) => {
        const val = info.row.original.driver?.name;
        return val ? (
          <span className="font-bold text-gray-900 dark:text-white">{val}</span>
        ) : (
          <span className="text-gray-400 font-medium">No asignado</span>
        );
      }
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: (info: any) => {
        const val = info.getValue();
        const statusConfig = getOrderStatusConfig(val);

        return (
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
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
        const isEditable = order.status === ORDER_STATUS.PENDING;

        return (
          <div className="flex items-center justify-center gap-3">
            <button
              title="Ver Detalles"
              className="text-gray-400 hover:text-accent transition-colors cursor-pointer"
              onClick={() => {
                setActiveOrderId(order.id);
                setDrawerOpen(true);
              }}
            >
              <IconEye size={18} stroke={2} />
            </button>
            {isEditable ? (
              <button
                title="Editar Pedido"
                className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                onClick={() => onEdit && onEdit(order)}
              >
                <IconPencil size={18} stroke={2} />
              </button>
            ) : (
              <button
                disabled
                title="Solo se pueden editar pedidos en estado Pendiente"
                className="text-gray-300 dark:text-gray-600 opacity-60 cursor-default select-none pointer-events-none"
              >
                <IconPencil size={18} stroke={1.6} />
              </button>
            )}
          </div>
        );
      }
    },
  ];

  // Mapear choferes a opciones de Select
  const driverOptions = [
    { label: "Seleccionar chofer...", value: "" },
    ...drivers.map((d: any) => ({
      label: `${d.name || "Sin nombre"} (${d.unit || "Sin unidad"})`,
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
    <div className="flex-1 flex flex-col gap-4">
      {selectedOrderIds.length > 0 && (
        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
              {selectedOrderIds.length}
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Pedidos seleccionados para asignar
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Select
                options={driverOptions}
                value={selectedDriver}
                onChange={(val) => setSelectedDriver(val)}
              />
            </div>
            <Button
              variant="primary"
              disabled={!selectedDriver || assignDriverMutation.isPending}
              onClick={handleAssignDriver}
            >
              {assignDriverMutation.isPending ? "Asignando..." : "Asignar Chofer"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm overflow-hidden flex flex-col">
        {/* Header con Buscador */}
        <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, pedido, guía..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#181824] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {meta.total} resultados
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <CleanTable
            columns={columns}
            data={orders}
            isLoading={isLoading}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            enableRowSelection={(row) => row.original.status === ORDER_STATUS.PENDING}
          />
        </div>
        
        {/* Footer con Paginación */}
        {/* Footer con Paginación - Comentado para futura facturación
        <div className="p-4 border-t border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between bg-gray-50/50 dark:bg-[#181824]/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mostrar:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-white dark:bg-[#1D1D2B] border border-gray-200 dark:border-[#2D2D3D] rounded-lg text-sm font-medium px-2 py-1 focus:outline-none text-gray-700 dark:text-gray-300"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Página {meta.page} de {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.page <= 1}
                className="px-2"
              >
                <IconChevronLeft size={18} />
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={meta.page >= meta.totalPages}
                className="px-2"
              >
                <IconChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
        */}
      </div>

      <OrderDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        orderId={activeOrderId}
      />
    </div>
  );
};
