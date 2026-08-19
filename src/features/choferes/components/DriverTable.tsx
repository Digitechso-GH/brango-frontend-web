"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { choferesApi } from "../api/choferes.api";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { IconPencil, IconSearch } from "@tabler/icons-react";

interface DriverTableProps {
  onEdit: (driver: any) => void;
}

export const DriverTable = ({ onEdit }: DriverTableProps) => {
  const [search, setSearch] = useState("");

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: choferesApi.getDrivers,
  });

  const filteredDrivers = useMemo(() => {
    if (!search.trim()) return drivers;
    const lowerSearch = search.toLowerCase();
    return drivers.filter((d: any) => {
      const name = (d.user?.name || d.usuario?.nombre || "").toLowerCase();
      const email = (d.user?.email || d.usuario?.email || "").toLowerCase();
      const phone = (d.phone || d.telefono || "").toLowerCase();
      const unit = (d.unit || d.unidad || "").toLowerCase();
      return (
        name.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        phone.includes(lowerSearch) ||
        unit.includes(lowerSearch)
      );
    });
  }, [drivers, search]);

  const columns = [
    {
      header: "Nombre Completo",
      accessorFn: (row: any) => row.user?.name || row.usuario?.nombre || "-",
    },
    {
      header: "Email / Usuario",
      accessorFn: (row: any) => row.user?.email || row.usuario?.email || "-",
    },
    {
      header: "Teléfono",
      accessorFn: (row: any) => row.phone || row.telefono || "-",
    },
    {
      header: "Placa / Unidad",
      accessorFn: (row: any) => row.unit || row.unidad || "-",
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: () => {
        return <Badge variant="success">Activo</Badge>;
      },
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      meta: { align: "center" },
      cell: (info: any) => (
        <div className="flex items-center justify-center gap-2">
          <button
            title="Editar Chofer"
            className="text-gray-400 hover:text-blue-600 transition-colors p-1 cursor-pointer"
            onClick={() => onEdit(info.row.original)}
          >
            <IconPencil size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm overflow-hidden flex flex-col">
      {/* Header con Buscador */}
      <div className="p-4 border-b border-gray-100 dark:border-[#2D2D3D] flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o unidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#181824] border border-gray-200 dark:border-[#2D2D3D] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {filteredDrivers.length} choferes
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-y-auto">
        <CleanTable columns={columns} data={filteredDrivers} isLoading={isLoading} />
      </div>
    </div>
  );
};
