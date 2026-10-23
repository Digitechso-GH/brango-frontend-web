export interface LatLngPoint {
  lat: number;
  lng: number;
}

export function decodePolyline(encoded: string): LatLngPoint[] {
  const points: LatLngPoint[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Caché en memoria para evitar peticiones duplicadas
const routeCache = new Map<string, LatLngPoint[]>();

function getCacheKey(points: LatLngPoint[]): string {
  return points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join(";");
}

/**
 * Consulta a Google Routes API (v2) para calcular la ruta navegable por calles
 * Soporta origen, destino y paradas intermedias (multi-stop) en una sola llamada optimizada.
 */
export async function computeStreetRoute(points: LatLngPoint[]): Promise<LatLngPoint[]> {
  if (!points || points.length < 2) return points || [];

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return points;
  }

  const cacheKey = getCacheKey(points);
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const origin = points[0];
  const destination = points[points.length - 1];
  const intermediates = points.slice(1, -1);

  const body: any = {
    origin: {
      location: {
        latLng: {
          latitude: origin.lat,
          longitude: origin.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
      },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
  };

  if (intermediates.length > 0) {
    body.intermediates = intermediates.map((p) => ({
      location: {
        latLng: {
          latitude: p.lat,
          longitude: p.lng,
        },
      },
    }));
  }

  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.routes && data.routes.length > 0 && data.routes[0].polyline?.encodedPolyline) {
      const decoded = decodePolyline(data.routes[0].polyline.encodedPolyline);
      if (routeCache.size > 50) {
        const first = routeCache.keys().next().value;
        if (first) routeCache.delete(first);
      }
      routeCache.set(cacheKey, decoded);
      return decoded;
    }
  } catch (error) {
    console.error("Error consultando Google Routes API:", error);
  }

  // Fallback si falla la llamada: devuelve los puntos originales (líneas rectas)
  return points;
}
