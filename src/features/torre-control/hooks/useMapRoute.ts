import { useRef, useEffect } from "react";
import { VEHICLE_MARKER_COLOR } from "@/shared/constants/status-colors";
import { computeStreetRoute } from "@/shared/integrations/google/routes.service";

export const useMapRoute = (map: google.maps.Map | null) => {
  const activePolylinesRef = useRef<any[]>([]);
  const requestIdRef = useRef<number>(0);

  const clearRoute = () => {
    requestIdRef.current += 1;
    activePolylinesRef.current.forEach((polyline) => {
      if (polyline.setMap) polyline.setMap(null);
      else if ("map" in polyline) polyline.map = null;
    });
    activePolylinesRef.current = [];
  };

  const drawMultiStopRoute = async (points: Array<{ lat: number; lng: number }>) => {
    if (!map || !points || points.length < 2) {
      clearRoute();
      return;
    }

    clearRoute();
    const currentReqId = requestIdRef.current;

    try {
      // Dividir en bloques si supera los 25 puntos intermedios que soporta la API
      const CHUNK_SIZE = 25;
      const allPathCoordinates: Array<{ lat: number; lng: number }> = [];

      for (let i = 0; i < points.length - 1; i += CHUNK_SIZE) {
        const chunk = points.slice(i, i + CHUNK_SIZE + 1);
        if (chunk.length < 2) break;

        const streetPath = await computeStreetRoute(chunk);
        if (requestIdRef.current !== currentReqId) return;

        allPathCoordinates.push(...streetPath);
      }

      if (requestIdRef.current !== currentReqId) return;

      const polyline = new google.maps.Polyline({
        path: allPathCoordinates,
        geodesic: true,
        strokeColor: VEHICLE_MARKER_COLOR,
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map: map,
      });

      activePolylinesRef.current.push(polyline);
    } catch (err) {
      if (requestIdRef.current !== currentReqId) return;
      console.error("Error al trazar la ruta con Routes API:", err);

      // Fallback a línea directa
      const polyline = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: VEHICLE_MARKER_COLOR,
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map: map,
      });
      activePolylinesRef.current.push(polyline);
    }
  };

  const drawRoute = (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) => {
    drawMultiStopRoute([origin, destination]);
  };

  useEffect(() => {
    return () => {
      clearRoute();
    };
  }, []);

  return { drawRoute, drawMultiStopRoute, clearRoute };
};
