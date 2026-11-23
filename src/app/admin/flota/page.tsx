"use client";

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { IconPlus, IconSteeringWheel, IconTruck } from "@tabler/icons-react";
import { DriverTable } from "@/features/drivers/components/DriverTable";
import { DriverDrawer } from "@/features/drivers/components/DriverDrawer";
import { VehicleTable } from "@/features/vehicles/components/VehicleTable";
import { VehicleDrawer } from "@/features/vehicles/components/VehicleDrawer";
import { VehicleRecord } from "@/features/vehicles/api/vehicles.api";

type FlotaTab = "drivers" | "vehicles";

export default function FlotaPage() {
  const [activeTab, setActiveTab] = useState<FlotaTab>("drivers");
  const [isDriverDrawerOpen, setIsDriverDrawerOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  const [isVehicleDrawerOpen, setIsVehicleDrawerOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);

  const handlePrimaryAction = () => {
    if (activeTab === "drivers") {
      setSelectedDriver(null);
      setIsDriverDrawerOpen(true);
    } else {
      setSelectedVehicle(null);
      setIsVehicleDrawerOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <IconTruck size={22} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Flota
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestión independiente de choferes y vehículos para la operación logística.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handlePrimaryAction} className="rounded-xl">
            <IconPlus size={18} />
            <span>{activeTab === "drivers" ? "Nuevo Chofer" : "Nuevo Vehículo"}</span>
          </Button>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab("drivers")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "drivers"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
        >
          <IconSteeringWheel size={17} />
          <span>Choferes</span>
        </button>
        <button
          onClick={() => setActiveTab("vehicles")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "vehicles"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
        >
          <IconTruck size={17} />
          <span>Vehículos</span>
        </button>
      </div>

      <div className="flex flex-col">
        {activeTab === "drivers" ? (
          <DriverTable
            onEdit={(driver) => {
              setSelectedDriver(driver);
              setIsDriverDrawerOpen(true);
            }}
          />
        ) : (
          <VehicleTable
            onEdit={(vehicle) => {
              setSelectedVehicle(vehicle);
              setIsVehicleDrawerOpen(true);
            }}
          />
        )}
      </div>

      <DriverDrawer
        isOpen={isDriverDrawerOpen}
        onClose={() => {
          setSelectedDriver(null);
          setIsDriverDrawerOpen(false);
        }}
        driver={selectedDriver}
      />

      <VehicleDrawer
        isOpen={isVehicleDrawerOpen}
        onClose={() => {
          setSelectedVehicle(null);
          setIsVehicleDrawerOpen(false);
        }}
        vehicle={selectedVehicle}
      />
    </div>
  );
}
