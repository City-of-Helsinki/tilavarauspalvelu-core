import { z } from "zod";
import { fromUIDate } from "common/src/common/util";
import { ReservationStartInterval, ReservationTypeChoice } from "@gql/gql-types";
import { intervalToNumber } from "./utils";
import { checkTimeStringFormat, checkValidFutureDate } from "common/src/schemas/schemaCommon";

export const ReservationTypes = Object.values(ReservationTypeChoice);
export const ReservationTypeSchema = z.nativeEnum(ReservationTypeChoice);

export type ReservationType = z.infer<typeof ReservationTypeSchema>;

export const TimeFormSchema = z.object({
  pk: z.number().optional(),
  // NOTE date needs to be string that is not coerced because it uses FI format
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  enableBufferTimeAfter: z.boolean(),
  enableBufferTimeBefore: z.boolean(),
  type: ReservationTypeSchema,
});

const ReservationFormSchema = z
  .object({
    comments: z.string().optional(),
    // backend doesn't accept bad emails (empty is fine)
    reserveeEmail: z.union([z.string().email(), z.string().length(0)]).optional(),
  })
  .merge(TimeFormSchema)
  // passthrough since this is combined to the metafields
  .passthrough();

// partial because of how Zod works
// refinements are only ran if the required fields are set
// this shows refinement errors before required of course we need to either do a second
// pass or add custom Required refinements
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ReservationFormSchemaPartial = ReservationFormSchema.partial();
type ReservationFormSchemaPartialType = z.infer<typeof ReservationFormSchemaPartial>;

export const checkStartEndTime = (
  data: Pick<ReservationFormSchemaPartialType, "startTime" | "endTime">,
  ctx: z.RefinementCtx
) => {
  if (
    data.startTime &&
    data.endTime &&
    Number(data.startTime.replace(":", ".")) >= Number(data.endTime.replace(":", "."))
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time needs to be after start time.",
    });
  }
};

export const checkReservationInterval = (
  time: string | undefined,
  ctx: z.RefinementCtx,
  path: string,
  interval: number
) => {
  if (time && Number(time.substring(3)) % interval !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `${path} has to be in ${interval} minutes increments.`,
    });
  }
};

// Date can't be in past
// Time is allowed to be in the past on purpose so it's not validated
// i.e. you can make a reservation for today 10:00 even if it's 10:30
const ReservationFormSchemaRefined = (interval: ReservationStartInterval) =>
  ReservationFormSchema.partial()
    .superRefine((val, ctx) => {
      if (val.date) {
        checkValidFutureDate(fromUIDate(val.date), ctx, "date");
      }
    })
    .superRefine((val, ctx) => checkTimeStringFormat(val.startTime, ctx, "startTime"))
    .superRefine((val, ctx) => checkTimeStringFormat(val.endTime, ctx, "endTime"))
    .superRefine((val, ctx) => checkStartEndTime(val, ctx))
    .superRefine((val, ctx) => checkReservationInterval(val.startTime, ctx, "startTime", intervalToNumber(interval)))
    .superRefine((val, ctx) => checkReservationInterval(val.endTime, ctx, "endTime", 15));

// NOTE duplicated schema because schemas need to be refined after merge (only times in this case)
export const TimeChangeFormSchemaRefined = (interval: ReservationStartInterval) =>
  TimeFormSchema.partial()
    .superRefine((val, ctx) => {
      const d = val.date ? fromUIDate(val.date) : null;
      checkValidFutureDate(d, ctx, "date");
    })
    .superRefine((val, ctx) => checkTimeStringFormat(val.startTime, ctx, "startTime"))
    .superRefine((val, ctx) => checkTimeStringFormat(val.endTime, ctx, "endTime"))
    .superRefine((val, ctx) => checkStartEndTime(val, ctx))
    .superRefine((val, ctx) => checkReservationInterval(val.startTime, ctx, "startTime", intervalToNumber(interval)))
    .superRefine((val, ctx) => checkReservationInterval(val.endTime, ctx, "endTime", 15))
    .refine((s) => s.type, {
      path: ["type"],
      message: "Required",
    });

export { ReservationFormSchemaRefined as ReservationFormSchema };

export type ReservationFormType = z.infer<typeof ReservationFormSchema>;

export const ReservationChangeFormSchema = z
  .object({
    type: ReservationTypeSchema,
    seriesName: z.string().optional(),
    comments: z.string(),
  })
  // passthrough since this is combined to the metafields
  .passthrough();

export type ReservationChangeFormType = z.infer<typeof ReservationChangeFormSchema>;
