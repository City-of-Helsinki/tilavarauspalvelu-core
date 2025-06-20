import { z } from "zod";

export const PendingReservationFormSchema = z.object({
  duration: z.number().min(0),
  date: z.string(),
  time: z.string(),
  isControlsVisible: z.boolean(),
});

export type PendingReservationFormType = z.infer<typeof PendingReservationFormSchema>;
