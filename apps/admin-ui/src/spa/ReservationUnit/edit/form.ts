import { filterNonNullable } from "common/src/helpers";
import {
  fromApiDate,
  fromUIDate,
  toUIDate,
  toApiDate,
} from "common/src/common/util";
import {
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationUnitsReservationUnitAuthenticationChoices,
  type ReservationUnitByPkType,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitsReservationUnitReservationKindChoices,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
  type ReservationUnitPricingType,
  type ReservationUnitUpdateMutationInput,
  type ReservationUnitCreateMutationInput,
  ReservationUnitsReservationUnitImageImageTypeChoices,
  type ReservationUnitImageType,
} from "common/types/gql-types";
import { addDays, format } from "date-fns";
import { z } from "zod";
import { setTimeOnDate } from "@/component/reservations/utils";

export const PaymentTypes = ["ONLINE", "INVOICE", "ON_SITE"] as const;

export const PricingFormSchema = z.object({
  // pk === 0 means new pricing good decission?
  // pk === 0 fails silently on the backend, but undefined creates a new pricing
  pk: z.number(),
  taxPercentage: z.object({
    pk: z.number(),
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
    .nullable(),
  status: z.nativeEnum(ReservationUnitsReservationUnitPricingStatusChoices),
  // TODO this has to be a string because of HDS date input
  // in ui format: "d.M.yyyy"
  begins: z.string(),
});

export type PricingFormValues = z.infer<typeof PricingFormSchema>;

const refinePricing = (
  data: PricingFormValues,
  ctx: z.RefinementCtx,
  path: string
) => {
  if (
    data.status === ReservationUnitsReservationUnitPricingStatusChoices.Future
  ) {
    if (data.begins === "") {
      ctx.addIssue({
        message: "Required",
        path: [`${path}.begins`],
        code: z.ZodIssueCode.custom,
      });
    }
    if (Number.isNaN(fromUIDate(data.begins).getTime())) {
      ctx.addIssue({
        message: "Invalid date",
        path: [`${path}.begins`],
        code: z.ZodIssueCode.custom,
      });
    }
    if (fromUIDate(data.begins) < new Date()) {
      ctx.addIssue({
        message: "Begin needs to be in the future",
        path: [`${path}.begins`],
        code: z.ZodIssueCode.custom,
      });
    }
  }

  if (
    data.pricingType ===
    ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid
  ) {
    const lowestPrice = Number(data.lowestPrice);
    const highestPrice = Number(data.highestPrice);
    const lowestPriceNet = Number(data.lowestPriceNet);
    const highestPriceNet = Number(data.highestPriceNet);
    if (Number.isNaN(lowestPrice)) {
      ctx.addIssue({
        message: "must be a number",
        path: [`${path}.lowestPrice`],
        code: z.ZodIssueCode.custom,
      });
    }
    if (Number.isNaN(highestPrice)) {
      ctx.addIssue({
        message: "must be a number",
        path: [`${path}.highestPrice`],
        code: z.ZodIssueCode.custom,
      });
    }
    if (Number.isNaN(lowestPriceNet)) {
      ctx.addIssue({
        message: "must be a number",
        path: [`${path}.lowestPriceNet`],
        code: z.ZodIssueCode.custom,
      });
    }
    if (Number.isNaN(highestPriceNet)) {
      ctx.addIssue({
        message: "must be a number",
        path: [`${path}.highestPriceNet`],
        code: z.ZodIssueCode.custom,
      });
    }
    if (data.taxPercentage.pk === 0) {
      ctx.addIssue({
        message: "taxPercentage must be selected",
        path: [`${path}.taxPercentage`],
        code: z.ZodIssueCode.custom,
      });
    }
    if (lowestPrice > highestPrice) {
      ctx.addIssue({
        message: "lowestPrice must be lower than highestPrice",
        path: [`${path}.lowestPrice`],
        code: z.ZodIssueCode.custom,
      });
    }
  }
};

const ImageFormSchema = z.object({
  pk: z.number().optional(),
  mediumUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  imageType: z
    .nativeEnum(ReservationUnitsReservationUnitImageImageTypeChoices)
    .optional(),
  originalImageType: z
    .nativeEnum(ReservationUnitsReservationUnitImageImageTypeChoices)
    .optional(),
  bytes: z.instanceof(File).optional(),
  deleted: z.boolean().optional(),
});
export type ImageFormType = z.infer<typeof ImageFormSchema>;

export const ReservationUnitEditSchema = z
  .object({
    authentication: z.nativeEnum(
      ReservationUnitsReservationUnitAuthenticationChoices
    ),
    // TODO these are optional (0 is bit different than not set)
    // because if they are set (non undefined) we should show the active checkbox
    bufferTimeAfter: z.number(),
    bufferTimeBefore: z.number(),
    maxReservationsPerUser: z.number().nullable(),
    maxPersons: z.number().nullable(),
    minPersons: z.number().nullable(),
    maxReservationDuration: z.number().nullable(),
    minReservationDuration: z.number().nullable(),
    pk: z.number(),
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
    unitPk: z.number().min(1),
    canApplyFreeOfCharge: z.boolean(),
    reservationsMinDaysBefore: z.number(),
    reservationsMaxDaysBefore: z.number(),
    reservationKind: z.nativeEnum(
      ReservationUnitsReservationUnitReservationKindChoices
    ),
    contactInformation: z.string(),
    reservationPendingInstructionsFi: z.string(),
    reservationPendingInstructionsEn: z.string(),
    reservationPendingInstructionsSv: z.string(),
    reservationConfirmedInstructionsFi: z.string(),
    reservationConfirmedInstructionsEn: z.string(),
    reservationConfirmedInstructionsSv: z.string(),
    reservationCancelledInstructionsFi: z.string(),
    reservationCancelledInstructionsEn: z.string(),
    reservationCancelledInstructionsSv: z.string(),
    descriptionFi: z.string().max(4000),
    descriptionEn: z.string().max(4000),
    descriptionSv: z.string().max(4000),
    nameFi: z.string().min(1, { message: "Required" }).max(80),
    nameEn: z.string().max(80),
    nameSv: z.string().max(80),
    // backend allows nulls but not empty strings, these are not required though
    termsOfUseFi: z.string().max(10000),
    termsOfUseEn: z.string().max(10000),
    termsOfUseSv: z.string().max(10000),
    spacePks: z.array(z.number()),
    resourcePks: z.array(z.number()),
    equipmentPks: z.array(z.number()),
    purposePks: z.array(z.number()),
    qualifierPks: z.array(z.number()),
    paymentTypes: z.array(z.string()),
    pricings: z.array(PricingFormSchema),
    // TODO
    // "Not draft reservation unit must have a reservation unit type."
    reservationUnitTypePk: z.number().nullable(),
    cancellationRulePk: z.number().nullable(),
    // Terms pks are actually slugs
    paymentTermsPk: z.string().nullable(),
    pricingTerms: z.string().nullable(),
    cancellationTermsPk: z.string().nullable(),
    serviceSpecificTermsPk: z.string().nullable(),
    metadataSetPk: z.number().nullable(),
    surfaceArea: z.number(),
    images: z.array(ImageFormSchema),
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

    // the backend error on mutation: "Not draft state reservation unit must have one or more space or resource",
    if (v.spacePks.length === 0 && v.resourcePks.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
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

    if (v.maxPersons && v.minPersons) {
      if (v.maxPersons < v.minPersons) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Max persons must be greater than min persons",
          path: ["maxPersons"],
        });
      }
    }

    // refine pricing only if not draft and the pricing is enabled
    const enabledPricings = v.pricings.filter(
      (p) =>
        v.hasFuturePricing ||
        p.status === ReservationUnitsReservationUnitPricingStatusChoices.Active
    );
    enabledPricings.forEach((p, i) => {
      refinePricing(p, ctx, `pricings.${i}`);
    });

    // TODO if it includes futurePricing check that the futurePrice date is in the future (is today ok?)
    const hasPaidPricing = enabledPricings.some(
      (p) =>
        p.pricingType ===
        ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid
    );
    if (hasPaidPricing && v.paymentTypes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["paymentTypes"],
      });
    }
    if (v.canApplyFreeOfCharge && hasPaidPricing && v.pricingTerms == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["pricingTerms"],
      });
    }
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
      pk: p?.taxPercentage?.pk ?? 0,
      value: convertMaybeDecimal(p?.taxPercentage?.value) ?? 0,
    },
    lowestPrice: convertMaybeDecimal(p?.lowestPrice) ?? 0,
    lowestPriceNet: convertMaybeDecimal(p?.lowestPriceNet) ?? 0,
    highestPrice: convertMaybeDecimal(p?.highestPrice) ?? 0,
    highestPriceNet: convertMaybeDecimal(p?.highestPriceNet) ?? 0,
    pricingType:
      p?.pricingType ??
      ReservationUnitsReservationUnitPricingPricingTypeChoices.Free,
    priceUnit: p?.priceUnit ?? null,
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
  const isActive = (p?: ReservationUnitPricingType) =>
    p?.status === ReservationUnitsReservationUnitPricingStatusChoices.Active;
  const isFuture = (p?: ReservationUnitPricingType) =>
    p?.status === ReservationUnitsReservationUnitPricingStatusChoices.Future;

  const active = pricings.find(isActive);
  // NOTE using casting here because we only need the status to be set for the next step
  const future =
    pricings.find(isFuture) ??
    ({
      status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
    } as ReservationUnitPricingType);

  // allow undefined's here so we create two default values always
  return [active, future].map(convertPricing);
};

const convertImage = (image?: ReservationUnitImageType): ImageFormType => {
  return {
    pk: image?.pk ?? 0,
    imageUrl: image?.imageUrl ?? undefined,
    mediumUrl: image?.mediumUrl ?? undefined,
    imageType: image?.imageType ?? undefined,
    originalImageType: image?.imageType ?? undefined,
    bytes: undefined,
  };
};

export const convertReservationUnit = (
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
    spacePks: filterNonNullable(data?.spaces?.map((s) => s?.pk)),
    resourcePks: filterNonNullable(data?.resources?.map((r) => r?.pk)),
    equipmentPks: filterNonNullable(data?.equipment?.map((e) => e?.pk)),
    purposePks: filterNonNullable(data?.purposes?.map((p) => p?.pk)),
    qualifierPks: filterNonNullable(data?.qualifiers?.map((q) => q?.pk)),
    surfaceArea: data?.surfaceArea ?? 0,
    authentication:
      data?.authentication ??
      ReservationUnitsReservationUnitAuthenticationChoices.Weak,
    reservationUnitTypePk: data?.reservationUnitType?.pk ?? null,
    metadataSetPk: data?.metadataSet?.pk ?? null,
    paymentTermsPk: data?.paymentTerms?.pk ?? null,
    pricingTerms: data?.pricingTerms?.pk ?? null,
    serviceSpecificTermsPk: data?.serviceSpecificTerms?.pk ?? null,
    cancellationTermsPk: data?.cancellationTerms?.pk ?? null,
    cancellationRulePk: data?.cancellationRule?.pk ?? null,
    paymentTypes: filterNonNullable(data?.paymentTypes?.map((pt) => pt?.code)),
    pricings: convertPricingList(filterNonNullable(data?.pricings)),
    images: filterNonNullable(data?.images).map((i) => convertImage(i)),
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

const constructApiDate = (date: string, time: string) => {
  if (date === "" || time === "") {
    return null;
  }
  const d = fromUIDate(date);
  const d2 = setTimeOnDate(d, time);
  return d2.toISOString();
};

export function transformReservationUnit(
  values: ReservationUnitEditFormValues
): ReservationUnitUpdateMutationInput | ReservationUnitCreateMutationInput {
  const {
    pk,
    isDraft,
    isArchived,
    surfaceArea,
    reservationEndsDate,
    reservationEndsTime,
    reservationBeginsDate,
    reservationBeginsTime,
    publishBeginsDate,
    publishBeginsTime,
    publishEndsDate,
    publishEndsTime,
    pricings,
    hasFuturePricing,
    hasScheduledPublish,
    hasScheduledReservation,
    hasPublishBegins,
    hasPublishEnds,
    hasReservationBegins,
    hasReservationEnds,
    hasBufferTimeBefore,
    hasBufferTimeAfter,
    hasCancellationRule,
    bufferTimeAfter,
    bufferTimeBefore,
    cancellationRulePk,
    termsOfUseEn,
    termsOfUseFi,
    termsOfUseSv,
    images, // images are updated with a separate mutation
    ...vals
  } = values;

  const shouldSavePricing = (p: PricingFormValues) =>
    hasFuturePricing ||
    p.status === ReservationUnitsReservationUnitPricingStatusChoices.Active;

  return {
    ...vals,
    ...(pk ? { pk } : {}),
    surfaceArea:
      surfaceArea != null && surfaceArea > 0 ? Math.floor(surfaceArea) : null,
    reservationBegins: hasReservationBegins
      ? constructApiDate(reservationBeginsDate, reservationBeginsTime)
      : null,
    reservationEnds: hasReservationEnds
      ? constructApiDate(reservationEndsDate, reservationEndsTime)
      : null,
    publishBegins: hasPublishBegins
      ? constructApiDate(publishBeginsDate, publishBeginsTime)
      : null,
    publishEnds: hasPublishEnds
      ? constructApiDate(publishEndsDate, publishEndsTime)
      : null,
    bufferTimeAfter: hasBufferTimeAfter ? bufferTimeAfter : null,
    bufferTimeBefore: hasBufferTimeBefore ? bufferTimeBefore : null,
    isDraft,
    isArchived,
    termsOfUseEn: termsOfUseEn !== "" ? termsOfUseEn : null,
    termsOfUseFi: termsOfUseFi !== "" ? termsOfUseFi : null,
    termsOfUseSv: termsOfUseSv !== "" ? termsOfUseSv : null,
    cancellationRulePk: hasCancellationRule ? cancellationRulePk : null,
    // TODO only one active price can be saved
    // the form doesn't allow multiples but make sure here that we only have one active and one future and warn the user if not
    pricings: filterNonNullable(pricings)
      .filter(shouldSavePricing)
      .map((p) => ({
        begins: toApiDate(fromUIDate(p.begins)) ?? "",
        highestPrice: Number(p.highestPrice),
        highestPriceNet: Number(p.highestPriceNet),
        lowestPrice: Number(p.lowestPrice),
        lowestPriceNet: Number(p.lowestPriceNet),
        ...(p.pk !== 0 ? { pk: p.pk } : {}),
        ...(p.priceUnit != null ? { priceUnit: p.priceUnit } : {}),
        pricingType: p.pricingType,
        status: p.status,
        ...(p.taxPercentage.pk !== 0
          ? { taxPercentagePk: p.taxPercentage.pk }
          : {}),
      })),
  };
}
