"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/shared/api/axios";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { IconPencil } from "@tabler/icons-react";

interface ClientTableProps {
  onEdit: (client: any) => void;
}

export const ClientTable = ({ onEdit }: ClientTableProps) => {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await api.get("/customers/companies");
      return res.data.data || [];
    },
  });

  const columns = [
    { header: "Razón Social", accessorKey: "nombre" },
    { header: "RUC", accessorKey: "ruc" },
    { 
      header: "Sucursales registradas", 
      accessorFn: (row: any) => `${row.clientes?.length || 0} sucursal(es)` 
    },
    { 
      header: "Estado", 
      accessorKey: "status", 
      cell: () => {
        return <Badge variant="success">Activo</Badge>;
      } 
    },
    {
      header: "Acciones",
      accessorKey: "actions",
      meta: { align: "center" },
      cell: (info: any) => (
        <div className="flex items-center justify-center gap-2">
          <button
            title="Editar Cliente"
            className="text-gray-400 hover:text-blue-600 transition-colors p-1 cursor-pointer"
            onClick={() => onEdit(info.row.original)}
          >
            <IconPencil size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm overflow-hidden flex flex-col">
      <CleanTable columns={columns} data={companies} isLoading={isLoading} />
    </div>
  );
};
