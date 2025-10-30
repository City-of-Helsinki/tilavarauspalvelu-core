import { z } from "zod";
import { parseUIDate } from "../modules/date-utils";
import {
  MunicipalityChoice,
  ReservationFormType,
  ReservationStartInterval,
  ReservationTypeChoice,
  ReservationUnitNode,
  ReserveeType,
} from "../../gql/gql-types";
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
  // TODO this is bad, use form schema instead
  .object({
    comments: z.string().optional(),
    // backend doesn't accept bad emails (empty is fine)
    reserveeEmail: z.union([z.string().email(), z.string().length(0)]).optional(),
  })
  .extend(TimeFormSchema.shape);

export type CreateReservationFormType = z.infer<typeof CreateStaffReservationFormSchema>;

type CreateStaffReservationFormSchema = z.infer<typeof CreateStaffReservationFormSchema>;
type TimeFormValuesT = z.infer<typeof TimeFormSchema>;

// Only used for admin forms
// TODO should be combined with the new schemas, but should have partial
// - note: email is gonna be a problem since partial doesn't allow empty strings
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
  reserveeType: z.enum([ReserveeType.Individual, ReserveeType.Nonprofit, ReserveeType.Company]).optional(),
});

export function checkStartEndTime(
  data: Pick<TimeFormValuesT, "startTime" | "endTime">,
  ctx: z.RefinementCtx
): undefined {
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
}

export function checkReservationInterval(
  time: string | undefined,
  ctx: z.RefinementCtx,
  path: string,
  interval: number
): undefined {
  if (time && Number(time.substring(3)) % interval !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [path],
      message: `${path} has to be in ${interval} minutes increments.`,
    });
  }
}

/// Separate schema for staff because the form fields are not mandatory
/// Date can't be in past
/// Time is allowed to be in the past on purpose so it's not validated
/// i.e. you can make a reservation for today 10:00 even if it's 10:30
export function getCreateStaffReservationFormSchema(interval: ReservationStartInterval) {
  return CreateStaffReservationFormSchema.extend(ReservationFormMetaSchema.shape)
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
}

// NOTE duplicated schema because schemas need to be refined after merge (only times in this case)
export function getTimeChangeFormSchemaRefined(interval: ReservationStartInterval) {
  return TimeFormSchema.superRefine((val, ctx) => {
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
}

export type CreateStaffReservationFormValues = z.infer<ReturnType<typeof getCreateStaffReservationFormSchema>>;

export const ReservationChangeFormSchema = z
  .object({
    type: ReservationTypeSchema,
    seriesName: z.string(),
    comments: z.string(),
  })
  .extend(ReservationFormMetaSchema.shape)
  .refine((val) => val.type === ReservationTypeChoice.Blocked || val.seriesName.length > 0, {
    path: ["seriesName"],
    message: "Required",
  });

export type ReservationChangeFormType = z.infer<typeof ReservationChangeFormSchema>;

// TODO combine with ReservationFormMetaSchema
// but requires refactoring CreateStaff schemas
const ContactInfoFormSchema = z.object({
  // TODO could use transform / preprocessor to remove / flag empty strings
  // the problem with setting min is that we can't disable it for admin
  reserveeFirstName: z.string().min(2, "Required"),
  reserveeLastName: z.string().min(2, "Required"),
  // TODO check for valid characters (not regex, simpler)
  reserveePhone: z.string().min(3, "Required"),
  reserveeEmail: z.string().min(1, "Required").email(),
  // Optional for all forms based on the reservationUnit settings (could be added dynamically)
  applyingForFreeOfCharge: z.boolean().optional(),
  freeOfChargeReason: z.string().optional(),
});

type SchemaParams = {
  minPersons: number;
  maxPersons: number;
};

const ReserveeInfoFormSchema = (params: SchemaParams) =>
  z
    .object({
      reserveeType: z.enum([ReserveeType.Individual, ReserveeType.Nonprofit, ReserveeType.Company]),
      description: z.string().min(3, "Required"),
      municipality: z.enum([MunicipalityChoice.Helsinki, MunicipalityChoice.Other]),
      numPersons: z.number().min(params.minPersons, "Too small").max(params.maxPersons, "Too large"),
      // these are only required for organisations
      reserveeIdentifier: z.string(),
      reserveeIsUnregisteredAssociation: z.boolean(),
      reserveeOrganisationName: z.string(),
    })
    .extend(ContactInfoFormSchema.shape);

const PurposeFormSchema = (params: SchemaParams) =>
  z
    .object({
      purpose: z.number().min(1),
      name: z.string(), // not mandatory
    })
    .extend(ReserveeInfoFormSchema(params).shape);

const AgeGroupFormSchema = (params: SchemaParams) =>
  z
    .object({
      ageGroup: z.number().min(1),
    })
    .extend(PurposeFormSchema(params).shape);

const PkSchema = z.object({
  pk: z.number(),
});
// NOTE min / max don't matter for types
const PartialFormSchema = AgeGroupFormSchema({ minPersons: 1, maxPersons: 2 }).partial().extend(PkSchema.shape);
export type ReservationFormValueT = z.infer<typeof PartialFormSchema>;

export function getReservationSchemaBase(formType: ReservationFormType) {
  switch (formType) {
    case ReservationFormType.ContactInfoForm:
      return () => ContactInfoFormSchema;
    case ReservationFormType.ReserveeInfoForm:
      return ReserveeInfoFormSchema;
    case ReservationFormType.PurposeForm:
      return PurposeFormSchema;
    case ReservationFormType.AgeGroupForm:
      return AgeGroupFormSchema;
  }
}

/// The single source of truth for the form fields used by a form type.
/// only for internal use (type / refinements)
/// this returns incorrect schema for ContactInfo, but makes schema refinement possible
function getReservationSchemaUnrefined(reservationUnit: ReservationUnitForRefinement) {
  const maxPersons = reservationUnit.maxPersons ?? Infinity;
  const minPersons = reservationUnit.minPersons ?? 1;
  switch (reservationUnit.reservationForm) {
    case ReservationFormType.ContactInfoForm:
    case ReservationFormType.ReserveeInfoForm:
      return ReserveeInfoFormSchema({ maxPersons, minPersons });
    case ReservationFormType.PurposeForm:
      return PurposeFormSchema({ maxPersons, minPersons });
    case ReservationFormType.AgeGroupForm:
      return AgeGroupFormSchema({ maxPersons, minPersons });
  }
}

type ReservationUnitForRefinement = Pick<ReservationUnitNode, "reservationForm" | "minPersons" | "maxPersons">;

/// TODO this could use formContainsField helper to automatically construct the schema
/// issue with this is that it removes the type narrowing provided by a switch.
function getReservationFormSchemaImpl(reservationUnit: ReservationUnitForRefinement) {
  if (reservationUnit.reservationForm === ReservationFormType.ContactInfoForm) {
    return ContactInfoFormSchema;
  }
  return getReservationSchemaUnrefined(reservationUnit)
    .refine((val) => val.reserveeType === ReserveeType.Individual || val.reserveeOrganisationName.length > 0, {
      path: ["reserveeOrganisationName"],
      message: "Required",
    })
    .refine(
      (val) =>
        val.reserveeType === ReserveeType.Individual ||
        (val.reserveeIsUnregisteredAssociation && val.reserveeType === ReserveeType.Nonprofit) ||
        val.reserveeIdentifier.length > 0,
      {
        path: ["reserveeIdentifier"],
        message: "Required",
      }
    );
}

/// Get the schema that matches the selected FormType
export function getReservationFormSchema(reservationUnit: ReservationUnitForRefinement) {
  return getReservationFormSchemaImpl(reservationUnit).refine(
    (val) => !val.applyingForFreeOfCharge || (val.freeOfChargeReason != null && val.freeOfChargeReason.length > 0),
    {
      path: ["freeOfChargeReason"],
      message: "Required",
    }
  );
}
