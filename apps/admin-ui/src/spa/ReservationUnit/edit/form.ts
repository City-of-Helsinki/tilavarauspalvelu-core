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
import { TFunction } from "i18next";
import { setTimeOnDate } from "@/component/reservations/utils";
import { checkLengthWithoutHtml, checkTimeStringFormat } from "@/schemas";

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
  // NOTE this has to be a string because of HDS date input in ui format: "d.M.yyyy"
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
    const date = fromUIDate(data.begins);
    if (date == null || Number.isNaN(date.getTime())) {
      ctx.addIssue({
        message: "Invalid date",
        path: [`${path}.begins`],
        code: z.ZodIssueCode.custom,
      });
    }
    if (date != null && date < new Date()) {
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

// Time is saved in a string format "HH:mm:ss" backend accepts also "HH:mm"
const ReservableTimeSchema = z.object({
  begin: z.string(),
  end: z.string(),
});

const SeasonalFormSchema = z.object({
  pk: z.number(),
  closed: z.boolean(),
  weekday: z.number().min(0).max(6),
  // unregister leaves undefined in the array
  // undefined => not rendered, not saved
  // empty => rendered as empty, not saved
  // valid => rendered as valid, saved
  reservableTimes: z.array(ReservableTimeSchema.optional()),
});
type SeasonalFormType = z.infer<typeof SeasonalFormSchema>;

function validateSeasonalTimes(
  data: SeasonalFormType[],
  ctx: z.RefinementCtx
): void {
  data.forEach((season, index) => {
    // closed don't need validation (time is not saved)
    if (season.closed) {
      return;
    }
    // pass empties and "" because they are never sent
    let lastEnd: number | null = null;
    season.reservableTimes.forEach((reservableTime, i) => {
      if (reservableTime == null) {
        return;
      }
      // check both begin and end
      if (reservableTime.begin == null && reservableTime.end == null) {
        return;
      }
      if (reservableTime.begin === "" && reservableTime.end === "") {
        return;
      }
      const path = `seasons[${index}].reservableTimes[${i}]`;
      checkTimeStringFormat(
        reservableTime?.begin,
        ctx,
        `${path}.begin`,
        "time"
      );
      checkTimeStringFormat(reservableTime?.end, ctx, `${path}.end`, "time");

      const [h1, m1] = reservableTime.begin.split(":");
      const [h2, m2] = reservableTime.end.split(":");
      const begin = { hours: parseInt(h1, 10), minutes: parseInt(m1, 10) };
      const end = { hours: parseInt(h2, 10), minutes: parseInt(m2, 10) };

      const beginTimeMinutes = begin.hours * 60 + begin.minutes;
      const endTimeMinutes = end.hours * 60 + end.minutes;
      // this corresponds to the backend error: "Timeslot 1 begin and end time must be at 30 minute intervals."
      if (beginTimeMinutes % 30 !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "time must be at 30 minute intervals",
          path: [`${path}.begin`],
        });
      }
      if (endTimeMinutes % 30 !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "time must be at 30 minute intervals",
          path: [`${path}.end`],
        });
      }

      // check that the begin is before the end
      if (begin != null && end != null) {
        const t1 = begin.hours * 60 + begin.minutes;
        const t2 = end.hours * 60 + end.minutes;
        if (t1 >= t2 && t2 !== 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Begin must be before end",
            path: [`${path}.end`],
          });
        }
      }

      // check that the first can't end after the second begins
      if (i > 0) {
        if (lastEnd != null) {
          const t2 = begin.hours * 60 + begin.minutes;

          if (lastEnd === t2) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Previous end can't be the same as next begin",
              // NOTE design has it the other way around
              path: [`${path}.begin`],
            });
          }
          if (lastEnd === 0 || lastEnd > t2) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Previous end must be before next begin",
              // NOTE design has it the other way around
              path: [`${path}.begin`],
            });
          }
        }
        if (lastEnd == null && begin != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Not allowed to add a second time without first",
            path: [`${path}.begin`],
          });
        }
      }

      if (end != null) {
        const t2 = end.hours * 60 + end.minutes;
        lastEnd = t2;
      }
    });
  });
}

function constructApiDate(date: string, time: string): string | null {
  if (date === "" || time === "") {
    return null;
  }
  const d = fromUIDate(date);
  if (!d) {
    return null;
  }
  const d2 = setTimeOnDate(d, time);
  return d2.toISOString();
}

function validateDateTimeInterval({
  beginDate,
  beginTime,
  endDate,
  endTime,
  ctx,
  path,
}: {
  beginDate: string;
  beginTime: string;
  endDate: string;
  endTime: string;
  ctx: z.RefinementCtx;
  path: {
    beginDate: string;
    endDate: string;
    beginTime: string;
    endTime: string;
  };
}) {
  if (beginDate !== "" && beginTime === "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Required",
      path: [path.beginTime],
    });
  }
  if (beginDate === "" && beginTime !== "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Required",
      path: [path.beginDate],
    });
  }

  if (endDate !== "" && endTime === "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Required",
      path: [path.endTime],
    });
  }
  if (endDate === "" && endTime !== "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Required",
      path: [path.endDate],
    });
  }

  // TODO if the above checks fail this doesn't need to be checked, right?
  if (endDate !== "" && beginDate !== "") {
    const begin = constructApiDate(beginDate, beginTime);
    const end = constructApiDate(endDate, endTime);
    if (begin == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date",
        path: [path.beginDate],
      });
    }
    if (end == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date",
        path: [path.endDate],
      });
    }
    if (begin && end && begin >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${path.beginDate} must be before end`,
        path: [path.beginDate],
      });
    }
  }
}

export const ReservationUnitEditSchema = z
  .object({
    authentication: z.nativeEnum(
      ReservationUnitsReservationUnitAuthenticationChoices
    ),
    // TODO these are optional (0 is bit different than not set)
    // because if they are set (non undefined) we should show the active checkbox
    bufferTimeAfter: z.number(),
    bufferTimeBefore: z.number(),
    reservationBlockWholeDay: z
      .literal("no-buffer")
      .or(z.literal("blocks-whole-day"))
      .or(z.literal("buffer-times-set")),
    maxReservationsPerUser: z.number().nullable(),
    maxPersons: z.number().min(0).nullable(),
    minPersons: z.number().min(0).nullable(),
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
    seasons: z.array(SeasonalFormSchema),
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
    if (v.isArchived) {
      return;
    }

    // Drafts also require seasonal times validation
    if (
      v.reservationKind !==
      ReservationUnitsReservationUnitReservationKindChoices.Direct
    ) {
      validateSeasonalTimes(v.seasons, ctx);
    }

    if (v.isDraft) {
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

    if (v.minReservationDuration != null && v.maxReservationDuration != null) {
      if (v.minReservationDuration > v.maxReservationDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Min reservation duration must be less than max duration",
          path: ["maxReservationDuration"],
        });
      }
    }

    if (v.hasScheduledPublish) {
      validateDateTimeInterval({
        beginDate: v.hasPublishBegins ? v.publishBeginsDate : "",
        beginTime: v.hasPublishBegins ? v.publishBeginsTime : "",
        endDate: v.hasPublishEnds ? v.publishEndsDate : "",
        endTime: v.hasPublishEnds ? v.publishEndsTime : "",
        ctx,
        path: {
          beginDate: "publishBeginsDate",
          endDate: "publishEndsDate",
          beginTime: "publishBeginsTime",
          endTime: "publishEndsTime",
        },
      });
    }
    if (v.hasScheduledReservation) {
      validateDateTimeInterval({
        beginDate: v.hasReservationBegins ? v.reservationBeginsDate : "",
        beginTime: v.hasReservationBegins ? v.reservationBeginsTime : "",
        endDate: v.hasReservationEnds ? v.reservationEndsDate : "",
        endTime: v.hasReservationEnds ? v.reservationEndsTime : "",
        ctx,
        path: {
          beginDate: "reservationBeginsDate",
          endDate: "reservationEndsDate",
          beginTime: "reservationBeginsTime",
          endTime: "reservationEndsTime",
        },
      });
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
    checkLengthWithoutHtml(
      v.descriptionEn,
      ctx,
      "descriptionEn",
      1,
      undefined,
      "description"
    );
    checkLengthWithoutHtml(
      v.descriptionFi,
      ctx,
      "descriptionFi",
      1,
      undefined,
      "description"
    );
    checkLengthWithoutHtml(
      v.descriptionSv,
      ctx,
      "descriptionSv",
      1,
      undefined,
      "description"
    );

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

/// Primary use case is to clip out seconds from backend time strings
/// Assumed only to be used for backend time strings which are in format HH:MM or HH:MM:SS
/// NOTE does not handle incorrect time strings (ex. bar:foo)
/// NOTE does not have any boundary checks (ex. 25:99 is allowed)
const convertTime = (t?: string) => {
  if (t == null || t === "") {
    return "";
  }
  // NOTE split has incorrect typing
  const [h, m, _]: Array<string | undefined> = t.split(":");
  return `${h ?? "00"}:${m ?? "00"}`;
};

// Always return all 7 days
// Always return at least one reservableTime
function convertSeasonalList(
  data: NonNullable<ReservationUnitByPkType["applicationRoundTimeSlots"]>
): ReservationUnitEditFormValues["seasons"] {
  const days = [0, 1, 2, 3, 4, 5, 6];
  return days.map((d) => {
    const season = data.find((s) => s.weekday === d);

    const times = filterNonNullable(season?.reservableTimes).map((rt) => ({
      begin: convertTime(rt.begin),
      end: convertTime(rt?.end),
    }));
    return {
      pk: season?.pk ?? 0,
      weekday: d,
      closed: season?.closed ?? false,
      reservableTimes: times.length > 0 ? times : [{ begin: "", end: "" }],
    };
  });
}

export const convertReservationUnit = (
  data?: ReservationUnitByPkType
): ReservationUnitEditFormValues => {
  return {
    reservationBlockWholeDay:
      data?.reservationBlockWholeDay === true
        ? "blocks-whole-day"
        : data?.bufferTimeAfter || data?.bufferTimeBefore
          ? "buffer-times-set"
          : "no-buffer",
    bufferTimeAfter: data?.bufferTimeAfter ?? 0,
    bufferTimeBefore: data?.bufferTimeBefore ?? 0,
    maxReservationsPerUser: data?.maxReservationsPerUser ?? null,
    maxPersons: data?.maxPersons ?? null,
    minPersons: data?.minPersons ?? null,
    maxReservationDuration: data?.maxReservationDuration ?? null,
    minReservationDuration: data?.minReservationDuration ?? null,
    pk: data?.pk ?? 0,
    // Date split for ui components
    publishBeginsDate: data?.publishBegins
      ? format(new Date(data.publishBegins), "d.M.yyyy")
      : "",
    publishBeginsTime: data?.publishBegins
      ? format(new Date(data.publishBegins), "H:mm")
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
    isDraft: data?.isDraft ?? false,
    isArchived: data?.isArchived ?? false,
    seasons: convertSeasonalList(
      filterNonNullable(data?.applicationRoundTimeSlots)
    ),
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
    hasBufferTimeBefore: !!data?.bufferTimeBefore,
    hasBufferTimeAfter: !!data?.bufferTimeAfter,
    hasCancellationRule: data?.cancellationRule != null,
  };
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
    reservationBlockWholeDay,
    bufferTimeAfter,
    bufferTimeBefore,
    cancellationRulePk,
    termsOfUseEn,
    termsOfUseFi,
    termsOfUseSv,
    seasons,
    images, // images are updated with a separate mutation
    ...vals
  } = values;

  const shouldSavePricing = (p: PricingFormValues) =>
    hasFuturePricing ||
    p.status === ReservationUnitsReservationUnitPricingStatusChoices.Active;

  const isReservableTime = (t?: SeasonalFormType["reservableTimes"][0]) =>
    t && t.begin && t.end;
  // NOTE mutation doesn't support pks (even if changing not adding) unlike other mutations
  const applicationRoundTimeSlots = seasons
    .filter(
      (s) => s.reservableTimes.filter(isReservableTime).length > 0 || s.closed
    )
    .map((s) => ({
      weekday: s.weekday,
      closed: s.closed,
      reservableTimes: !s.closed
        ? filterNonNullable(s.reservableTimes.filter(isReservableTime))
        : [],
    }));

  return {
    ...vals,
    ...(pk ? { pk } : {}),
    surfaceArea:
      surfaceArea != null && surfaceArea > 0 ? Math.floor(surfaceArea) : null,
    reservationBegins:
      hasScheduledReservation && hasReservationBegins
        ? constructApiDate(reservationBeginsDate, reservationBeginsTime)
        : null,
    reservationEnds:
      hasScheduledReservation && hasReservationEnds
        ? constructApiDate(reservationEndsDate, reservationEndsTime)
        : null,
    publishBegins:
      hasScheduledPublish && hasPublishBegins
        ? constructApiDate(publishBeginsDate, publishBeginsTime)
        : null,
    publishEnds:
      hasScheduledPublish && hasPublishEnds
        ? constructApiDate(publishEndsDate, publishEndsTime)
        : null,
    reservationBlockWholeDay: reservationBlockWholeDay === "blocks-whole-day",
    bufferTimeAfter,
    bufferTimeBefore,
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
        begins: toApiDate(fromUIDate(p.begins) ?? new Date()) ?? "",
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
    applicationRoundTimeSlots,
  };
}

export function getTranslatedError(t: TFunction, error: string | undefined) {
  if (error == null) {
    return undefined;
  }
  // TODO use a common translation key for these
  return t(`Notifications.form.errors.${error}`);
}
