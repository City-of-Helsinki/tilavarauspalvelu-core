import { z } from "zod";

export const PendingReservationFormSchema = z.object({
  duration: z.number().min(0).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
});

export type PendingReservationFormType = z.infer<
  typeof PendingReservationFormSchema
>;
