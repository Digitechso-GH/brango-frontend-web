import React from "react";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order?: any;
}

export const OrderDrawer = ({ isOpen, onClose, order }: OrderDrawerProps) => {
  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={order ? "Editar Pedido" : "Nuevo Pedido"}
      subtitle={order ? "Modifica los datos del pedido en el sistema." : "Crea un pedido manualmente en el sistema."}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary">
            {order ? "Guardar Cambios" : "Guardar Pedido"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 mt-2">
        <Input 
          label="Cliente" 
          placeholder="Ej. Tiendas Tambo" 
          defaultValue={order?.client || ""} 
        />
        <Input 
          label="Dirección de Entrega" 
          placeholder="Ej. Av. Arequipa 123" 
          defaultValue={order?.address || ""} 
        />
        <Input 
          label="Guía de Remisión (Opcional)" 
          placeholder="Ej. 004521" 
          defaultValue={order?.guia || ""} 
        />
        <Input 
          label="Notas Adicionales" 
          placeholder="Ej. Entregar por la puerta trasera" 
          defaultValue={order?.notes || ""} 
        />
      </div>
    </BaseDrawer>
  );
};
