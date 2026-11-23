"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi, VehicleRecord } from "../api/vehicles.api";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { VEHICLE_TYPE_LABELS } from "../constants/vehicles.constants";
import { IconPencil, IconSearch } from "@tabler/icons-react";

interface VehicleTableProps {
  onEdit: (vehicle: VehicleRecord) => void;
}

export const VehicleTable = ({ onEdit }: VehicleTableProps) => {
  const [search, setSearch] = useState("");

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.getVehicles,
  });

  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter((v) => {
      const typeLabel = (VEHICLE_TYPE_LABELS[v.vehicleType] || v.vehicleType || "").toLowerCase();
      return (
        (v.plate || "").toLowerCase().includes(q) ||
        (v.brand || "").toLowerCase().includes(q) ||
        (v.model || "").toLowerCase().includes(q) ||
        typeLabel.includes(q)
      );
    });
  }, [vehicles, search]);

  const columns = [
    {
      header: "Placa",
      accessorFn: (row: VehicleRecord) => row.plate,
    },
    {
      header: "Marca / Modelo",
      accessorFn: (row: VehicleRecord) =>
        [row.brand, row.model].filter(Boolean).join(" ") || "-",
    },
    {
      header: "Tipo",
      accessorKey: "vehicleType",
      cell: (info: any) => {
        const val = info.getValue();
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {VEHICLE_TYPE_LABELS[val] || val || "-"}
          </span>
        );
      },
    },
    {
      header: "Ejes",
      accessorKey: "axles",
      cell: (info: any) => `${info.getValue() ?? "-"} ejes`,
    },
    {
      header: "Capacidad (kg)",
      accessorKey: "capacityKg",
      cell: (info: any) => `${info.getValue()?.toLocaleString() ?? "-"} kg`,
    },
    {
      header: "Volumen (m³)",
      accessorKey: "capacityM3",
      cell: (info: any) => `${info.getValue()?.toLocaleString() ?? "-"} m³`,
    },
    {
      header: "Estado",
      accessorKey: "active",
      cell: (info: any) => (
        <Badge variant={info.getValue() ? "success" : "default"}>
          {info.getValue() ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }: any) => {
        const vehicle = row.original;
        return (
          <div className="flex items-center justify-end">
            <button
              onClick={() => onEdit(vehicle)}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Editar Vehículo"
            >
              <IconPencil size={18} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por placa, marca o modelo..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1E1E2D] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {filteredVehicles.length} {filteredVehicles.length === 1 ? "vehículo" : "vehículos"}
        </span>
      </div>

      <CleanTable columns={columns} data={filteredVehicles} isLoading={isLoading} />
    </div>
  );
};
