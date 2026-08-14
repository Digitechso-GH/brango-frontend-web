export interface GeoCoordinates {
  lat: number;
  lng: number;
}

/**
 * Calcula la distancia Haversine entre dos puntos en coordenadas geográficas.
 * Devuelve un string formateado en metros (ej. "450 m") o kilómetros (ej. "3.2 km").
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
};

/**
 * Coordenadas por defecto (Centro de Lima Metropolitana - Plaza Mayor / Centro)
 */
export const DEFAULT_LIMA_CENTER: GeoCoordinates = {
  lat: -12.046374,
  lng: -77.042793,
};
