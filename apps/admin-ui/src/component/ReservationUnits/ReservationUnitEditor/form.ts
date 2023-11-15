import { filterNonNullable } from "common/src/helpers";
import { fromApiDate, toUIDate } from "common/src/common/util";
import {
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationUnitsReservationUnitAuthenticationChoices,
  type ReservationUnitByPkType,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
  type ReservationUnitPricingType,
} from "common/types/gql-types";
import { addDays, format } from "date-fns";
import { z } from "zod";

export const PricingFormSchema = z.object({
  // pk === 0 means new pricing good decission?
  // pk === 0 fails silently on the backend, but undefined creates a new pricing
  pk: z.number(),
  taxPercentage: z.object({
    pk: z.number().optional(),
    value: z.number(),
  }),
  lowestPrice: z.number(),
  lowestPriceNet: z.number(),
  highestPrice: z.number(),
  highestPriceNet: z.number(),
  pricingType: z.nativeEnum(
    ReservationUnitsReservationUnitPricingPricingTypeChoices
  ),
  priceUnit: z
    .nativeEnum(ReservationUnitsReservationUnitPricingPriceUnitChoices)
    .optional(),
  status: z.nativeEnum(ReservationUnitsReservationUnitPricingStatusChoices),
  // TODO this has to be a string because of HDS date input
  // in ui format: "d.M.yyyy"
  begins: z.string(),
});

export type PricingFormValues = z.infer<typeof PricingFormSchema>;

export const ReservationUnitEditSchema = z
  .object({
    authentication: z.nativeEnum(
      ReservationUnitsReservationUnitAuthenticationChoices
    ),
    // TODO these are optional (0 is bit different than not set)
    // because if they are set (non undefined) we should show the active checkbox
    bufferTimeAfter: z.number(),
    bufferTimeBefore: z.number(),
    // TODO default to optional
    maxReservationsPerUser: z.number().nullable(),
    // TODO maxPerson > minPerson
    // TODO allow 0 (or null in the backend) for drafts?
    maxPersons: z.number().min(1).nullable(),
    minPersons: z.number().min(1).nullable(),
    maxReservationDuration: z.number().min(1).nullable(),
    minReservationDuration: z.number().min(1).nullable(),
    pk: z.number(),
    // priceUnit: string;
    // Date in string format
    publishBeginsDate: z.string(),
    publishBeginsTime: z.string(),
    publishEndsDate: z.string(),
    publishEndsTime: z.string(),
    // Date in string format
    reservationBeginsDate: z.string(),
    reservationBeginsTime: z.string(),
    reservationEndsDate: z.string(),
    reservationEndsTime: z.string(),
    requireIntroduction: z.boolean(),
    requireReservationHandling: z.boolean(),
    reservationStartInterval: z.nativeEnum(
      ReservationUnitsReservationUnitReservationStartIntervalChoices
    ),
    unitPk: z.number().min(1), // .refine((v) => v > 0, { message: "Unit pk must be greater than 0" }),
    canApplyFreeOfCharge: z.boolean(),
    reservationsMinDaysBefore: z.number(),
    reservationsMaxDaysBefore: z.number(),
    reservationKind: z.nativeEnum(
      ReservationUnitsReservationUnitReservationKindChoices
    ),
    contactInformation: z.string(),
    // TODO this is missing? additionalInstructionsFi
    reservationPendingInstructionsFi: z.string(),
    reservationPendingInstructionsEn: z.string(),
    reservationPendingInstructionsSv: z.string(),
    reservationConfirmedInstructionsFi: z.string(),
    reservationConfirmedInstructionsEn: z.string(),
    reservationConfirmedInstructionsSv: z.string(),
    reservationCancelledInstructionsFi: z.string(),
    reservationCancelledInstructionsEn: z.string(),
    reservationCancelledInstructionsSv: z.string(),
    // all are required for non draft
    // not required for drafts
    // TODO allow draft to have empty strings
    descriptionFi: z.string().max(4000),
    descriptionEn: z.string().max(4000),
    descriptionSv: z.string().max(4000),
    // nameFi is required for both draft and published
    nameFi: z.string().min(1).max(80),
    // not required for drafts
    // TODO allow draft to have empty strings
    nameEn: z.string().max(80), // .min(1).max(80),
    nameSv: z.string().max(80), // .min(1).max(80),
    // backend allows nulls but not empty strings, these are not required though
    termsOfUseFi: z.string().max(10000),
    termsOfUseEn: z.string().max(10000),
    termsOfUseSv: z.string().max(10000),
    // TODO "Not draft state reservation unit must have one or more space or resource"
    // either or?
    spacePks: z.array(z.number()),
    resourcePks: z.array(z.number()),
    equipmentPks: z.array(z.number()),
    purposePks: z.array(z.number()),
    qualifierPks: z.array(z.number()),
    paymentTypes: z.array(z.string()),
    // TODO this can be undefined because we are registering / unregistering these
    pricings: z.array(PricingFormSchema),
    // TODO
    // "Not draft reservation unit must have a reservation unit type."
    reservationUnitTypePk: z.number().optional(),
    cancellationRulePk: z.number().nullable(),
    // Terms pks are actually slugs
    paymentTermsPk: z.string().optional(),
    pricingTerms: z.string().optional(),
    cancellationTermsPk: z.string().nullable(),
    serviceSpecificTermsPk: z.string().optional(),
    metadataSetPk: z.number().optional(),
    surfaceArea: z.number(),
    // internal values
    isDraft: z.boolean(),
    isArchived: z.boolean(),
    // do we show optional fields to the user? not sent to backend but changes if the field is sent
    hasFuturePricing: z.boolean(),
    hasScheduledPublish: z.boolean(),
    hasPublishBegins: z.boolean(),
    hasPublishEnds: z.boolean(),
    hasScheduledReservation: z.boolean(),
    hasReservationBegins: z.boolean(),
    hasReservationEnds: z.boolean(),
    hasBufferTimeBefore: z.boolean(),
    hasBufferTimeAfter: z.boolean(),
    hasCancellationRule: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.isDraft || v.isArchived) {
      return;
    }

    if (
      v.reservationKind !==
      ReservationUnitsReservationUnitReservationKindChoices.Season
    ) {
      // TODO add the separation for Single vs. Seasonal
      // Seasonal only is missing some of the fields
      // minReservationDuration: requiredForSingle(Joi.number().required()),
      // maxReservationDuration: requiredForSingle(Joi.number().required()),
      // reservationsMinDaysBefore: requiredForSingle(Joi.number().required()),
      // reservationsMaxDaysBefore: requiredForSingle(Joi.number().required()),
      // reservationStartInterval: requiredForSingle(Joi.string().required()),
      // authentication: requiredForSingle(Joi.string().required()),
      // metadataSetPk: requiredForSingle(Joi.number().required()),
      if (v.minReservationDuration == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["minReservationDuration"],
        });
      }
      if (v.maxReservationDuration == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["maxReservationDuration"],
        });
      }
      if (v.reservationsMinDaysBefore == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["reservationsMinDaysBefore"],
        });
      }
      if (v.reservationsMaxDaysBefore == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["reservationsMaxDaysBefore"],
        });
      }
      if (v.reservationStartInterval == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["reservationStartInterval"],
        });
      }
      if (v.authentication == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["authentication"],
        });
      }
      if (v.metadataSetPk == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["metadataSetPk"],
        });
      }
    }

    // TODO add paymentTypes: requiredForNonFreeRU(Joi.array().min(1).required()),
    // if there is non free pricing it should have at least one payment type
    if (v.spacePks.length === 0 && v.resourcePks.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Not draft state reservation unit must have one or more space or resource",
        path: ["spacePks"],
      });
    }
    if (v.reservationUnitTypePk == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["reservationUnitTypePk"],
      });
    }
    if (v.nameEn === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["nameEn"],
      });
    }
    if (v.nameSv === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["nameSv"],
      });
    }
    if (v.descriptionEn === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["descriptionEn"],
      });
    }
    if (v.descriptionSv === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["descriptionSv"],
      });
    }
    if (v.descriptionFi === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["descriptionFi"],
      });
    }

    // TODO if it includes futurePricing check that the futurePrice date is in the future (is today ok?)
    // TODO if it includes pricing (non free) check that it has a payment method
  });

export type ReservationUnitEditFormValues = z.infer<
  typeof ReservationUnitEditSchema
>;

// NOTE decimal type is incorrectly typed as number in codegen
const convertMaybeDecimal = (value?: unknown) => {
  if (value == null || value === "") {
    return undefined;
  }
  return Number(value);
};

const convertPricing = (p?: ReservationUnitPricingType): PricingFormValues => {
  const convertBegins = (
    begins?: string,
    status?: ReservationUnitsReservationUnitPricingStatusChoices
  ) => {
    const d = begins != null && begins !== "" ? fromApiDate(begins) : undefined;
    const today = new Date();
    if (d != null) {
      return toUIDate(d);
    }
    if (status === ReservationUnitsReservationUnitPricingStatusChoices.Future) {
      return toUIDate(addDays(today, 1));
    }
    return toUIDate(today);
  };

  return {
    pk: p?.pk ?? 0,
    taxPercentage: {
      pk: p?.taxPercentage?.pk ?? undefined,
      value: convertMaybeDecimal(p?.taxPercentage?.value) ?? 0,
    },
    lowestPrice: convertMaybeDecimal(p?.lowestPrice) ?? 0,
    lowestPriceNet: convertMaybeDecimal(p?.lowestPriceNet) ?? 0,
    highestPrice: convertMaybeDecimal(p?.highestPrice) ?? 0,
    highestPriceNet: convertMaybeDecimal(p?.highestPriceNet) ?? 0,
    pricingType:
      p?.pricingType ??
      ReservationUnitsReservationUnitPricingPricingTypeChoices.Free,
    priceUnit: p?.priceUnit ?? undefined,
    status:
      p?.status ?? ReservationUnitsReservationUnitPricingStatusChoices.Active,
    begins: convertBegins(p?.begins, p?.status),
  };
};

// Don't return past pricings (they can't be saved to backend)
// Always return one active pricing and one future pricing
// the boolean toggle in the form decides if the future one is shown or saved
const convertPricingList = (
  pricings: ReservationUnitPricingType[]
): PricingFormValues[] => {
  // Past pricing can't be saved and is not displayed in the UI
  const notPast = pricings?.filter(
    (p) =>
      p?.status !== ReservationUnitsReservationUnitPricingStatusChoices.Past
  );
  // Only one active and one future pricing can be saved (and is actually shown)
  const active = notPast.find(
    (p) =>
      p?.status === ReservationUnitsReservationUnitPricingStatusChoices.Active
  );
  const future =
    notPast.find(
      (p) =>
        p?.status === ReservationUnitsReservationUnitPricingStatusChoices.Future
    ) ??
    ({
      status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
    } as ReservationUnitPricingType);
  // allow undefined's here so we create two default values always
  return [active, future].map(convertPricing);
};

export const convert = (
  data?: ReservationUnitByPkType
): ReservationUnitEditFormValues => {
  return {
    bufferTimeAfter: data?.bufferTimeAfter ?? 0,
    bufferTimeBefore: data?.bufferTimeBefore ?? 0,
    maxReservationsPerUser: data?.maxReservationsPerUser ?? null,
    maxPersons: data?.maxPersons ?? null,
    minPersons: data?.minPersons ?? null,
    maxReservationDuration: data?.maxReservationDuration ?? null,
    minReservationDuration: data?.minReservationDuration ?? null,
    pk: data?.pk ?? 0,
    // TODO
    // priceUnit: "", // data?.priceUnit ?? "",
    // Date split for ui components
    publishBeginsDate: data?.publishBegins
      ? format(new Date(data.publishBegins), "d.M.yyyy")
      : "",
    publishBeginsTime: data?.publishBegins
      ? format(new Date(data.publishBegins), "h:mm")
      : "",
    publishEndsDate: data?.publishEnds
      ? format(new Date(data.publishEnds), "d.M.yyyy")
      : "",
    publishEndsTime: data?.publishEnds
      ? format(new Date(data.publishEnds), "H:mm")
      : "",
    reservationBeginsDate: data?.reservationBegins
      ? format(new Date(data.reservationBegins), "d.M.yyyy")
      : "",
    reservationBeginsTime: data?.reservationBegins
      ? format(new Date(data.reservationBegins), "H:mm")
      : "",
    reservationEndsDate: data?.reservationEnds
      ? format(new Date(data.reservationEnds), "d.M.yyyy")
      : "",
    reservationEndsTime: data?.reservationEnds
      ? format(new Date(data.reservationEnds), "H:mm")
      : "",
    requireIntroduction: data?.requireIntroduction ?? false,
    requireReservationHandling: data?.requireReservationHandling ?? false,
    reservationStartInterval:
      data?.reservationStartInterval ??
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins,
    unitPk: data?.unit?.pk ?? 0,
    canApplyFreeOfCharge: data?.canApplyFreeOfCharge ?? false,
    reservationsMinDaysBefore: data?.reservationsMinDaysBefore ?? 0,
    reservationsMaxDaysBefore: data?.reservationsMaxDaysBefore ?? 0,
    reservationKind:
      data?.reservationKind ??
      ReservationUnitsReservationUnitReservationKindChoices.DirectAndSeason,
    contactInformation: data?.contactInformation ?? "",
    reservationPendingInstructionsFi:
      data?.reservationPendingInstructionsFi ?? "",
    reservationPendingInstructionsEn:
      data?.reservationPendingInstructionsEn ?? "",
    reservationPendingInstructionsSv:
      data?.reservationPendingInstructionsSv ?? "",
    reservationConfirmedInstructionsFi:
      data?.reservationConfirmedInstructionsFi ?? "",
    reservationConfirmedInstructionsEn:
      data?.reservationConfirmedInstructionsEn ?? "",
    reservationConfirmedInstructionsSv:
      data?.reservationConfirmedInstructionsSv ?? "",
    reservationCancelledInstructionsFi:
      data?.reservationCancelledInstructionsFi ?? "",
    reservationCancelledInstructionsEn:
      data?.reservationCancelledInstructionsEn ?? "",
    reservationCancelledInstructionsSv:
      data?.reservationCancelledInstructionsSv ?? "",
    descriptionFi: data?.descriptionFi ?? "",
    descriptionEn: data?.descriptionEn ?? "",
    descriptionSv: data?.descriptionSv ?? "",
    nameFi: data?.nameFi ?? "",
    nameEn: data?.nameEn ?? "",
    nameSv: data?.nameSv ?? "",
    termsOfUseFi: data?.termsOfUseFi ?? "",
    termsOfUseEn: data?.termsOfUseEn ?? "",
    termsOfUseSv: data?.termsOfUseSv ?? "",
    // spacePks: data?.spaces?.map((s) => s?.pk) ?? [],
    spacePks: filterNonNullable(data?.spaces?.map((s) => s?.pk)),
    // resourcePks: data?.resources?.map((r) => r?.pk) ?? [],
    resourcePks: filterNonNullable(data?.resources?.map((r) => r?.pk)),
    equipmentPks: filterNonNullable(data?.equipment?.map((e) => e?.pk)),
    purposePks: filterNonNullable(data?.purposes?.map((p) => p?.pk)),
    qualifierPks: filterNonNullable(data?.qualifiers?.map((q) => q?.pk)),
    // paymentTermsPk: data?.paymentTerms?.pk ?? undefined,
    paymentTermsPk: data?.paymentTerms?.pk ?? undefined,
    surfaceArea: data?.surfaceArea ?? 0,
    // paymentTypes: data?.paymentTerms?
    authentication:
      data?.authentication ??
      ReservationUnitsReservationUnitAuthenticationChoices.Weak,
    reservationUnitTypePk: data?.reservationUnitType?.pk ?? undefined,
    metadataSetPk: data?.metadataSet?.pk ?? undefined,
    pricingTerms: data?.pricingTerms?.pk ?? undefined,
    cancellationTermsPk: data?.cancellationTerms?.pk ?? null,
    cancellationRulePk: data?.cancellationRule?.pk ?? null,
    paymentTypes: filterNonNullable(data?.paymentTypes?.map((pt) => pt?.code)),
    pricings: convertPricingList(filterNonNullable(data?.pricings)),
    isDraft: data?.isArchived ?? false,
    isArchived: data?.isArchived ?? false,
    hasFuturePricing:
      data?.pricings?.some(
        (p) =>
          p?.status != null &&
          p?.status ===
            ReservationUnitsReservationUnitPricingStatusChoices.Future
      ) ?? false,
    hasScheduledPublish:
      data?.publishBegins != null || data?.publishEnds != null,
    hasScheduledReservation:
      data?.reservationBegins != null || data?.reservationEnds != null,
    hasPublishBegins: data?.publishBegins != null,
    hasPublishEnds: data?.publishEnds != null,
    hasReservationBegins: data?.reservationBegins != null,
    hasReservationEnds: data?.reservationEnds != null,
    hasBufferTimeBefore: data?.bufferTimeBefore != null,
    hasBufferTimeAfter: data?.bufferTimeAfter != null,
    hasCancellationRule: data?.cancellationRule != null,
  };
};
