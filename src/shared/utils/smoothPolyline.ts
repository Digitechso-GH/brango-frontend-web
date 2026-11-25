export interface LatLngPoint {
  lat: number;
  lng: number;
}

/**
 * Calcula la distancia aproximada en metros entre dos coordenadas (Haversine simplificado).
 */
function getDistanceMeters(p1: LatLngPoint, p2: LatLngPoint): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Interpola linealmente entre dos puntos por una fracción t (0 a 1).
 */
function interpolate(p1: LatLngPoint, p2: LatLngPoint, t: number): LatLngPoint {
  return {
    lat: p1.lat + (p2.lat - p1.lat) * t,
    lng: p1.lng + (p2.lng - p1.lng) * t,
  };
}

/**
 * Genera puntos en curva Bézier cuadrática entre un punto de inicio, un punto de control y un fin.
 */
function getQuadraticBezierPoints(
  p0: LatLngPoint,
  p1: LatLngPoint,
  p2: LatLngPoint,
  steps: number = 5
): LatLngPoint[] {
  const points: LatLngPoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1);
    const oneMinusT = 1 - t;
    const lat =
      oneMinusT * oneMinusT * p0.lat +
      2 * oneMinusT * t * p1.lat +
      t * t * p2.lat;
    const lng =
      oneMinusT * oneMinusT * p0.lng +
      2 * oneMinusT * t * p1.lng +
      t * t * p2.lng;
    points.push({ lat, lng });
  }
  return points;
}

/**
 * Suaviza las esquinas de una polilínea estilo Uber.
 * Detecta giros pronunciados e inserta un arco Bézier con un radio máximo de metros (por defecto 10m).
 */
export function smoothPolylineCorners(
  path: LatLngPoint[],
  maxCornerRadiusMeters: number = 10
): LatLngPoint[] {
  if (!path || path.length < 3) return path;

  const smoothed: LatLngPoint[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    const distPrev = getDistanceMeters(prev, curr);
    const distNext = getDistanceMeters(curr, next);

    // Si los segmentos son muy cortos (ej. giros ya discretizados de Google), no forzar curva
    if (distPrev < 3 || distNext < 3) {
      smoothed.push(curr);
      continue;
    }

    // Radio de curva adaptativo: como máximo el 40% del segmento más corto o el radio máximo
    const curveRadius = Math.min(
      maxCornerRadiusMeters,
      distPrev * 0.4,
      distNext * 0.4
    );

    const tPrev = 1 - curveRadius / distPrev;
    const tNext = curveRadius / distNext;

    const startCurve = interpolate(prev, curr, tPrev);
    const endCurve = interpolate(curr, next, tNext);

    // Punto previo al giro
    smoothed.push(startCurve);

    // Puntos intermedios del arco curvo (Bézier suave)
    const arcPoints = getQuadraticBezierPoints(startCurve, curr, endCurve, 4);
    smoothed.push(...arcPoints);

    // Punto posterior al giro
    smoothed.push(endCurve);
  }

  smoothed.push(path[path.length - 1]);
  return smoothed;
}
