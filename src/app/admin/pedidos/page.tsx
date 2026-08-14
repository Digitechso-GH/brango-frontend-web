"use client";

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { IconPlus, IconFileExport } from "@tabler/icons-react";
import { OrderTable } from "@/features/pedidos/components/OrderTable";
import { OrderDrawer } from "@/features/pedidos/components/OrderDrawer";
import { pedidosApi } from "@/features/pedidos/api/pedidos.api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { API_ENDPOINTS } from "@/shared/constants/api-endpoints";

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Subiendo y procesando archivo Excel...");
    
    pedidosApi.importOrdersExcel(file)
      .then((res) => {
        const count = res.totalImportados || (Array.isArray(res) ? res.length : 1);
        toast.success(`Importación exitosa: ${count} pedidos creados`, { id: toastId });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
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
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            className="hidden" 
            accept=".xlsx,.xls,.csv" 
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} >
            <IconFileExport size={18} />
            Cargar Excel
          </Button>
          <Button onClick={handleCreate}>
            <IconPlus size={18} />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <OrderTable onEdit={handleEdit} />
      </div>

      <OrderDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleClose} 
        order={selectedOrder} 
      />
    </div>
  );
}
