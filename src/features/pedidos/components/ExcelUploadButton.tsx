import React, { useRef } from "react";
import { IconUpload, IconFileExcel } from "@tabler/icons-react";
import { Button } from "@/shared/components/ui/Button";

export const ExcelUploadButton = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
      <div className="p-3 bg-white dark:bg-[#1A1A24] rounded-xl shadow-sm text-green-600">
        <IconFileExcel size={24} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Importar pedidos masivos</h3>
        <p className="text-xs font-medium text-gray-500">Solo se permiten archivos formato .xlsx</p>
      </div>
      <input 
        type="file" 
        accept=".xlsx" 
        className="hidden" 
        ref={fileInputRef} 
      />
      <Button onClick={() => fileInputRef.current?.click()} className="whitespace-nowrap">
        <IconUpload size={18} />
        Seleccionar Archivo
      </Button>
    </div>
  );
};
