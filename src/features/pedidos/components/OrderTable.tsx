"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/api/axios";
import { toast } from "sonner";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { OrderDetailDrawer } from "./OrderDetailDrawer";
import { IconEye, IconPlayerPlay, IconPencil } from "@tabler/icons-react";

interface OrderTableProps {
  onEdit?: (order: any) => void;
}

export const OrderTable = ({ onEdit }: OrderTableProps) => {
  const queryClient = useQueryClient();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [selectionOrder, setSelectionOrder] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>();

  // 1. Query para listar pedidos
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data.data || [];
    },
  });

  // 2. Query para listar choferes activos
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await api.get("/drivers");
      return res.data.data || [];
    },
  });

  // 3. Mutación para asignar chofer a pedidos
  const assignDriverMutation = useMutation({
    mutationFn: async ({ orderIds, driverId }: { orderIds: string[]; driverId: string }) => {
      await Promise.all(
        orderIds.map((id) => api.put(`/orders/${id}`, { driverId }))
      );
    },
    onSuccess: () => {
      toast.success("Chofer asignado correctamente a los pedidos seleccionados");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setRowSelection({});
      setSelectedDriver("");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Error al asignar chofer";
      toast.error(msg);
    },
  });

  // 4. Mutación para iniciar recorrido de pedido
  const startRouteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await api.put(`/orders/${orderId}/status`, { estado: "IN_TRANSIT" });
    },
    onSuccess: () => {
      toast.success("Recorrido iniciado correctamente");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Error al iniciar el recorrido";
      toast.error(msg);
    },
  });

  useEffect(() => {
    setSelectionOrder((prev) => {
      const stillSelected = prev.filter((id) => rowSelection[id]);
      const newIds = Object.keys(rowSelection).filter(
        (id) => rowSelection[id] && !prev.includes(id)
      );
      return [...stillSelected, ...newIds];
    });
  }, [rowSelection]);

  const columns = [
    {
      id: "select",
      header: ({ table }: any) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
          />
        </div>
      ),
      cell: ({ row }: any) => {
        const index = selectionOrder.indexOf(row.id);
        const orderNumber = index !== -1 ? index + 1 : null;
        
        return (
          <div className="px-1 flex items-center justify-center gap-1.5 min-w-[32px]">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 disabled:opacity-30 cursor-pointer"
            />
            {orderNumber ? (
              <span className="w-4 h-4 bg-accent text-white text-[10px] font-bold flex items-center justify-center rounded-sm shadow-sm transition-all animate-in zoom-in">
                {orderNumber}
              </span>
            ) : (
              <span className="w-4 h-4" />
            )}
          </div>
        );
      },
      meta: { align: "center" }
    },
    { header: "Nº Pedido", accessorKey: "codigo" },
    { 
      header: "Guía", 
      accessorKey: "guia", 
      cell: (info: any) => {
        const val = info.getValue();
        return val ? <span className="font-mono text-gray-500">#{val}</span> : <span className="text-gray-400">-</span>;
      }
    },
    { 
      header: "Cliente", 
      accessorFn: (row: any) => row.cliente?.nombre || "-" 
    },
    { 
      header: "Dirección de Entrega", 
      accessorKey: "direccionOriginal" 
    },
    { 
      header: "Chofer", 
      accessorFn: (row: any) => row.driver?.usuario?.nombre || <span className="text-gray-400 font-medium">No asignado</span> 
    },
    { 
      header: "Estado", 
      accessorKey: "estado", 
      cell: (info: any) => {
        const val = info.getValue();
        const labelMap: Record<string, string> = {
          PENDING: "Pendiente",
          IN_TRANSIT: "En camino",
          DELIVERED: "Entregado",
          FAILED: "Fallido",
        };
        const label = labelMap[val] || val;

        return (
          <Badge 
            variant={
              val === "PENDING" 
                ? "default" 
                : val === "IN_TRANSIT" 
                ? "warning" 
                : val === "DELIVERED" 
                ? "success" 
                : "danger"
            }
          >
            {label}
          </Badge>
        );
      } 
    },
    { 
      header: "Acciones", 
      accessorKey: "actions", 
      meta: { align: "center" },
      cell: (info: any) => (
        <div className="flex items-center justify-center gap-3">
          <button 
            title="Ver Detalles"
            className="text-gray-400 hover:text-accent transition-colors cursor-pointer"
            onClick={() => {
              setActiveOrderId(info.row.original.id);
              setDrawerOpen(true);
            }}
          >
            <IconEye size={18} stroke={2} />
          </button>
          <button 
            title="Editar Pedido"
            className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
            onClick={() => onEdit && onEdit(info.row.original)}
          >
            <IconPencil size={18} stroke={2} />
          </button>
          {info.row.original.estado === "PENDING" && (
            <button 
              title="Iniciar Recorrido"
              className="text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer"
              onClick={() => startRouteMutation.mutate(info.row.original.id)}
            >
              <IconPlayerPlay size={18} stroke={2} />
            </button>
          )}
        </div>
      ) 
    },
  ];

  // Mapear choferes a opciones de Select
  const driverOptions = [
    { label: "Seleccionar chofer...", value: "" },
    ...drivers.map((d: any) => ({
      label: `${d.usuario?.nombre || "Chofer"} (${d.unidad || "Sin unidad"})`,
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
        <CleanTable 
          columns={columns} 
          data={orders} 
          isLoading={isLoading} 
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          enableRowSelection={(row) => row.original.estado === "PENDING"}
        />
      </div>

      <OrderDetailDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        orderId={activeOrderId} 
      />
    </div>
  );
};
