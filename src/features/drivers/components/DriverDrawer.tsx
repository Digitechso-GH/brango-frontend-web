"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { driversApi } from "../api/drivers.api";
import { toast } from "sonner";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { handleBackendErrors } from "@/shared/utils/handleBackendErrors";
import { LICENSE_CATEGORY_OPTIONS } from "../constants/drivers.constants";

const driverSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().trim().toLowerCase().email("El correo electrónico no es válido"),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos"),
  licenseNumber: z.string().trim().min(4, "El número de licencia es obligatorio"),
  licenseCategory: z.string().min(1, "Selecciona una categoría de licencia"),
  active: z.boolean().optional(),
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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      licenseCategory: "A_I",
      active: true,
      password: "",
    },
  });

  useEffect(() => {
    if (driver) {
      reset({
        name: driver.user?.name || driver.usuario?.nombre || "",
        email: driver.user?.email || driver.usuario?.email || "",
        phone: driver.phone || driver.telefono || "",
        licenseNumber: driver.licenseNumber || "",
        licenseCategory: driver.licenseCategory || "A_I",
        active: driver.active !== undefined ? driver.active : (driver.activo ?? true),
        password: "",
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        licenseNumber: "",
        licenseCategory: "A_I",
        active: true,
        password: "",
      });
    }
  }, [driver, reset]);

  const mutation = useMutation({
    mutationFn: (data: DriverFormData) => {
      const payload: any = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        active: data.active,
      };

      if (data.password && data.password.trim().length > 0) {
        payload.password = data.password.trim();
      }

      if (driver) {
        return driversApi.updateDriver(driver.id, payload);
      }
      return driversApi.createDriver(payload);
    },
    onSuccess: () => {
      toast.success(driver ? "Chofer actualizado con éxito" : "Chofer creado con éxito");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["available-drivers"] });
      onClose();
    },
    onError: (err: any) => {
      const handled = handleBackendErrors(err, setError);
      if (!handled) {
        toast.error(err.response?.data?.message || "Ocurrió un error inesperado al guardar el chofer.");
      }
    },
  });

  const onSubmit = (data: DriverFormData) => {
    mutation.mutate(data);
  };

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={driver ? "Editar Chofer" : "Nuevo Chofer"}
      subtitle={
        driver
          ? "Actualiza los datos personales, de acceso y brevete del chofer."
          : "Ingresa los datos para registrar un nuevo chofer en el sistema."
      }
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Guardando..." : driver ? "Guardar Cambios" : "Crear Chofer"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre Completo"
          placeholder="Ej. Juan Pérez"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="juan.perez@empresa.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Teléfono / Celular"
          placeholder="Ej. 987654321"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="N° de Licencia / Brevete"
            placeholder="Ej. Q12345678"
            error={errors.licenseNumber?.message}
            {...register("licenseNumber")}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Categoría de Licencia
            </label>
            <Select
              value={watch("licenseCategory") || "A-I"}
              onChange={(val) => setValue("licenseCategory", val, { shouldValidate: true })}
              options={LICENSE_CATEGORY_OPTIONS.map((opt) => ({
                label: opt.label,
                value: opt.value,
              }))}
              error={errors.licenseCategory?.message}
            />
          </div>
        </div>

        <Input
          label={driver ? "Nueva Contraseña (Opcional)" : "Contraseña de Acceso"}
          type="password"
          placeholder={driver ? "Dejar en blanco para conservar actual" : "Mínimo 6 caracteres"}
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="active-driver"
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            {...register("active")}
          />
          <label htmlFor="active-driver" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Chofer activo en el sistema
          </label>
        </div>
      </form>
    </BaseDrawer>
  );
};
