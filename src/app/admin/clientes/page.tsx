"use client";

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { IconPlus } from "@tabler/icons-react";
import { ClientTable } from "@/features/clientes/components/ClientTable";
import { ClientDrawer } from "@/features/clientes/components/ClientDrawer";

export default function ClientesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setIsDrawerOpen(true);
  };

  const handleClose = () => {
    setSelectedClient(null);
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-end">
        <Button onClick={handleCreate}>
          <IconPlus size={18} />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <ClientTable onEdit={handleEdit} />
      </div>

      <ClientDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleClose} 
        client={selectedClient} 
      />
    </div>
  );
}
