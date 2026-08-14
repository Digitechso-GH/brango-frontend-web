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
    const errorMsg = Array.isArray(payload.message) ? payload.message.join(", ") : payload.message;
    setError(fieldName, {
      type: "server",
      message: errorMsg,
    });
    return errorMsg;
  }

  if (payload && (payload as any).message) {
    const msg = (payload as any).message;
    const errorMsg = Array.isArray(msg) ? msg.join(", ") : String(msg);

    // Inferencia inteligente de campos basados en el mensaje de error general
    const lowerMsg = errorMsg.toLowerCase();
    let guessedField: Path<TFieldValues> | null = null;

    if (lowerMsg.includes("pedido") || lowerMsg.includes("código") || lowerMsg.includes("codigo") || lowerMsg.includes("code")) {
      guessedField = "code" as Path<TFieldValues>;
    } else if (lowerMsg.includes("ruc")) {
      guessedField = "ruc" as Path<TFieldValues>;
    } else if (lowerMsg.includes("email") || lowerMsg.includes("correo") || lowerMsg.includes("usuario")) {
      guessedField = "email" as Path<TFieldValues>;
    } else if (lowerMsg.includes("teléfono") || lowerMsg.includes("telefono") || lowerMsg.includes("phone")) {
      guessedField = "phone" as Path<TFieldValues>;
    } else if (lowerMsg.includes("contraseña") || lowerMsg.includes("password")) {
      guessedField = "password" as Path<TFieldValues>;
    } else if (lowerMsg.includes("unidad") || lowerMsg.includes("placa") || lowerMsg.includes("vehículo") || lowerMsg.includes("unit")) {
      guessedField = "unit" as Path<TFieldValues>;
    } else if (lowerMsg.includes("razón social") || lowerMsg.includes("nombre") || lowerMsg.includes("name")) {
      guessedField = "name" as Path<TFieldValues>;
    }

    if (guessedField) {
      setError(guessedField, {
        type: "server",
        message: errorMsg,
      });
    }

    return errorMsg;
  }

  return error?.message || defaultMessage;
}
