"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { choferesApi } from "../api/choferes.api";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { IconPencil } from "@tabler/icons-react";

interface DriverTableProps {
  onEdit: (driver: any) => void;
}

export const DriverTable = ({ onEdit }: DriverTableProps) => {
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: choferesApi.getDrivers,
  });

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
    <div className="flex-1 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm overflow-hidden flex flex-col">
      <CleanTable columns={columns} data={drivers} isLoading={isLoading} />
    </div>
  );
};
