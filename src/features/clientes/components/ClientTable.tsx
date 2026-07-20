import React from "react";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { IconPencil } from "@tabler/icons-react";

interface ClientTableProps {
  onEdit: (client: any) => void;
}

export const ClientTable = ({ onEdit }: ClientTableProps) => {
  const columns = [
    { header: "Razón Social", accessorKey: "name" },
    { header: "RUC", accessorKey: "ruc" },
    { header: "Contacto", accessorKey: "phone" },
    { header: "Pedidos Totales", accessorKey: "orders" },
    { header: "Estado", accessorKey: "status", cell: (info: any) => {
      const val = info.getValue();
      return <Badge variant={val === "Activo" ? "success" : "danger"}>{val}</Badge>;
    } },
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

  const mockData = [
    { id: 1, name: "Supermercados Wong S.A.", ruc: "20100000001", phone: "911 222 333", orders: 145, status: "Activo" },
    { id: 2, name: "Tiendas Tambo S.A.C.", ruc: "20200000002", phone: "944 555 666", orders: 89, status: "Activo" },
    { id: 3, name: "Oxxo Express", ruc: "20300000003", phone: "977 888 999", orders: 34, status: "Inactivo" },
  ];

  return (
    <div className="flex-1 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm overflow-hidden flex flex-col">
      <CleanTable columns={columns} data={mockData} isLoading={false} />
    </div>
  );
};
