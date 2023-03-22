import { z } from "zod";
import { subDays } from "date-fns";

const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

// TODO handle metadata (variable form fields) instead of using .passthrough
// It should be it's own schema object that is included in both forms
// and it should be constructed based on the backend data.

// NOTE schema refinement is quirky since zod objects can't be merged after it
// always use the exact refined scheme for validation and displaying errors to the user
// the merged schemes are for type inferance.

// NOTE be careful if using zod refined schemes in react-hook-form resolvers
// it doesn't handle complex cases that depend on multiple values
// often needs a custom isDirty + getError with the full zod error map.

const Option = z.object({
  label: z.string(),
  value: z.string(),
});

const timeSelectionSchemaBase = z.object({
  startingDate: z.coerce.date(),
  endingDate: z.coerce.date(),
  startingTime: z.string(),
  endingTime: z.string(),
  repeatOnDays: z.array(z.number()).min(1).max(7),
  repeatPattern: z.object({
    label: z.string(),
    value: z.literal("weekly").or(z.literal("biweekly")),
  }),
});

export const RecurringReservationFormSchema = z
  .object({
    reservationUnit: Option,
    type: z.string(),
    seriesName: z.string().optional(),
    comments: z.string().max(500).optional(),
    bufferTimeBefore: z.boolean().optional(),
    bufferTimeAfter: z.boolean().optional(),
  })
  .merge(timeSelectionSchemaBase)
  // need passthrough otherwise zod will strip the metafields
  .passthrough()
  // this refine works in this case since it's the last required value (unlike datetimes)
  .refine(
    (s) =>
      s.type === "BLOCKED" ||
      (s.seriesName !== undefined && s.seriesName.length > 0),
    {
      path: ["seriesName"],
      message: "Required",
    }
  );

const TIME_PATTERN = /^[0-9+]{2}:[0-9+]{2}$/;

export const timeSelectionSchema = timeSelectionSchemaBase
  .refine((s) => s.startingDate > subDays(new Date(), 1), {
    path: ["startingDate"],
    message: "Start date can't be in the past",
  })
  .refine((s) => s.startingDate < s.endingDate, {
    path: ["endingDate"],
    message: "Start date can't be after end date.",
  })
  // Need to have a year limit otherwise a single backspace can crash the application (due to computing).
  // 1.1.2023 -> press backspace => 1.1.203 calculates the interval of 1820 years.
  // Similarly mis typing 20234 as a year results in 18200 year interval.
  .refine(
    (s) =>
      Math.abs(s.endingDate.getTime() - s.startingDate.getTime()) <
      TEN_YEARS_MS,
    {
      path: ["endingDate"],
      message: "Start and end time needs to be within a decade.",
    }
  )
  .refine((s) => s.startingTime.match(TIME_PATTERN), {
    path: ["startingTime"],
    message: "Start time is not in time format.",
  })
  .refine((s) => s.endingTime.match(TIME_PATTERN), {
    path: ["endingTime"],
    message: "End time is not in time format.",
  })
  .refine((s) => Number(s.startingTime.replace(":", ".")) < 24, {
    path: ["startingTime"],
    message: "Start time can't be more than 24 hours.",
  })
  .refine((s) => Number(s.endingTime.replace(":", ".")) < 24, {
    path: ["endingTime"],
    message: "End time can't be more than 24 hours.",
  })
  .refine(
    (s) =>
      Number(s.startingTime.replace(":", ".")) <
      Number(s.endingTime.replace(":", ".")),
    {
      path: ["endingTime"],
      message: "End time needs to be after start time.",
    }
  );

export type RecurringReservationForm = z.infer<
  typeof RecurringReservationFormSchema
>;
