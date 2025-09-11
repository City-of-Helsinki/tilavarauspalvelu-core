import { z } from "zod";
import { parseUIDate } from "../modules/date-utils";
import { MunicipalityChoice, ReservationStartInterval, ReservationTypeChoice, ReserveeType } from "../../gql/gql-types";
import { checkTimeStringFormat, checkValidFutureDate } from "./schemaCommon";
import { getIntervalMinutes } from "../modules/conversion";

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

const CreateStaffReservationFormSchema = z
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
const CreateStaffReservationFormSchemaPartial = CreateStaffReservationFormSchema.partial();
type CreateStaffReservationFormSchemaPartialType = z.infer<typeof CreateStaffReservationFormSchemaPartial>;

export const checkStartEndTime = (
  data: Pick<CreateStaffReservationFormSchemaPartialType, "startTime" | "endTime">,
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
const CreateStaffReservationFormSchemaRefined = (interval: ReservationStartInterval) =>
  CreateStaffReservationFormSchema.partial()
    .superRefine((val, ctx) => {
      if (val.date) {
        checkValidFutureDate(parseUIDate(val.date), ctx, "date");
      }
    })
    .superRefine((val, ctx) => checkTimeStringFormat(val.startTime, ctx, "startTime"))
    .superRefine((val, ctx) => checkTimeStringFormat(val.endTime, ctx, "endTime"))
    .superRefine((val, ctx) => checkStartEndTime(val, ctx))
    .superRefine((val, ctx) => checkReservationInterval(val.startTime, ctx, "startTime", getIntervalMinutes(interval)))
    .superRefine((val, ctx) => checkReservationInterval(val.endTime, ctx, "endTime", 15))
    .refine((s) => s.type, {
      path: ["type"],
      message: "Required",
    });

// NOTE duplicated schema because schemas need to be refined after merge (only times in this case)
export const TimeChangeFormSchemaRefined = (interval: ReservationStartInterval) =>
  TimeFormSchema.partial()
    .superRefine((val, ctx) => {
      const d = val.date ? parseUIDate(val.date) : null;
      checkValidFutureDate(d, ctx, "date");
    })
    .superRefine((val, ctx) => checkTimeStringFormat(val.startTime, ctx, "startTime"))
    .superRefine((val, ctx) => checkTimeStringFormat(val.endTime, ctx, "endTime"))
    .superRefine((val, ctx) => checkStartEndTime(val, ctx))
    .superRefine((val, ctx) => checkReservationInterval(val.startTime, ctx, "startTime", getIntervalMinutes(interval)))
    .superRefine((val, ctx) => checkReservationInterval(val.endTime, ctx, "endTime", 15))
    .refine((s) => s.type, {
      path: ["type"],
      message: "Required",
    });

export { CreateStaffReservationFormSchemaRefined as CreateStaffReservationFormSchema };

export type CreateReservationFormType = z.infer<typeof CreateStaffReservationFormSchema>;

// TODO what is this for?
export const ReservationChangeFormSchema = z
  .object({
    type: ReservationTypeSchema,
    seriesName: z.string().optional(),
    comments: z.string(),
  })
  // passthrough since this is combined to the metafields
  .passthrough();

export type ReservationChangeFormType = z.infer<typeof ReservationChangeFormSchema>;

// FIXME name is wrong (not Meta)
export const ReservationFormMetaSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  ageGroup: z.number().optional(),
  applyingForFreeOfCharge: z.boolean().optional(),
  freeOfChargeReason: z.string().optional(),
  municipality: z.enum([MunicipalityChoice.Helsinki, MunicipalityChoice.Other]).optional(),
  numPersons: z.number().optional(),
  purpose: z.number().optional(),
  reserveeEmail: z.union([z.string().email(), z.string().length(0)]).optional(),
  reserveeFirstName: z.string().optional(),
  reserveeIdentifier: z.string().optional(),
  reserveeIsUnregisteredAssociation: z.boolean().optional(),
  reserveeLastName: z.string().optional(),
  reserveeOrganisationName: z.string().optional(),
  reserveePhone: z.string().optional(),
  // TODO the reserveeType is problematic
  // radio buttons should have a default value and form inputs don't like null (uncontrolled input)
  // TODO test what happens if the user submits a form with a null value?
  reserveeType: z.enum([ReserveeType.Individual, ReserveeType.Nonprofit, ReserveeType.Company]).nullable(),
});

export type ReservationFormMeta = z.infer<typeof ReservationFormMetaSchema>;
