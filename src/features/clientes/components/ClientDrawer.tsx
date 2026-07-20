import React from "react";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client?: any;
}

export const ClientDrawer = ({ isOpen, onClose, client }: ClientDrawerProps) => {
  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={client ? "Editar Cliente" : "Nuevo Cliente"}
      subtitle={client ? "Modifica los datos del cliente comercial." : "Registra un cliente comercial en la plataforma."}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary">
            {client ? "Guardar Cambios" : "Guardar Cliente"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 mt-2">
        <Input 
          label="Razón Social / Nombre" 
          placeholder="Ej. Empresa ABC S.A.C." 
          defaultValue={client?.name || ""}
        />
        <Input 
          label="RUC" 
          placeholder="Ej. 20123456789" 
          defaultValue={client?.ruc || ""}
        />
        <Input 
          label="Dirección Principal" 
          placeholder="Ej. Av. Principal 123" 
          defaultValue={client?.address || "Av. Principal 123"} // mock para rellenar
        />
        <Input 
          label="Contacto Principal" 
          placeholder="Ej. 999 999 999" 
          defaultValue={client?.phone || ""}
        />
      </div>
    </BaseDrawer>
  );
};
