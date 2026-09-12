import { z } from "zod";

export const SuggestedOrderSchema = z.object({
  id: z.string(),
  code: z.string(),
  recipientName: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  validityStatus: z.enum(["FRESH", "WARNING", "CRITICAL"]),
  percentElapsed: z.number(),
  dueDate: z.string().nullable().optional(),
  stopGroupId: z.string().nullable().optional(),
});

export const SuggestedStopSchema = z.object({
  sequenceIndex: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  stopGroupId: z.string().nullable().optional(),
  orders: z.array(SuggestedOrderSchema),
  validityStatus: z.enum(["FRESH", "WARNING", "CRITICAL"]),
  highestUrgencyPercent: z.number(),
});

export const SuggestedRouteSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalStops: z.number(),
  totalOrders: z.number(),
  criticalCount: z.number(),
  warningCount: z.number(),
  freshCount: z.number(),
  estimatedDistanceKm: z.number(),
  stops: z.array(SuggestedStopSchema),
  orderIds: z.array(z.string()),
});

export const SuggestedRoutesResponseSchema = z.array(SuggestedRouteSchema);

export type SuggestedRoute = z.infer<typeof SuggestedRouteSchema>;
export type SuggestedStop = z.infer<typeof SuggestedStopSchema>;
export type SuggestedOrder = z.infer<typeof SuggestedOrderSchema>;
