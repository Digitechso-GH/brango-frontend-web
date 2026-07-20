import React from "react";
import { CleanTable } from "@/shared/components/ui/CleanTable";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";

export const ImportPreviewTable = () => {
  const columns = [
    { header: "Fila", accessor: "row", width: "80px" },
    { header: "Cliente", accessor: "client" },
    { header: "Dirección", accessor: "address" },
    { header: "Teléfono", accessor: "phone" },
    { header: "Estado", accessor: "status", render: (val: any) => (
      <Badge variant={val === "Válido" ? "success" : "danger"}>{val}</Badge>
    ) },
  ];

  const mockData = [
    { id: 1, row: 2, client: "Bodega Juanita", address: "Av. Las Flores 123", phone: "987654321", status: "Válido" },
    { id: 2, row: 3, client: "Librería Central", address: "", phone: "999888777", status: "Falta dirección" },
    { id: 3, row: 4, client: "Ferretería El Martillo", address: "Calle Los Pinos 45", phone: "", status: "Válido" },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Vista Previa de Datos
        </h3>
        <Button variant="primary" disabled>
          Procesar 2 pedidos válidos
        </Button>
      </div>
      
      <div className="flex-1 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2D3D] shadow-sm overflow-hidden flex flex-col">
        <CleanTable columns={columns} data={mockData} isLoading={false} />
      </div>
    </div>
  );
};
