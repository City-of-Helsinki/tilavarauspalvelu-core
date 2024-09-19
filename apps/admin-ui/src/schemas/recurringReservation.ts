import { z } from "zod";
import {
  ReservationStartInterval,
  ReservationTypeChoice,
} from "@gql/gql-types";
import { fromUIDate } from "common/src/common/util";
import {
  ReservationTypeSchema,
  checkReservationInterval,
  checkStartEndTime,
} from "./reservation";
import {
  checkDateNotInPast,
  checkTimeStringFormat,
} from "common/src/schemas/schemaCommon";
import { intervalToNumber } from "./utils";

// TODO handle metadata (variable form fields) instead of using .passthrough
// It should be it's own schema object that is included in both forms
// and it should be constructed based on the backend data.

// NOTE schema refinement is quirky since zod objects can't be merged after it
// always use the exact refined scheme for validation and displaying errors to the user
// the merged schemes are for type inferance.

// NOTE zod doesn't run refinements if part of the required data is missing
// i.e. the core zod schema is run first if it passes then refinements are run
// solutions to that are either use partial schemas or split schemas and check the parts.

const timeSelectionSchemaBase = z.object({
  startingDate: z.string(),
  endingDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  repeatOnDays: z.array(z.number()).min(1).max(7),
  repeatPattern: z.literal("weekly").or(z.literal("biweekly")),
});

export type TimeSelectionForm = z.infer<typeof timeSelectionSchemaBase>;
const RecurringReservationFormSchema = z
  .object({
    type: ReservationTypeSchema,
    seriesName: z.string().optional(),
    comments: z.string().max(500).optional(),
    bufferTimeBefore: z.boolean().optional(),
    bufferTimeAfter: z.boolean().optional(),
  })
  .merge(timeSelectionSchemaBase);

const convertToDate = (date?: string): Date | null =>
  date ? fromUIDate(date) : null;

const dateIsBefore = (date: Date | null, other: Date | null) =>
  date && other && date.getTime() < other.getTime();

const RecurringReservationFormSchemaRefined = (
  interval: ReservationStartInterval
) =>
  RecurringReservationFormSchema
    // need passthrough otherwise zod will strip the metafields
    .passthrough()
    // this refine works without partial since it's the last required value
    .refine(
      (s) =>
        s.type === ReservationTypeChoice.Blocked ||
        (s.seriesName !== undefined && s.seriesName.length > 0),
      {
        path: ["seriesName"],
        message: "Required",
      }
    )
    .superRefine((val, ctx) =>
      checkDateNotInPast(convertToDate(val.startingDate), ctx, "startingDate")
    )
    .superRefine((val, ctx) =>
      checkDateNotInPast(convertToDate(val.endingDate), ctx, "endingDate")
    )
    .refine(
      (s) =>
        dateIsBefore(
          convertToDate(s.startingDate),
          convertToDate(s.endingDate)
        ),
      {
        path: ["endingDate"],
        message: "Start date can't be after end date.",
      }
    )
    .superRefine((val, ctx) =>
      checkTimeStringFormat(val.startTime, ctx, "startTime")
    )
    .superRefine((val, ctx) =>
      checkTimeStringFormat(val.endTime, ctx, "endTime")
    )
    .superRefine((val, ctx) =>
      checkReservationInterval(
        val.startTime,
        ctx,
        "startTime",
        intervalToNumber(interval)
      )
    )
    .superRefine((val, ctx) =>
      checkReservationInterval(val.endTime, ctx, "endTime", 15)
    )
    .superRefine((val, ctx) => checkStartEndTime(val, ctx));

export { RecurringReservationFormSchemaRefined as RecurringReservationFormSchema };

export type RecurringReservationForm = z.infer<
  typeof RecurringReservationFormSchema
>;

const RescheduleReservationSeriesFormSchema = z
  .object({
    // TODO should have enable in the name
    bufferTimeBefore: z.boolean(),
    bufferTimeAfter: z.boolean(),
    type: ReservationTypeSchema,
  })
  .merge(timeSelectionSchemaBase);

export type RescheduleReservationSeriesForm = z.infer<
  typeof RescheduleReservationSeriesFormSchema
>;

// Copy paste from RecurringReservationFormSchemaRefined
// TODO schema refinements should be looked over and refactored so they can be reused easily
// TODO neither of them validates the end date =< 2 years from now (causes a backend error, that is toasted to the user)
const RescheduleReservationSeriesFormSchemaRefined = (
  interval: ReservationStartInterval
) =>
  RescheduleReservationSeriesFormSchema
    // need passthrough otherwise zod will strip the metafields
    // TODO do we need it here? reschedule might not have metadata
    .passthrough()
    // this refine works without partial since it's the last required value
    .superRefine((val, ctx) =>
      checkDateNotInPast(convertToDate(val.startingDate), ctx, "startingDate")
    )
    .superRefine((val, ctx) =>
      checkDateNotInPast(convertToDate(val.endingDate), ctx, "endingDate")
    )
    .refine(
      (s) =>
        dateIsBefore(
          convertToDate(s.startingDate),
          convertToDate(s.endingDate)
        ),
      {
        path: ["endingDate"],
        message: "Start date can't be after end date.",
      }
    )
    .superRefine((val, ctx) =>
      checkTimeStringFormat(val.startTime, ctx, "startTime")
    )
    .superRefine((val, ctx) =>
      checkTimeStringFormat(val.endTime, ctx, "endTime")
    )
    .superRefine((val, ctx) =>
      checkReservationInterval(
        val.startTime,
        ctx,
        "startTime",
        intervalToNumber(interval)
      )
    )
    .superRefine((val, ctx) =>
      checkReservationInterval(val.endTime, ctx, "endTime", 15)
    )
    .superRefine((val, ctx) => checkStartEndTime(val, ctx));

export { RescheduleReservationSeriesFormSchemaRefined as RescheduleReservationSeriesFormSchema };
