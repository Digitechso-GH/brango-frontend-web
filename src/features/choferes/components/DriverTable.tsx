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
    <div className="flex flex-col gap-4">
      {/* Buscador de Choferes */}
      <div className="bg-white dark:bg-[#1A1A24] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o unidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#13131A] border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder-slate-400 shadow-xs"
          />
        </div>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
          {filteredDrivers.length} {filteredDrivers.length === 1 ? "chofer" : "choferes"}
        </span>
      </div>

      {/* Tabla de Choferes */}
      <CleanTable columns={columns} data={filteredDrivers} isLoading={isLoading} />
    </div>
  );
};
