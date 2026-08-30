import { useRef, useEffect } from "react";
import { loadGoogleMapsLibrary } from "@/shared/integrations/google/google-maps.loader";

export const useMapRoute = (map: google.maps.Map | null) => {
  const activePolylinesRef = useRef<any[]>([]);

  const clearRoute = () => {
    activePolylinesRef.current.forEach((polyline) => {
      if (polyline.setMap) polyline.setMap(null);
      else if ("map" in polyline) polyline.map = null;
    });
    activePolylinesRef.current = [];
  };

  const drawMultiStopRoute = async (points: Array<{ lat: number; lng: number }>) => {
    if (!map || !points || points.length < 2) return;

    clearRoute();

    const bounds = new google.maps.LatLngBounds();
    points.forEach((pt) => bounds.extend(pt));

    try {
      const directionsService = new google.maps.DirectionsService();

      for (let i = 0; i < points.length - 1; i++) {
        const origin = points[i];
        const destination = points[i + 1];

        try {
          const result = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
            directionsService.route(
              {
                origin: new google.maps.LatLng(origin.lat, origin.lng),
                destination: new google.maps.LatLng(destination.lat, destination.lng),
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (res, status) => {
                if (status === google.maps.DirectionsStatus.OK && res) {
                  resolve(res);
                } else {
                  resolve(null);
                }
              }
            );
          });

          if (result && result.routes && result.routes[0]) {
            const path = result.routes[0].overview_path;
            path.forEach((pt) => bounds.extend(pt));

            const polyline = new google.maps.Polyline({
              path,
              geodesic: true,
              strokeColor: i === 0 ? "#3D5FFF" : "#6066FF",
              strokeOpacity: 0.85,
              strokeWeight: 5,
              map: map,
            });
            activePolylinesRef.current.push(polyline);
          } else {
            // Línea directa en caso de fallback
            const polyline = new google.maps.Polyline({
              path: [origin, destination],
              geodesic: true,
              strokeColor: i === 0 ? "#3D5FFF" : "#6066FF",
              strokeOpacity: 0.85,
              strokeWeight: 4,
              map: map,
            });
            activePolylinesRef.current.push(polyline);
          }
        } catch (err) {
          console.error("Error al calcular tramo de ruta:", err);
          const polyline = new google.maps.Polyline({
            path: [origin, destination],
            geodesic: true,
            strokeColor: "#3D5FFF",
            strokeOpacity: 0.85,
            strokeWeight: 4,
            map: map,
          });
          activePolylinesRef.current.push(polyline);
        }
      }
    } catch (err) {
      console.error("Error al trazar la ruta serpiente multiparada:", err);
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
