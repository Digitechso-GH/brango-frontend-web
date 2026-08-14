import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let isOptionsConfigured = false;

/**
 * Singleton encargado de inicializar y cargar las librerías del SDK de Google Maps.
 */
export const loadGoogleMapsLibrary = async <T = any>(
  libraryName: "maps" | "marker" | "routes" | "places" | "geometry"
): Promise<T> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está definida en las variables de entorno.");
  }

  if (!isOptionsConfigured) {
    setOptions({
      key: apiKey,
      v: "weekly",
    });
    isOptionsConfigured = true;
  }

  return (await importLibrary(libraryName)) as T;
};
