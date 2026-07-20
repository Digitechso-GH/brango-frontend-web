"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/api/axios";
import { toast } from "sonner";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { Button } from "@/shared/components/ui/Button";
import { handleBackendErrors } from "@/shared/utils/handleBackendErrors";

const orderSchema = z.object({
  codigo: z.string().min(3, "El número de pedido debe tener al menos 3 caracteres"),
  guia: z.string().optional(),
  documentoDestinatario: z.string().min(8, "El DNI/Documento debe tener al menos 8 dígitos"),
  direccionOriginal: z.string().min(5, "La dirección de entrega debe tener al menos 5 caracteres"),
  clienteId: z.string().uuid("Debes seleccionar un cliente válido"),
  driverId: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order?: any;
}

export const OrderDrawer = ({ isOpen, onClose, order }: OrderDrawerProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  });

  // 1. Cargar clientes (sucursales de entrega)
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await api.get("/customers/clients");
      return res.data.data || [];
    },
    enabled: isOpen,
  });

  // 2. Cargar choferes para asignación opcional
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await api.get("/drivers");
      return res.data.data || [];
    },
    enabled: isOpen,
  });

  const selectedClienteId = watch("clienteId");
  const selectedDriverId = watch("driverId");

  useEffect(() => {
    if (isOpen) {
      if (order) {
        reset({
          codigo: order.codigo || "",
          guia: order.guia || "",
          documentoDestinatario: order.documentoDestinatario || "",
          direccionOriginal: order.direccionOriginal || "",
          clienteId: order.clienteId || "",
          driverId: order.driverId || "",
        });
      } else {
        reset({
          codigo: "PED-" + Math.floor(1000 + Math.random() * 9000),
          guia: "",
          documentoDestinatario: "",
          direccionOriginal: "",
          clienteId: "",
          driverId: "",
        });
      }
    }
  }, [order, isOpen, reset]);

  // Mutación para guardar (Crear / Editar)
  const saveMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const payload = { ...data };
      if (!payload.driverId) {
        delete payload.driverId;
      }
      if (!payload.guia) {
        delete payload.guia;
      }

      if (order) {
        return api.put(`/orders/${order.id}`, payload);
      } else {
        return api.post("/orders", payload);
      }
    },
    onSuccess: (res: any) => {
      const savedOrder = res?.data?.data;
      toast.success(order ? "Pedido actualizado correctamente" : "Pedido registrado correctamente");
      
      // Actualizar caché de TanStack Query directamente
      if (savedOrder) {
        queryClient.setQueryData(["orders"], (oldData: any[] | undefined) => {
          const list = oldData || [];
          if (order) {
            return list.map((o) => (o.id === savedOrder.id ? savedOrder : o));
          } else {
            return [...list, savedOrder];
          }
        });
      }
      onClose();
    },
    onError: (err: any) => {
      const msg = handleBackendErrors(err, setError, "Error al guardar el pedido");
      toast.error(msg);
    },
  });

  const onSubmit = (data: OrderFormData) => {
    saveMutation.mutate(data);
  };

  const clientOptions = [
    { label: "Selecciona un cliente...", value: "" },
    ...clients.map((c: any) => ({
      label: `${c.nombre} (${c.empresa?.nombre || "Empresa"})`,
      value: c.id,
    })),
  ];

  const driverOptions = [
    { label: "Sin asignar (Pendiente)", value: "" },
    ...drivers.map((d: any) => ({
      label: `${d.usuario?.nombre || "Chofer"} — ${d.unidad || "Sin placa"}`,
      value: d.id,
    })),
  ];

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={order ? "Editar Pedido" : "Nuevo Pedido"}
      subtitle={order ? "Modifica los datos del pedido en el sistema." : "Crea un pedido manualmente en el sistema."}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Guardando..." : order ? "Guardar Cambios" : "Guardar Pedido"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 mt-2">
        <Input
          label="Nº Pedido (Código)"
          placeholder="Ej. PED-1001"
          error={errors.codigo?.message}
          {...register("codigo")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Cliente / Punto de Entrega
          </label>
          <Select
            value={selectedClienteId || ""}
            onChange={(val) => setValue("clienteId", val, { shouldValidate: true })}
            options={clientOptions}
          />
          {errors.clienteId?.message && (
            <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.clienteId.message}</p>
          )}
        </div>

        <Input
          label="Dirección de Entrega"
          placeholder="Ej. Av. La Marina 1450, San Miguel"
          error={errors.direccionOriginal?.message}
          {...register("direccionOriginal")}
        />

        <Input
          label="DNI / RUC del Destinatario"
          placeholder="Ej. 70451299"
          error={errors.documentoDestinatario?.message}
          {...register("documentoDestinatario")}
        />

        <Input
          label="Guía de Remisión (Opcional)"
          placeholder="Ej. 004521"
          error={errors.guia?.message}
          {...register("guia")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Asignar Chofer (Opcional)
          </label>
          <Select
            value={selectedDriverId || ""}
            onChange={(val) => setValue("driverId", val)}
            options={driverOptions}
          />
        </div>
      </div>
    </BaseDrawer>
  );
};
