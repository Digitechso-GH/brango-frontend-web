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

const driverSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("El correo electrónico no es válido"),
  telefono: z.string().min(7, "El teléfono debe tener al menos 7 dígitos"),
  unidad: z.string().min(4, "La placa/unidad debe tener al menos 4 caracteres"),
  password: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password.length > 0 && data.password.length < 6) {
    return false;
  }
  return true;
}, {
  message: "La contraseña debe tener al menos 6 caracteres",
  path: ["password"],
});

type DriverFormData = z.infer<typeof driverSchema>;

interface DriverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  driver?: any;
}

export const DriverDrawer = ({ isOpen, onClose, driver }: DriverDrawerProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (driver) {
        reset({
          nombre: driver.usuario?.nombre || "",
          email: driver.usuario?.email || "",
          telefono: driver.telefono || "",
          unidad: driver.unidad || "",
          password: "",
        });
      } else {
        reset({
          nombre: "",
          email: "",
          telefono: "",
          unidad: "",
          password: "BRANGO-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
        });
      }
    }
  }, [driver, isOpen, reset]);

  // Mutación para guardar (Crear / Editar)
  const saveMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      // Remover password si está vacío en edición
      const payload = { ...data };
      if (driver && !payload.password) {
        delete payload.password;
      }

      if (driver) {
        return api.put(`/drivers/${driver.id}`, payload);
      } else {
        return api.post("/drivers", payload);
      }
    },
    onSuccess: (res: any) => {
      const newDriver = res?.data?.data;
      toast.success(driver ? "Chofer actualizado correctamente" : "Chofer registrado correctamente");
      
      if (newDriver) {
        queryClient.setQueryData(["drivers"], (oldData: any[] | undefined) => {
          const list = oldData || [];
          if (driver) {
            return list.map((d) => (d.id === newDriver.id ? newDriver : d));
          } else {
            return [...list, newDriver];
          }
        });
      }
      onClose();
    },
    onError: (err: any) => {
      const msg = handleBackendErrors(err, setError, "Error al guardar los datos del chofer");
      toast.error(msg);
    },
  });

  const onSubmit = (data: DriverFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={driver ? "Editar Chofer" : "Nuevo Chofer"}
      subtitle={
        driver
          ? "Modifica los datos del chofer y su contraseña de acceso."
          : "Registra un nuevo chofer para acceso a la aplicación móvil."
      }
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Guardando..." : driver ? "Guardar Cambios" : "Guardar Chofer"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 mt-2">
        <Input
          label="Nombre Completo"
          placeholder="Ej. Juan Pérez"
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <Input
          label="Correo / Usuario"
          placeholder="Ej. chofer@brango.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Teléfono"
          placeholder="Ej. 999 999 999"
          error={errors.telefono?.message}
          {...register("telefono")}
        />
        <Input
          label="Placa del Vehículo / Unidad"
          placeholder="Ej. ABC-123"
          error={errors.unidad?.message}
          {...register("unidad")}
        />

        <div className="flex flex-col gap-2 mt-2">
          <Input
            type="password"
            label="Contraseña"
            placeholder={driver ? "Escribe una nueva contraseña para cambiarla" : "Contraseña de acceso inicial"}
            error={errors.password?.message}
            {...register("password")}
          />
          {driver ? (
            <p className="text-[10px] text-gray-500">
              * La contraseña actual se encuentra guardada de forma segura (hasheada). Déjala en blanco si no deseas cambiarla.
            </p>
          ) : (
            <p className="text-[10px] text-gray-500">
              * Contraseña temporal sugerida para el inicio de sesión del chofer en la app móvil.
            </p>
          )}
        </div>
      </div>
    </BaseDrawer>
  );
};
