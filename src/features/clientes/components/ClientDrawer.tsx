"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/shared/api/axios";
import { toast } from "sonner";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { handleBackendErrors } from "@/shared/utils/handleBackendErrors";

const companySchema = z.object({
  nombre: z.string().min(3, "La razón social debe tener al menos 3 caracteres"),
  ruc: z.string().length(11, "El RUC debe tener exactamente 11 dígitos"),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client?: any; // Representa el objeto de la empresa a editar (si existe)
}

export const ClientDrawer = ({ isOpen, onClose, client }: ClientDrawerProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        nombre: client?.nombre || "",
        ruc: client?.ruc || "",
      });
    }
  }, [client, isOpen, reset]);

  // Mutación para guardar (Crear / Editar)
  const saveMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      if (client) {
        return api.put(`/customers/companies/${client.id}`, data);
      } else {
        return api.post("/customers/companies", data);
      }
    },
    onSuccess: () => {
      toast.success(client ? "Cliente actualizado correctamente" : "Cliente registrado correctamente");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      onClose();
    },
    onError: (err: any) => {
      handleBackendErrors(err, setError, "Error al guardar los datos del cliente");
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={client ? "Editar Cliente" : "Nuevo Cliente"}
      subtitle={
        client
          ? "Modifica los datos del cliente comercial / empresa."
          : "Registra un cliente comercial (Empresa) en la plataforma."
      }
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Guardando..." : client ? "Guardar Cambios" : "Guardar Cliente"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 mt-2">
        <Input
          label="Razón Social / Nombre"
          placeholder="Ej. Empresa Wong S.A."
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <Input
          label="RUC"
          placeholder="Ej. 20100000001"
          error={errors.ruc?.message}
          {...register("ruc")}
        />
      </div>
    </BaseDrawer>
  );
};
