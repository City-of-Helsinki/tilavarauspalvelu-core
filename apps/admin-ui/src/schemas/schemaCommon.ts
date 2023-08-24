import { z } from "zod";

// Common select prop type
// normally a backend provided list that is transformed into
// { value, label } pair for input the value maps to a backend id (pk).
export const OptionSchema = z.object({
  value: z.number(),
  label: z.string(),
});
