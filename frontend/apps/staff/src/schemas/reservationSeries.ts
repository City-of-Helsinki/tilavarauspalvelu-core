import { z } from "zod";
import { getIntervalMinutes } from "ui/src/modules/conversion";
import { parseUIDate } from "ui/src/modules/date-utils";
import {
  checkReservationInterval,
  checkStartEndTime,
  checkDateNotInPast,
  checkTimeStringFormat,
  ReservationTypeSchema,
  ReservationFormMetaSchema,
} from "ui/src/schemas";
import type { ReservationStartInterval } from "@gql/gql-types";
import { Weekday } from "@gql/gql-types";

// NOTE schema refinement is quirky since zod objects can't be merged after it
// always use the exact refined scheme for validation and displaying errors to the user
// the merged schemes are for type inference.

// NOTE zod doesn't run refinements if part of the required data is missing
// i.e. the core zod schema is run first if it passes then refinements are run
// solutions to that are either use partial schemas or split schemas and check the parts.

const TimeSelectionSchemaBase = z.object({
  startingDate: z.string(),
  endingDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  repeatOnDays: z.array(z.enum(Weekday)).min(1).max(7),
  repeatPattern: z.literal("weekly").or(z.literal("biweekly")),
});

export type TimeSelectionFormValues = z.infer<typeof TimeSelectionSchemaBase>;

const ReservationSeriesFormSchema = z
  .object({
    type: ReservationTypeSchema,
    seriesName: z.string().max(255),
    comments: z.string().max(500),
    enableBufferTimeBefore: z.boolean(),
    enableBufferTimeAfter: z.boolean(),
  })
  .extend(TimeSelectionSchemaBase.shape);

const convertToDate = (date?: string): Date | null => (date ? parseUIDate(date) : null);

const dateIsBefore = (date: Date | null, other: Date | null) => date && other && date.getTime() < other.getTime();

export function getReservationSeriesSchema(interval: ReservationStartInterval) {
  return (
    ReservationSeriesFormSchema.extend(ReservationFormMetaSchema.shape)
      .superRefine((val, ctx) => checkDateNotInPast(convertToDate(val.startingDate), ctx, "startingDate"))
      .superRefine((val, ctx) => checkDateNotInPast(convertToDate(val.endingDate), ctx, "endingDate"))
      .refine((s) => dateIsBefore(convertToDate(s.startingDate), convertToDate(s.endingDate)), {
        path: ["endingDate"],
        message: "Start date can't be after end date.",
      })
      .superRefine((val, ctx) => checkTimeStringFormat(val.startTime, ctx, "startTime"))
      .superRefine((val, ctx) => checkTimeStringFormat(val.endTime, ctx, "endTime"))
      .superRefine((val, ctx) =>
        checkReservationInterval(val.startTime, ctx, "startTime", getIntervalMinutes(interval))
      )
      .superRefine((val, ctx) => checkReservationInterval(val.endTime, ctx, "endTime", 15))
      .superRefine((val, ctx) => checkStartEndTime(val, ctx))
      // custom email validator because the base schema doesn't work for Series and Django validates email strings
      .superRefine((val, ctx) => {
        const emailValidator = z.union([z.email(), z.string().length(0)]).optional();
        const res = emailValidator.safeParse(val.reserveeEmail);
        if (!res.success) {
          ctx.addIssue({
            code: "custom",
            validation: "email",
            path: ["reserveeEmail"],
          });
        }
      })
  );
}

export type ReservationSeriesFormValues = z.infer<ReturnType<typeof getReservationSeriesSchema>>;

const RescheduleReservationSeriesFormSchema = z
  .object({
    enableBufferTimeBefore: z.boolean(),
    enableBufferTimeAfter: z.boolean(),
    type: ReservationTypeSchema,
  })
  .extend(TimeSelectionSchemaBase.shape);

export type RescheduleReservationSeriesForm = z.infer<typeof RescheduleReservationSeriesFormSchema>;

export function getRescheduleReservationSeriesSchema(interval: ReservationStartInterval) {
  return (
    RescheduleReservationSeriesFormSchema
      /* Don't validate start time since it's not editable */
      .superRefine((val, ctx) => checkDateNotInPast(convertToDate(val.endingDate), ctx, "endingDate"))
      .refine((s) => dateIsBefore(convertToDate(s.startingDate), convertToDate(s.endingDate)), {
        path: ["endingDate"],
        message: "Start date can't be after end date.",
      })
      .superRefine((val, ctx) => checkTimeStringFormat(val.startTime, ctx, "startTime"))
      .superRefine((val, ctx) => checkTimeStringFormat(val.endTime, ctx, "endTime"))
      .superRefine((val, ctx) =>
        checkReservationInterval(val.startTime, ctx, "startTime", getIntervalMinutes(interval))
      )
      .superRefine((val, ctx) => checkReservationInterval(val.endTime, ctx, "endTime", 15))
      .superRefine((val, ctx) => checkStartEndTime(val, ctx))
  );
}
