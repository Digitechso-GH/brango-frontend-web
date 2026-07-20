"use client";

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { IconPlus, IconFileExport } from "@tabler/icons-react";
import { OrderTable } from "@/features/pedidos/components/OrderTable";
import { OrderDrawer } from "@/features/pedidos/components/OrderDrawer";

export default function PedidosPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Archivo seleccionado:", file.name);
      // Aquí irá la lógica de subida de archivo
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
