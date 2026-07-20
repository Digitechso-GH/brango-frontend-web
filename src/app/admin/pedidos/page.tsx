"use client";

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { IconPlus, IconFileExport } from "@tabler/icons-react";
import { OrderTable } from "@/features/pedidos/components/OrderTable";
import { OrderDrawer } from "@/features/pedidos/components/OrderDrawer";
import api from "@/shared/api/axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const toastId = toast.loading("Subiendo y procesando archivo Excel...");
      
      api.post("/orders/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
        .then((res) => {
          const count = res.data.data?.length || 0;
          toast.success(`Importación exitosa: ${count} pedidos creados`, { id: toastId });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        })
        .catch((err) => {
          const resMessage = err.response?.data?.message;
          if (resMessage?.code === "ERR_VALIDATION_FAILED" && Array.isArray(resMessage.details)) {
            const firstErr = resMessage.details[0];
            toast.error(`Fila ${firstErr.row}: ${firstErr.error}`, { id: toastId });
          } else {
            const msg = resMessage || "Ocurrió un error al importar el archivo";
            toast.error(msg, { id: toastId });
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        });
    }
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
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
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
