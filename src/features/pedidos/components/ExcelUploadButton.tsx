"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { IconUpload, IconFileExcel, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/shared/components/ui/Button";
import { pedidosApi } from "../api/pedidos.api";

export const ExcelUploadButton = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const data = await pedidosApi.importOrdersExcel(file);

      // Refrescar las consultas de la tabla de pedidos y la Torre de Control
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["torre-control"] });

      const total = data?.importedCount || data?.data?.length || 1;
      toast.success(`¡Éxito! Se importaron ${total} pedidos desde el archivo Excel.`);
    } catch (err: any) {
      console.error("Error al subir archivo Excel:", err);
      const errMsg = err.response?.data?.message || err.message || "Error al procesar el archivo Excel.";
      toast.error(typeof errMsg === "string" ? errMsg : "Fallo la importación del Excel por coincidencias o datos inválidos.", { duration: 6000 });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
        accept=".xlsx, .xls" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
      <Button 
        onClick={() => fileInputRef.current?.click()} 
        disabled={isUploading}
        className="whitespace-nowrap"
      >
        {isUploading ? (
          <>
            <IconLoader2 size={18} className="animate-spin" />
            Importando...
          </>
        ) : (
          <>
            <IconUpload size={18} />
            Seleccionar Archivo
          </>
        )}
      </Button>
    </div>
  );
};
