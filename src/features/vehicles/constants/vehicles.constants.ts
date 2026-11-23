export const VEHICLE_TYPE_OPTIONS = [
  { value: "AUTOMOVIL", label: "Automóvil" },
  { value: "CAMIONETA", label: "Camioneta" },
  { value: "PICKUP", label: "Pickup" },
  { value: "FURGON", label: "Furgón" },
  { value: "CAMION", label: "Camión" },
  { value: "TRACTO", label: "Tracto" },
  { value: "OTRO", label: "Otro" },
] as const;

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  AUTOMOVIL: "Automóvil",
  CAMIONETA: "Camioneta",
  PICKUP: "Pickup",
  FURGON: "Furgón",
  CAMION: "Camión",
  TRACTO: "Tracto",
  OTRO: "Otro",
};
