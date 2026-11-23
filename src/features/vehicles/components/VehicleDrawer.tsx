"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi, VehicleRecord } from "../api/vehicles.api";
import { VEHICLE_TYPE_OPTIONS } from "../constants/vehicles.constants";
import { toast } from "sonner";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { handleBackendErrors } from "@/shared/utils/handleBackendErrors";

const vehicleSchema = z.object({
  plate: z.string().trim().min(4, "La placa debe tener al menos 4 caracteres"),
  brand: z.string().trim().min(1, "La marca es obligatoria"),
  model: z.string().trim().min(1, "El modelo es obligatorio"),
  axles: z.coerce.number().int("Debe ser entero").min(1, "Mínimo 1 eje"),
  capacityKg: z.coerce.number().min(0, "No puede ser negativa"),
  capacityM3: z.coerce.number().min(0, "No puede ser negativo"),
  vehicleType: z.string().min(1, "Selecciona un tipo de vehículo"),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: VehicleRecord | null;
}

export const VehicleDrawer = ({ isOpen, onClose, vehicle }: VehicleDrawerProps) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as any,
  });

  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        reset({
          plate: vehicle.plate || "",
          brand: vehicle.brand || "",
          model: vehicle.model || "",
          axles: vehicle.axles ?? 2,
          capacityKg: vehicle.capacityKg ?? 0,
          capacityM3: vehicle.capacityM3 ?? 0,
          vehicleType: vehicle.vehicleType || "CAMION",
        });
      } else {
        reset({
          plate: "",
          brand: "",
          model: "",
          axles: 2,
          capacityKg: 0,
          capacityM3: 0,
          vehicleType: "CAMION",
        });
      }
    }
  }, [vehicle, isOpen, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const payload = {
        ...data,
        plate: data.plate.toUpperCase(),
      };
      if (vehicle) {
        return vehiclesApi.updateVehicle(vehicle.id, payload);
      }
      return vehiclesApi.createVehicle(payload);
    },
    onSuccess: () => {
      toast.success(vehicle ? "Vehículo actualizado correctamente" : "Vehículo registrado correctamente");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["available-vehicles"] });
      onClose();
    },
    onError: (err: any) => {
      const msg = handleBackendErrors(err, setError, "Error al guardar los datos del vehículo");
      toast.error(msg);
    },
  });

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? "Editar Vehículo" : "Registrar Nuevo Vehículo"}
      subtitle="Administra los datos de capacidad y características de la unidad."
      size="md"
    >
      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="flex flex-col h-full">
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Placa *"
              placeholder="Ej. ABC-123"
              error={errors.plate?.message}
              {...register("plate")}
            />
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo de vehículo *
              </label>
              <Select
                value={watch("vehicleType") || ""}
                onChange={(val) => setValue("vehicleType", val, { shouldValidate: true })}
                options={VEHICLE_TYPE_OPTIONS.map((opt) => ({
                  label: opt.label,
                  value: opt.value,
                }))}
                error={errors.vehicleType?.message}
                placeholder="Seleccionar tipo de vehículo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Marca *"
              placeholder="Ej. Isuzu, Hino, Volvo"
              error={errors.brand?.message}
              {...register("brand")}
            />
            <Input
              label="Modelo *"
              placeholder="Ej. NPR, 500, FH"
              error={errors.model?.message}
              {...register("model")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Número de ejes *"
              type="number"
              min={1}
              error={errors.axles?.message}
              {...register("axles")}
            />
            <Input
              label="Capacidad (kg) *"
              type="number"
              step="any"
              min={0}
              error={errors.capacityKg?.message}
              {...register("capacityKg")}
            />
            <Input
              label="Volumen (m³) *"
              type="number"
              step="any"
              min={0}
              error={errors.capacityM3?.message}
              {...register("capacityM3")}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {vehicle ? "Guardar Cambios" : "Registrar Vehículo"}
          </Button>
        </div>
      </form>
    </BaseDrawer>
  );
};
