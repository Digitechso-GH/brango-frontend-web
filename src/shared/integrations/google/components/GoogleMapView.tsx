"use client";

import React, { useEffect, useRef } from "react";
import { useGoogleMapsLoader } from "../useGoogleMapsLoader";
import { DEFAULT_LIMA_CENTER, GeoCoordinates } from "../geo-utils";

export interface GoogleMapViewProps {
  center?: GeoCoordinates;
  zoom?: number;
  styles?: google.maps.MapTypeStyle[];
  mapId?: string;
  className?: string;
  onMapLoad?: (map: google.maps.Map) => void;
  children?: React.ReactNode;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  center = DEFAULT_LIMA_CENTER,
  zoom = 12,
  mapId,
  className = "w-full h-full min-h-[400px]",
  onMapLoad,
  children,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const { isLoaded, loadError } = useGoogleMapsLoader();

  // Inicializar o re-crear mapa de Google cuando cambia mapId
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const resolvedMapId = mapId;

    if (!resolvedMapId) {
      throw new Error(
        "Falta la variable de entorno obligatoria de Google Maps (NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID_LIGHT o NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID)."
      );
    }

    const mapOptions: google.maps.MapOptions = {
      center,
      zoom,
      mapId: resolvedMapId,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false, // Oculta el control superior 'Mapa / Satélite'
    };

    // Limpiar contenedor del mapa antes de re-inicializar
    if (mapRef.current) {
      mapRef.current.innerHTML = "";
    }

    const map = new google.maps.Map(mapRef.current, mapOptions);

    googleMapRef.current = map;
    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [isLoaded, mapId]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-red-400 p-4 rounded-xl text-xs">
        Error al cargar Google Maps API. Verifica la clave API.
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />
      {isLoaded && children}
    </div>
  );
};
