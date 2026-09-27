import * as z from "zod";

export const orderSchema = z.object({
  code: z.string().min(1, "El número de pedido es obligatorio"),
  waybill: z.string().optional(),
  originBranchId: z.string().optional(),
  recipientCustomerType: z.enum(["COMPANY", "INDIVIDUAL"]).optional(),
  recipientDocumentType: z.string().optional(),

  recipientDocument: z.string().optional(),
  recipientName: z.string().min(2, "El nombre o razón social es obligatorio"),

  recipientPhone: z.string().min(7, "El contacto del cliente es obligatorio (mín. 7 dígitos)"),
  recipientEmail: z.string().optional(),
  warehouseContact: z.string().min(7, "El contacto comercial es obligatorio (mín. 7 dígitos)"),

  // Ubicación / Maps
  rawAddress: z.string().min(5, "La dirección de entrega o enlace de Maps es obligatorio"),
  formattedAddress: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  driverId: z.string().optional(),
  dueDate: z.string().optional(),
}).superRefine((data, ctx) => {
  const doc = (data.recipientDocument || "").trim();
  if (doc.length > 0) {
    if (data.recipientDocumentType === "RUC") {
      if (doc.length !== 11 || !/^\d+$/.test(doc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientDocument"],
          message: "El RUC debe tener exactamente 11 dígitos numéricos",
        });
      }
    } else if (data.recipientDocumentType === "DNI") {
      if (doc.length !== 8 || !/^\d+$/.test(doc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientDocument"],
          message: "El DNI debe tener exactamente 8 dígitos numéricos",
        });
      }
    }
  }
  
  if (data.warehouseContact && data.recipientPhone) {
    const commercial = data.warehouseContact.replace(/\D/g, "");
    const client = data.recipientPhone.replace(/\D/g, "");
    if (commercial === client) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["warehouseContact"],
        message: "El contacto comercial no puede ser igual al contacto del cliente",
      });
    }
  }
});

export type OrderFormData = z.infer<typeof orderSchema>;
