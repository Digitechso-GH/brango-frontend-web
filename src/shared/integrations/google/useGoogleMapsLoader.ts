import { useState, useEffect } from "react";
import { loadGoogleMapsLibrary } from "./google-maps.loader";

interface UseGoogleMapsLoaderResult {
  isLoaded: boolean;
  loadError: Error | null;
}

export const useGoogleMapsLoader = (): UseGoogleMapsLoaderResult => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      loadGoogleMapsLibrary("maps"),
      loadGoogleMapsLibrary("marker"),
      loadGoogleMapsLibrary("routes"),
    ])
      .then(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error al inicializar el SDK de Google Maps:", err);
          setLoadError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { isLoaded, loadError };
};
