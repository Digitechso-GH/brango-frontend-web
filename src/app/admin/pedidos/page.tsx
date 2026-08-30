"use client";

import React, { useState } from "react";
import { 
  IconShoppingBag, 
  IconClock, 
  IconAlertTriangle, 
  IconCheck 
} from "@tabler/icons-react";
import { OrderTable } from "@/features/pedidos/components/OrderTable";
import { OrderDrawer } from "@/features/pedidos/components/OrderDrawer";
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pedidos
        </h1>
        <p className="text-xs font-normal text-slate-400 dark:text-slate-500 mt-1">
          Todo lo que se mueve hoy, en un solo lugar
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Pedidos totales */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
            <IconShoppingBag size={20} />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {totalOrders}
            </span>
            <p className="text-xs font-normal text-slate-400 dark:text-slate-500 mt-1.5">
              Pedidos totales
            </p>
          </div>
        </div>

        {/* Card 2: En ruta ahora */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <IconClock size={20} />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              EN VIVO
            </span>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {inTransitOrders}
            </span>
            <p className="text-xs font-normal text-slate-400 dark:text-slate-500 mt-1.5">
              En ruta ahora
            </p>
          </div>
        </div>

        {/* Card 3: Observados */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-3">
            <IconAlertTriangle size={20} />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {observedOrders}
            </span>
            <p className="text-xs font-normal text-slate-400 dark:text-slate-500 mt-1.5">
              Observados
            </p>
          </div>
        </div>

        {/* Card 4: Entregados hoy */}
        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
            <IconCheck size={20} />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
              {deliveredOrders}
            </span>
            <p className="text-xs font-normal text-slate-400 dark:text-slate-500 mt-1.5">
              Entregados hoy
            </p>
          </div>
        </div>
      </div>

      {/* Main Table with integrated action bar */}
      <OrderTable 
        onEdit={handleEdit} 
        onCreate={handleCreate} 
        onImportExcel={() => fileInputRef.current?.click()} 
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
