import { UseFormSetError, FieldValues, Path } from "react-hook-form";


// --- TYPES / INTERFACES ---

interface BackendErrorPayload {
  success: boolean;
  errorCode: string;
  message: string;
  details?: {
    field?: string;
  };
}


// --- HELPER FUNCTION ---

/**
 * Captura un error de backend y asigna dinámicamente el mensaje de error
 * al campo correspondiente del formulario usando react-hook-form.
 */
export function handleBackendErrors<TFieldValues extends FieldValues>(
  error: any,
  setError: UseFormSetError<TFieldValues>,
  defaultMessage: string = "Ocurrió un error al procesar la solicitud."
): string {
  const payload = error?.response?.data as BackendErrorPayload | undefined;

  if (payload && !payload.success && payload.details?.field) {
    const fieldName = payload.details.field as Path<TFieldValues>;
    setError(fieldName, {
      type: "server",
      message: payload.message,
    });
    return payload.message;
  }

  return payload?.message || error?.message || defaultMessage;
}
