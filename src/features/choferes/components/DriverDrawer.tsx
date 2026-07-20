import React, { useState, useEffect } from "react";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

interface DriverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: any;
}

export const DriverDrawer = ({ isOpen, onClose, driver }: DriverDrawerProps) => {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (driver) {
      // Si está en edición, simulamos que el input de contraseña empieza vacío o con placeholders
      setPassword("");
    }
  }, [driver, isOpen]);

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={driver ? "Editar Chofer" : "Nuevo Chofer"}
      subtitle={driver ? "Modifica los datos del chofer y su contraseña de acceso." : "Registra un nuevo chofer para acceso a la aplicación móvil."}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary">
            {driver ? "Guardar Cambios" : "Guardar Chofer"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 mt-2">
        <Input 
          label="Nombre Completo" 
          placeholder="Ej. Juan Pérez" 
          defaultValue={driver?.name || ""} 
        />
        <Input 
          label="DNI" 
          placeholder="Ej. 70000000" 
          defaultValue={driver?.dni || ""} 
        />
        <Input 
          label="Teléfono" 
          placeholder="Ej. 999 999 999" 
          defaultValue={driver?.phone || ""} 
        />
        <Input 
          label="Placa del Vehículo" 
          placeholder="Ej. ABC-123" 
          defaultValue={driver?.plate || ""} 
        />
        
        {driver ? (
          <div className="flex flex-col gap-2 mt-2">
            <Input 
              type="password"
              label="Contraseña" 
              placeholder="Escribe una nueva contraseña para cambiarla" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[10px] text-gray-500">
              * La contraseña actual se encuentra guardada de forma segura (hasheada). Escribe una nueva contraseña si deseas cambiarla.
            </p>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
            <p className="text-xs font-bold text-orange-800 dark:text-orange-300">Contraseña Temporal Generada:</p>
            <p className="text-lg font-black text-orange-900 dark:text-orange-200 tracking-widest mt-1">
              BRANGO-84X
            </p>
            <p className="text-[10px] font-medium text-orange-700 dark:text-orange-400 mt-2">
              El chofer deberá cambiar esta contraseña al iniciar sesión en la app.
            </p>
          </div>
        )}
      </div>
    </BaseDrawer>
  );
};
