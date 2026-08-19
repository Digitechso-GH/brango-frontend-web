"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BaseDrawer } from "@/shared/components/ui/BaseDrawer";
import { Input } from "@/shared/components/ui/Input";
import { Button } from "@/shared/components/ui/Button";
import { Select } from "@/shared/components/ui/Select";
import { FORM_CONTROL_BASE } from "@/shared/components/ui/form-control";
import { orderSchema, OrderFormData } from "../validaciones/pedidos.schema";
import { useSavePedidoMutation } from "../hooks/usePedidosMutations";
import { useSedesQuery, useDriversQuery } from "../hooks/usePedidosQueries";
import { 
  IconHash, 
  IconFileText, 
  IconPhone, 
  IconBuildingWarehouse, 
  IconMapPin 
} from "@tabler/icons-react";
import { useGoogleMapsLoader } from "@/shared/integrations/google/useGoogleMapsLoader";

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order?: any;
}

export const OrderDrawer = ({ isOpen, onClose, order }: OrderDrawerProps) => {
  const queryClient = useQueryClient();
  const [addressMode, setAddressMode] = useState<"search" | "url">("search");
  const [predictions, setPredictions] = useState<any[]>([]);
  const autocompleteServiceRef = useRef<any>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const { isLoaded } = useGoogleMapsLoader();

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
    defaultValues: {
      code: "",
      waybill: "",
      recipientDocumentType: "",
      recipientDocument: "",
      recipientName: "",
      recipientPhone: "",
      warehouseContact: "",
      originBranchId: "",
      rawAddress: "",
      formattedAddress: "",
      latitude: "",
      longitude: "",
      driverId: "",
    },
  });

  // Google Autocomplete Service (V1) deprecation: Eliminado el ref y el useEffect de inicialización.
  // Ahora usaremos AutocompleteSuggestion de la nueva API directamente en handleAddressChange.

  const handleAddressChange = (val: string) => {
    setValue("rawAddress", val, { shouldValidate: true });

    // 1. Extraer coordenadas si es una URL con patrón @lat,lng
    const coordsMatch = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch && coordsMatch[1] && coordsMatch[2]) {
      setValue("latitude", coordsMatch[1]);
      setValue("longitude", coordsMatch[2]);
      setPredictions([]);

      // Obtener dirección urbana legible por Geocodificación Inversa
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const latNum = parseFloat(coordsMatch[1]);
        const lngNum = parseFloat(coordsMatch[2]);
        geocoder.geocode({ location: { lat: latNum, lng: lngNum } }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            setValue("formattedAddress", results[0].formatted_address);
          }
        });
      }
      return;
    }

    // 2. Si es una URL corta sin coordenadas explícitas en texto, usar Geocoder
    if (val.includes("http") || val.includes("goo.gl") || val.includes("maps")) {
      setPredictions([]);
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: val }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const loc = results[0].geometry.location;
            setValue("latitude", loc.lat().toString());
            setValue("longitude", loc.lng().toString());
            setValue("formattedAddress", results[0].formatted_address);
          }
        });
      }
      return;
    }

    // 3. Búsqueda de dirección estándar por autocompletado de Google Places
    if (addressMode === "search" && val && val.length >= 3) {
      if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.places && window.google.maps.places.AutocompleteSuggestion) {
        window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: val,
          includedRegionCodes: ["pe"],
        })
          .then(({ suggestions }: any) => {
            setPredictions(suggestions || []);
          })
          .catch((err: any) => {
            console.error("Error fetching places:", err);
            setPredictions([]);
          });
      }
    } else {
      setPredictions([]);
    }
  };

  const handleSelectPrediction = (prediction: any) => {
    const selectedAddress = prediction.placePrediction?.text?.text || prediction.description;
    setValue("rawAddress", selectedAddress, { shouldValidate: true });
    setValue("formattedAddress", selectedAddress);
    setPredictions([]);

    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: selectedAddress }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          setValue("latitude", loc.lat().toString());
          setValue("longitude", loc.lng().toString());
        }
      });
    }
  };

  // Cargar sedes de origen dinámicamente
  const { data: sedes = [] } = useSedesQuery(isOpen);

  // Cargar choferes para asignación opcional
  const { data: drivers = [] } = useDriversQuery(isOpen);

  const selectedTipoDoc = watch("recipientDocumentType");
  const selectedDriverId = watch("driverId");

  useEffect(() => {
    if (isOpen) {
      if (order) {
        const isCompany = order.recipientCustomerType === "COMPANY";
        const rawDoc = order.recipientDocument || "";
        const isNumericDoc = /^\d+$/.test(rawDoc);
        const doc = isNumericDoc && (rawDoc.length === 11 || rawDoc.length === 8) ? rawDoc : "";
        const docType = doc.length === 11 ? "RUC" : doc.length === 8 ? "DNI" : "";
        const name = isCompany ? (order.customer?.name ?? "") : (order.recipientName ?? "");
        const phone = order.recipientPhone || "";

        const isUrl = order.rawAddress && order.rawAddress.startsWith("http");
        setAddressMode(isUrl ? "url" : "search");

        reset({
          code: order.code || "",
          waybill: order.waybill || "",
          recipientDocumentType: docType,
          recipientDocument: doc,
          recipientName: name,
          recipientPhone: phone,
          warehouseContact: order.warehouseContact || "",
          originBranchId: order.originBranchId || "",
          rawAddress: order.rawAddress || "",
          formattedAddress: order.formattedAddress || "",
          latitude: order.latitude !== undefined && order.latitude !== null ? String(order.latitude) : "",
          longitude: order.longitude !== undefined && order.longitude !== null ? String(order.longitude) : "",
          driverId: order.driverId || "",
        });
      } else {
        setAddressMode("search");
        reset({
          code: "",
          waybill: "",
          recipientDocumentType: "",
          recipientDocument: "",
          recipientName: "",
          recipientPhone: "",
          warehouseContact: "",
          originBranchId: "",
          rawAddress: "",
          formattedAddress: "",
          latitude: "",
          longitude: "",
          driverId: "",
        });
      }
    }
  }, [order, isOpen, reset]);

  // Mutación para guardar
  const saveMutation = useSavePedidoMutation(order?.id, onClose, setError);

  const onSubmit = (formData: OrderFormData) => {
    const doc = (formData.recipientDocument || "").trim();
    const name = (formData.recipientName || "").trim();
    const isRuc = formData.recipientDocumentType === "RUC" || doc.length === 11;

    const payload: OrderFormData = {
      ...formData,
      recipientCustomerType: isRuc ? "COMPANY" : "INDIVIDUAL",
      recipientDocument: doc,
      recipientName: name,
    };

    saveMutation.mutate(payload);
  };

  const driverOptions = [
    { label: "Sin asignar (Opcional)", value: "" },
    ...drivers.map((d: any) => ({
      label: `${d.name || "Sin nombre"} — ${d.unit || "Sin placa"}`,
      value: d.id,
    })),
  ];

  return (
    <BaseDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={order ? "Editar Pedido" : "Nuevo Pedido"}
      subtitle={
        order
          ? "Modifica los datos del pedido registrado"
          : "Completa la información para registrar un nuevo pedido"
      }
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={saveMutation.isPending}>
            {order ? "Guardar Cambios" : "Crear Pedido"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        {/* SECCIÓN 1: IDENTIFICACIÓN DEL PEDIDO */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            INFORMACIÓN DEL PEDIDO
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nº pedido *"
              placeholder="Ej. 22208"
              icon={<IconHash size={16} />}
              error={errors.code?.message?.toString()}
              {...register("code")}
            />
            <Input
              label="Guía de remisión *"
              placeholder="Ej. 004521"
              icon={<IconFileText size={16} />}
              error={errors.waybill?.message?.toString()}
              {...register("waybill")}
            />
          </div>
        </div>

        <hr className="border-t border-gray-100 dark:border-[#2D2D3D] my-1" />

        {/* SECCIÓN 2: DOCUMENTO */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            DOCUMENTO
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-0.5">
                Tipo (Opcional)
              </label>
              <Select
                value={selectedTipoDoc || ""}
                onChange={(val) => setValue("recipientDocumentType", val, { shouldValidate: true })}
                options={[
                  { label: "Sin Documento", value: "" },
                  { label: "RUC (11 dígitos)", value: "RUC" },
                  { label: "DNI (8 dígitos)", value: "DNI" },
                ]}
              />
            </div>
            <Input
              label="Número (Opcional)"
              placeholder={selectedTipoDoc === "RUC" ? "20601245789" : selectedTipoDoc === "DNI" ? "45871299" : "Ej. 20601245789"}
              error={errors.recipientDocument?.message?.toString()}
              maxLength={selectedTipoDoc === "RUC" ? 11 : selectedTipoDoc === "DNI" ? 8 : 15}
              {...register("recipientDocument")}
            />
          </div>
        </div>

        <hr className="border-t border-gray-100 dark:border-[#2D2D3D] my-1" />

        {/* SECCIÓN 3: CLIENTE */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            CLIENTE
          </div>
          <Input
            label="Nombre o razón social *"
            placeholder="Logística Arequipa S.A.C. o Juan Pérez"
            error={errors.recipientName?.message?.toString()}
            {...register("recipientName")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contacto cliente *"
              placeholder="987 654 321"
              icon={<IconPhone size={16} />}
              error={errors.recipientPhone?.message?.toString()}
              {...register("recipientPhone")}
            />
            <Input
              label="Contacto almacén *"
              placeholder="962 854 129"
              icon={<IconBuildingWarehouse size={16} />}
              error={errors.warehouseContact?.message?.toString()}
              {...register("warehouseContact")}
            />
          </div>
        </div>

        <hr className="border-t border-gray-100 dark:border-[#2D2D3D] my-1" />

        {/* SECCIÓN 4: ENTREGA */}
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            ENTREGA
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-0.5">
                Dirección de entrega *
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextMode = addressMode === "search" ? "url" : "search";
                  setAddressMode(nextMode);
                  setPredictions([]);
                  setValue("rawAddress", "", { shouldValidate: true });
                  setValue("latitude", "");
                  setValue("longitude", "");
                }}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline transition-colors"
              >
                {addressMode === "search" ? "Pegar URL de Maps" : "Buscar Dirección"}
              </button>
            </div>
            <div className="relative w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none flex items-center justify-center">
                <IconMapPin size={16} />
              </div>
              <input
                ref={addressInputRef}
                type="text"
                placeholder={
                  addressMode === "url"
                    ? "https://maps.app.goo.gl/..."
                    : "Av. Argentina 4500, Callao"
                }
                value={watch("rawAddress") || ""}
                onChange={(e) => handleAddressChange(e.target.value)}
                className={`${FORM_CONTROL_BASE} pl-10 pr-3.5 text-sm`}
              />

              {predictions.length > 0 && addressMode === "search" && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#1D1D2B] border border-gray-200 dark:border-[#2D2D3D] rounded-xl shadow-xl z-[9999] max-h-56 overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1">
                  {predictions.map((item, idx) => (
                    <div
                      key={item.placePrediction?.placeId || item.place_id || idx}
                      onClick={() => handleSelectPrediction(item)}
                      className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer transition-colors border-b border-gray-50 dark:border-white/5 last:border-none"
                    >
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {item.placePrediction?.text?.text || item.structured_formatting?.main_text || item.description}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {item.placePrediction?.text?.text ? "Perú" : (item.structured_formatting?.secondary_text || item.description)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {watch("latitude") && watch("longitude") && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 ml-0.5">
                ✓ Ubicación confirmada (Lat: {Number(watch("latitude")).toFixed(4)}, Lng: {Number(watch("longitude")).toFixed(4)})
              </p>
            )}
            {errors.rawAddress?.message && (
              <p className="text-[10px] font-bold text-red-500 mt-0.5 ml-0.5">{errors.rawAddress.message?.toString()}</p>
            )}
          </div>

          {/* Asignar Chofer (Opcional) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-0.5">
              Asignar chofer <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <Select
              value={selectedDriverId || ""}
              onChange={(val) => setValue("driverId", val)}
              options={driverOptions}
            />
          </div>
        </div>
      </div>
    </BaseDrawer>
  );
};
