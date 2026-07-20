import React from "react";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { IconPencil } from "@tabler/icons-react";

interface DriverTableProps {
  onEdit: (driver: any) => void;
}

export const DriverTable = ({ onEdit }: DriverTableProps) => {
  const columns = [
    { header: "Nombre Completo", accessorKey: "name" },
    { header: "DNI", accessorKey: "dni" },
    { header: "Teléfono", accessorKey: "phone" },
    { header: "Placa", accessorKey: "plate" },
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
            title="Editar Chofer"
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
    { id: 1, name: "Carlos Mendoza", dni: "72134567", phone: "987 654 321", plate: "ABC-123", status: "Activo" },
    { id: 2, name: "Luis Fernandez", dni: "71234568", phone: "999 888 777", plate: "XYZ-987", status: "Inactivo" },
    { id: 3, name: "Jorge Ruiz", dni: "73345679", phone: "912 345 678", plate: "QWE-456", status: "Activo" },
    { id: 4, name: "Juan Pérez", dni: "70000000", phone: "999 999 999", plate: "ABC-123", status: "Activo" },
    { id: 5, name: "Miguel Sánchez", dni: "72000002", phone: "977 777 777", plate: "GHI-789", status: "Inactivo" },
  ];

  return (
    <div className="flex-1 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm overflow-hidden flex flex-col">
      <CleanTable columns={columns} data={mockData} isLoading={false} />
    </div>
  );
};
