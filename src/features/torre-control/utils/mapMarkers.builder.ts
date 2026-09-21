/**
 * Map Markers Builder and Utilities for Torre de Control MapView
 */

export const cleanMatrizText = (text?: string | null): string => {
  if (!text) return "";
  return text.replace(/\s*-\s*Matriz/gi, "").replace(/\s*Matriz/gi, "").trim();
};

export const getClientName = (ord: any): string => {
  if (!ord) return "";
  const rawName = ord.recipientCustomerType === "INDIVIDUAL" ? ord.recipientName : (ord.customer?.name || ord.recipientName);
  return cleanMatrizText(rawName || "");
};

export const GOOGLE_STYLE_TOOLTIP_HTML = (clientName: string, orderCode: string): string => {
  const cleanCode = String(orderCode || "").replace(/^#/, "");
  return `
    <div class="custom-map-tooltip">
      <div class="custom-map-tooltip-bubble">
        <div style="font-size: 13px; font-weight: 700; color: #202124; line-height: 1.3; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${clientName}
        </div>
        <div style="font-size: 11px; font-weight: 500; color: #5f6368; line-height: 1.2;">
          Pedido: <span style="font-weight: 600; color: #1a73e8;">#${cleanCode}</span>
        </div>
      </div>
      <div class="custom-map-tooltip-arrow"></div>
    </div>
  `;
};

export const TRUCK_MARKER_HTML = (color: string, driverName?: string, statusText?: string): string => `
  <div class="marker-wrapper">
    ${driverName ? `
      <div class="custom-map-tooltip">
        <div class="custom-map-tooltip-bubble">
          <div style="font-size: 13px; font-weight: 700; color: #202124; line-height: 1.3; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${driverName}
          </div>
          <div style="font-size: 11px; font-weight: 500; color: #5f6368; line-height: 1.2;">
            ${statusText || "En ruta"}
          </div>
        </div>
        <div class="custom-map-tooltip-arrow"></div>
      </div>
    ` : ""}
    <div style="background: ${color}; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.35); cursor: pointer; transition: transform 0.15s ease;">
      <span style="font-size: 22px; line-height: 1;">🚚</span>
    </div>
  </div>
`;

export const DESTINATION_MARKER_HTML = (color: string, label?: string, clientName?: string, orderCode?: string): string => `
  <div class="marker-wrapper">
    ${clientName && orderCode ? GOOGLE_STYLE_TOOLTIP_HTML(clientName, orderCode) : ""}
    <div style="background: ${color}; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); cursor: pointer; transition: transform 0.15s ease;">
      <span style="font-size: 16px; font-weight: bold; color: white; line-height: 1;">${label || '📍'}</span>
    </div>
  </div>
`;

/**
 * Marcador de Pedido Disponible para Despacho (Route Builder).
 * NOTA DE ARQUITECTURA: Usa ORDER_VALIDITY_COLORS (SLA de vencimiento: verde/amarillo/rojo)
 * y un icono de reloj interno en lugar de ORDER_STATUS_COLORS.
 * Esto permite al operador logístico priorizar visualmente los pedidos urgentes en el mapa
 * antes de agruparlos en una ruta.
 */
export const VALIDITY_ORDER_MARKER_HTML = (color: string, clientName: string, orderCode: string): string => `
  <div class="marker-wrapper">
    ${GOOGLE_STYLE_TOOLTIP_HTML(clientName, orderCode)}
    <div style="
      background: ${color};
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: transform 0.15s ease;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <polyline points="12 7 12 12 15 15"/>
      </svg>
    </div>
  </div>
`;

export function bindTooltipHover(container: HTMLElement): void {
  const tooltip = container.querySelector(".custom-map-tooltip") as HTMLElement;
  if (!tooltip) return;

  const show = () => {
    tooltip.style.opacity = "1";
    tooltip.style.visibility = "visible";
    tooltip.style.transform = "translateX(-50%) translateY(0px)";
  };

  const hide = () => {
    tooltip.style.opacity = "0";
    tooltip.style.visibility = "hidden";
    tooltip.style.transform = "translateX(-50%) translateY(4px)";
  };

  container.onmouseenter = show;
  container.onmouseleave = hide;
  container.onpointerenter = show;
  container.onpointerleave = hide;

  const wrapper = container.querySelector(".marker-wrapper") as HTMLElement;
  if (wrapper) {
    wrapper.onmouseenter = show;
    wrapper.onmouseleave = hide;
    wrapper.onpointerenter = show;
    wrapper.onpointerleave = hide;
  }
}

export function getJitteredPosition(
  lat: number,
  lng: number,
  indexInGroup: number,
  totalInGroup: number,
  zoom: number = 12
): { lat: number; lng: number } {
  if (totalInGroup <= 1) return { lat, lng };

  // Offset visual sutil (~14px desde el centro) para mantener los pedidos agrupados junto al local
  const safeZoom = Math.min(Math.max(zoom, 10), 20);
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const metersPerPixel = (156543.03392 * cosLat) / Math.pow(2, safeZoom);
  
  // Distancia proporcional al zoom visual, sin forzar mínimos artificiales de 30 metros
  const offsetMeters = 14 * metersPerPixel;
  const dLat = offsetMeters / 111320;
  const dLng = offsetMeters / (111320 * (cosLat || 1));

  const angle = ((2 * Math.PI) / totalInGroup) * indexInGroup;
  return {
    lat: lat + dLat * Math.sin(angle),
    lng: lng + dLng * Math.cos(angle),
  };
}

export function createAdvancedMarker(options: {
  position: { lat: number; lng: number };
  map: google.maps.Map;
  title?: string;
  htmlContent: string;
  zIndex?: number;
}): google.maps.marker.AdvancedMarkerElement {
  const container = document.createElement("div");
  container.style.width = "38px";
  container.style.height = "38px";
  container.style.position = "relative";
  container.innerHTML = options.htmlContent.trim();
  bindTooltipHover(container);

  return new google.maps.marker.AdvancedMarkerElement({
    position: options.position,
    map: options.map,
    title: "", // Do NOT use browser native tooltip
    content: container,
    zIndex: options.zIndex ?? 10,
  });
}

export function createValidityMarker(options: {
  position: { lat: number; lng: number };
  map: google.maps.Map;
  validityColor: string;
  clientName: string;
  orderCode: string;
  zIndex?: number;
}): google.maps.marker.AdvancedMarkerElement {
  const container = document.createElement("div");
  container.style.width = "38px";
  container.style.height = "38px";
  container.style.position = "relative";
  container.innerHTML = VALIDITY_ORDER_MARKER_HTML(options.validityColor, options.clientName, options.orderCode).trim();
  bindTooltipHover(container);

  return new google.maps.marker.AdvancedMarkerElement({
    position: options.position,
    map: options.map,
    title: "", // Do NOT use browser native tooltip
    content: container,
    zIndex: options.zIndex ?? 10,
  });
}

/**
 * Explicit marker cleanup helper to release Google Maps JS API references and prevent memory leaks.
 */
export function cleanupMarkers(
  markers:
    | Map<string, google.maps.marker.AdvancedMarkerElement>
    | Array<google.maps.marker.AdvancedMarkerElement | any>
): void {
  if (markers instanceof Map) {
    markers.forEach((marker) => {
      if (marker) {
        marker.map = null;
      }
    });
    markers.clear();
  } else if (Array.isArray(markers)) {
    markers.forEach((marker) => {
      if (marker) {
        if ("map" in marker) marker.map = null;
        else if (marker.setMap) marker.setMap(null);
      }
    });
  }
}
