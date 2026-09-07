import { ORDER_STATUS_COLORS, VEHICLE_MARKER_COLOR } from "@/shared/constants/status-colors";

/**
 * Constructores de elementos HTML DOM para marcadores de Google Maps.
 */

export const createTruckMarkerElement = (label?: string): HTMLElement => {
  const container = document.createElement("div");
  container.innerHTML = `
    <div style="background: ${VEHICLE_MARKER_COLOR}; width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(61,95,255,0.5); cursor: pointer; transition: transform 0.2s ease;">
      <span style="font-size: 24px; line-height: 1;">🚚</span>
    </div>
  `;
  return container;
};

export const createDestinationMarkerElement = (color: string = ORDER_STATUS_COLORS.PENDING): HTMLElement => {
  const container = document.createElement("div");
  container.innerHTML = `
    <div style="background: ${color}; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); cursor: pointer;">
      <span style="font-size: 18px; line-height: 1;">📍</span>
    </div>
  `;
  return container;
};

export const createSedeMarkerElement = (): HTMLElement => {
  const container = document.createElement("div");
  container.innerHTML = `
    <div style="background: #1E293B; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #64748B; box-shadow: 0 4px 10px rgba(0,0,0,0.4); cursor: pointer;">
      <span style="font-size: 20px; line-height: 1;">🏢</span>
    </div>
  `;
  return container;
};
