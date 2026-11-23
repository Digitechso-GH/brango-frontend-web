"use client";

import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { driversApi } from "../api/drivers.api";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { LICENSE_CATEGORY_LABELS } from "../constants/drivers.constants";
import { IconBan, IconCheck, IconPencil, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

interface DriverTableProps {
  onEdit: (driver: any) => void;
}

export const DriverTable = ({ onEdit }: DriverTableProps) => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.getDrivers,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      driversApi.updateDriver(id, { active }),
    onSuccess: (_, vars) => {
      toast.success(vars.active ? "Chofer activado" : "Chofer desactivado");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Error al actualizar estado del chofer");
    },
  });

  const filteredDrivers = useMemo(() => {
    if (!search.trim()) return drivers;
    const lowerSearch = search.toLowerCase();
    return drivers.filter((d: any) => {
      const name = (d.user?.name || d.usuario?.nombre || "").toLowerCase();
      const email = (d.user?.email || d.usuario?.email || "").toLowerCase();
      const phone = (d.phone || d.telefono || "").toLowerCase();
      const license = (d.licenseNumber || "").toLowerCase();
      const category = (LICENSE_CATEGORY_LABELS[d.licenseCategory] || d.licenseCategory || "").toLowerCase();
      return (
        name.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        phone.includes(lowerSearch) ||
        license.includes(lowerSearch) ||
        category.includes(lowerSearch)
      );
    });
  }, [drivers, search]);

  const columns = [
    {
      header: "Chofer",
      accessorFn: (row: any) => row.user?.name || row.usuario?.nombre,
      cell: (info: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-white">
            {info.getValue() || "Sin nombre"}
          </span>
          <span className="text-xs text-slate-500">
            {info.row.original.user?.email || info.row.original.usuario?.email || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Teléfono",
      accessorFn: (row: any) => row.phone || row.telefono || "-",
    },
    {
      header: "Brevete",
      accessorFn: (row: any) => row.licenseNumber || "-",
      cell: (info: any) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {info.getValue()}
        </span>
      ),
    },
    {
      header: "Categoría",
      accessorKey: "licenseCategory",
      cell: (info: any) => {
        const val = info.getValue();
        const label = LICENSE_CATEGORY_LABELS[val] || val || "-";
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {label}
          </span>
        );
      },
    },
    {
      header: "Estado",
      accessorFn: (row: any) =>
        row.active !== undefined ? row.active : (row.activo ?? true),
      cell: (info: any) => {
        const active = info.getValue();
        return (
          <Badge variant={active ? "success" : "default"}>
            {active ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }: any) => {
        const driver = row.original;
        const isActive = driver.active !== undefined ? driver.active : (driver.activo ?? true);

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onEdit(driver)}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Editar Chofer"
            >
              <IconPencil size={18} />
            </button>
            <button
              onClick={() => toggleActiveMutation.mutate({ id: driver.id, active: !isActive })}
              disabled={toggleActiveMutation.isPending}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  : "text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
              title={isActive ? "Desactivar chofer" : "Activar chofer"}
            >
              {isActive ? <IconBan size={18} /> : <IconCheck size={18} />}
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
            placeholder="Buscar por nombre, correo, brevete..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1E1E2D] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {filteredDrivers.length} {filteredDrivers.length === 1 ? "chofer" : "choferes"}
        </span>
      </div>

      <CleanTable columns={columns} data={filteredDrivers} isLoading={isLoading} />
    </div>
  );
};
