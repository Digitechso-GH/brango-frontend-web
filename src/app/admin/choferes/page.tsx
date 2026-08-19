"use client";

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { IconPlus } from "@tabler/icons-react";
import { DriverTable } from "@/features/choferes/components/DriverTable";
import { DriverDrawer } from "@/features/choferes/components/DriverDrawer";

export default function ChoferesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  const handleEdit = (driver: any) => {
    setSelectedDriver(driver);
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedDriver(null);
    setIsDrawerOpen(true);
  };

  const handleClose = () => {
    setSelectedDriver(null);
    setIsDrawerOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 min-h-0">
      <div className="flex items-center justify-end">
        <Button onClick={handleCreate}>
          <IconPlus size={18} />
          Nuevo Chofer
        </Button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <DriverTable onEdit={handleEdit} />
      </div>

      <DriverDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleClose} 
        driver={selectedDriver} 
      />
    </div>
  );
}
