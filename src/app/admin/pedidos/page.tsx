"use client";

import React, { useState } from "react";
import { 
  IconBox,
  IconShoppingBag, 
  IconClock, 
  IconAlertTriangle, 
  IconCheck,
  IconUpload,
  IconPlus
} from "@tabler/icons-react";
import { OrderTable } from "@/features/pedidos/components/OrderTable";
import { OrderDrawer } from "@/features/pedidos/components/OrderDrawer";
import { Button } from "@/shared/components/ui/Button";
import { pedidosApi } from "@/features/pedidos/api/pedidos.api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePedidosQuery, usePedidosTodayQuery } from "@/features/pedidos/hooks/usePedidosQueries";
import { ORDER_STATUS } from "@/shared/constants/order-status";

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Queries para métricas del dashboard
  const { data: ordersResponse } = usePedidosQuery({ page: 1, limit: 100 });
  const { data: todayOrders = [] } = usePedidosTodayQuery();

  const allOrders = ordersResponse?.data || [];
  const totalOrders = ordersResponse?.meta?.total ?? allOrders.length;
  const inTransitOrders = allOrders.filter((o: any) => o.status === ORDER_STATUS.IN_TRANSIT).length;
  const observedOrders = allOrders.filter((o: any) => o.status === ORDER_STATUS.OBSERVED || o.status === ORDER_STATUS.FAILED).length;
  const deliveredOrders = (Array.isArray(todayOrders) ? todayOrders : allOrders).filter((o: any) => o.status === ORDER_STATUS.DELIVERED).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Subiendo y procesando archivo Excel...");

    pedidosApi.importOrdersExcel(file)
      .then((res) => {
        const count = res.totalImportados || (Array.isArray(res) ? res.length : 1);
        toast.success(`Importación exitosa: ${count} pedidos creados`, { id: toastId });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["orders-today"] });
      })
      .catch((err) => {
        toast.dismiss(toastId);
        const resData = err.response?.data;
        const errors = resData?.errors;

        if (Array.isArray(errors) && errors.length > 0) {
          const description = errors
            .map((e: any) => (e.fila ? `Fila ${e.fila}: ${e.error}` : e.error || e))
            .join(" | ");

          toast.error(resData.message || "Error al importar el archivo Excel", {
            description,
            duration: 10000,
          });
        } else {
          toast.error(resData?.message || err.message || "Error al importar el archivo Excel", {
            duration: 6000,
          });
        }
      })
      .finally(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
  };

  const handleEdit = (order: any) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedOrder(null);
    setIsDrawerOpen(true);
  };

  const handleClose = () => {
    setSelectedOrder(null);
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden File Input for Excel Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".xlsx,.xls,.csv"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <IconBox size={22} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Pedidos
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Todo lo que se mueve hoy, en un solo lugar.
          </p>
        </div>

        {/* Action buttons at header level */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl"
          >
            <IconUpload size={16} />
            <span>Cargar Excel</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleCreate}
            className="rounded-xl"
          >
            <IconPlus size={16} />
            <span>Nuevo pedido</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Pedidos</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">{totalOrders}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 shrink-0">
            <IconShoppingBag className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">En Ruta Ahora</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">{inTransitOrders}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 shrink-0">
            <IconClock className="text-amber-600 dark:text-amber-400" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Observados</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">{observedOrders}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 shrink-0">
            <IconAlertTriangle className="text-rose-600 dark:text-rose-400" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Entregados Hoy</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">{deliveredOrders}</h3>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 shrink-0">
            <IconCheck className="text-emerald-600 dark:text-emerald-400" size={24} />
          </div>
        </div>
      </div>

      {/* Main Table with integrated action bar */}
      <OrderTable 
        onEdit={handleEdit} 
      />

      {/* Create / Edit Drawer */}
      <OrderDrawer
        isOpen={isDrawerOpen}
        onClose={handleClose}
        order={selectedOrder}
      />
    </div>
  );
}
