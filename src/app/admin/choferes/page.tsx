"use client";

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { IconPlus, IconSteeringWheel } from "@tabler/icons-react";
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <IconSteeringWheel size={22} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Choferes
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestión de conductores, unidades y flota operativa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} className="rounded-xl">
            <IconPlus size={18} />
            <span>Nuevo Chofer</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col">
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
