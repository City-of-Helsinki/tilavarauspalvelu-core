import { convertTime, filterNonNullable, toNumber } from "common/src/helpers";
import {
  fromApiDate,
  fromUIDate,
  toUIDate,
  toApiDate,
} from "common/src/common/util";
import {
  ReservationStartInterval,
  Authentication,
  ReservationKind,
  PriceUnit,
  ImageType,
  type ReservationUnitEditQuery,
  type ReservationUnitPricingSerializerInput,
} from "@gql/gql-types";
import { addDays, endOfDay, format } from "date-fns";
import { z } from "zod";
import {
  checkLengthWithoutHtml,
  checkTimeStringFormat,
} from "common/src/schemas/schemaCommon";
import { constructApiDate } from "@/helpers";
import { intervalToNumber } from "@/schemas/utils";

export const PaymentTypes = ["ONLINE", "INVOICE", "ON_SITE"] as const;

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

/// @param date string in UI format
/// @returns true if date is in the future
function isAfterToday(date: string) {
  const d = fromUIDate(date);
  if (d == null) {
    return false;
  }
  return d > endOfDay(new Date());
}

const PricingFormSchema = z.object({
  // pk === 0 fails silently on the backend, but undefined creates a new pricing
  // on the frontend pk <= 0 is a new pricing
  pk: z.number(),
  taxPercentage: z.number(),
  // TODO could remove the net value and keep only the gross price
  // the net is never sent to backend (but we want to keep it in the UI)
  lowestPrice: z.number(),
  lowestPriceNet: z.number(),
  highestPrice: z.number(),
  highestPriceNet: z.number(),
  priceUnit: z.nativeEnum(PriceUnit).nullable(),
  // NOTE this has to be a string because of HDS date input in ui format: "d.M.yyyy"
  begins: z.string(),
  // frontend only value, otherwise invalid begin values will break future dates
  isFuture: z.boolean(),
  // frontend only value, this is used to control if we should show price section
  isPaid: z.boolean(),
});

type PricingFormValues = z.infer<typeof PricingFormSchema>;

function refinePricing(
  data: PricingFormValues,
  ctx: z.RefinementCtx,
  path: string
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

  if (data.isFuture && date && date <= endOfDay(new Date())) {
    ctx.addIssue({
      message: "Begin needs to be in the future",
      path: [`${path}.begins`],
      code: z.ZodIssueCode.custom,
    });
  }

  if (data.isPaid) {
    const { lowestPrice, highestPrice, lowestPriceNet, highestPriceNet } = data;

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
    if (data.taxPercentage <= 0) {
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
}

const ImageFormSchema = z.object({
  pk: z.number().optional(),
  mediumUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  imageType: z.nativeEnum(ImageType).optional(),
  originalImageType: z.nativeEnum(ImageType).optional(),
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
      if (!Number.isNaN(begin.minutes) && !Number.isNaN(begin.hours)) {
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
        if (lastEnd == null && !Number.isNaN(begin.minutes)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Not allowed to add a second time without first",
            path: [`${path}.begin`],
          });
        }
      }

      if (!Number.isNaN(begin.hours)) {
        const t2 = end.hours * 60 + end.minutes;
        lastEnd = t2;
      }
    });
  });
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
    authentication: z.nativeEnum(Authentication),
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
    reservationStartInterval: z.nativeEnum(ReservationStartInterval),
    canApplyFreeOfCharge: z.boolean(),
    reservationsMinDaysBefore: z.number(),
    reservationsMaxDaysBefore: z.number(),
    reservationKind: z.nativeEnum(ReservationKind),
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
    termsOfUseFi: z.string().max(2000),
    termsOfUseEn: z.string().max(2000),
    termsOfUseSv: z.string().max(2000),
    spaces: z.array(z.number()),
    resources: z.array(z.number()),
    equipments: z.array(z.number()),
    purposes: z.array(z.number()),
    qualifiers: z.array(z.number()),
    paymentTypes: z.array(z.string()),
    pricings: z.array(PricingFormSchema),
    seasons: z.array(SeasonalFormSchema),
    // "Not draft reservation unit must have a reservation unit type."
    reservationUnitType: z.number().nullable(),
    cancellationRule: z.number().nullable(),
    // Terms pks are actually slugs
    paymentTerms: z.string().nullable(),
    pricingTerms: z.string().nullable(),
    cancellationTerms: z.string().nullable(),
    serviceSpecificTerms: z.string().nullable(),
    metadataSet: z.number().nullable(),
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
    if (v.reservationKind !== ReservationKind.Direct) {
      validateSeasonalTimes(v.seasons, ctx);
    }

    // Drafts require this validation
    if (v.minReservationDuration != null && v.maxReservationDuration != null) {
      if (v.minReservationDuration > v.maxReservationDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Min reservation duration must be less than max duration",
          path: ["maxReservationDuration"],
        });
      }
    }

    if (v.minReservationDuration != null) {
      const minDurationMinutes = Math.floor(v.minReservationDuration / 60);
      if (minDurationMinutes < intervalToNumber(v.reservationStartInterval)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "duration can't be less than reservation start interval",
          path: ["minReservationDuration"],
        });
      }
      if (
        minDurationMinutes % intervalToNumber(v.reservationStartInterval) !==
        0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "duration must be a multiple of the reservation start interval",
          path: ["minReservationDuration"],
        });
      }
    }

    if (v.maxReservationDuration != null) {
      const maxDurationMinutes = Math.floor(v.maxReservationDuration / 60);
      if (
        maxDurationMinutes % intervalToNumber(v.reservationStartInterval) !==
        0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "duration must be a multiple of the reservation start interval",
          path: ["maxReservationDuration"],
        });
      }
      if (maxDurationMinutes < intervalToNumber(v.reservationStartInterval)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "duration can't be less than reservation start interval",
          path: ["maxReservationDuration"],
        });
      }
    }

    if (v.isDraft) {
      return;
    }

    if (v.reservationKind !== ReservationKind.Season) {
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
      if (v.metadataSet == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required",
          path: ["metadataSet"],
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
    if (v.spaces.length === 0 && v.resources.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["spaces"],
      });
    }
    if (v.reservationUnitType == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["reservationUnitType"],
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
    for (let i = 0; i < v.pricings.length; i++) {
      const p = v.pricings[i];
      refinePricing(p, ctx, `pricings.${i}`);
    }

    // TODO if it includes futurePricing check that the futurePrice date is in the future (is today ok?)
    const isPaid = v.pricings.some((p) => p.highestPrice > 0);
    if (isPaid && v.paymentTypes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Required",
        path: ["paymentTypes"],
      });
    }
    if (v.canApplyFreeOfCharge && isPaid && v.pricingTerms == null) {
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

function convertBegins(begins?: string) {
  const d = begins != null && begins !== "" ? fromApiDate(begins) : undefined;
  const today = new Date();
  if (d != null) {
    return toUIDate(d);
  }
  return toUIDate(today);
}

type PricingNode = NonNullable<Node["pricings"]>[0];
function convertPricing(p?: PricingNode): PricingFormValues {
  const lowestPriceNet =
    Math.floor(100 * (toNumber(p?.lowestPriceNet) ?? 0)) / 100;
  const highestPriceNet =
    Math.floor(100 * (toNumber(p?.highestPriceNet) ?? 0)) / 100;
  return {
    pk: p?.pk ?? 0,
    taxPercentage: p?.taxPercentage?.pk ?? 0,
    lowestPrice: toNumber(p?.lowestPrice) ?? 0,
    highestPrice: toNumber(p?.highestPrice) ?? 0,
    lowestPriceNet,
    highestPriceNet,
    isPaid: (toNumber(p?.highestPrice) ?? 0) > 0,
    isFuture: new Date(p?.begins ?? "") > new Date(),
    priceUnit: p?.priceUnit ?? null,
    begins: convertBegins(p?.begins),
  };
}

function convertPricingList(pricings: PricingNode[]): PricingFormValues[] {
  // NOTE Even though the frontend doesn't support adding more than two prices we can show / save more
  const convertedPrices = pricings.map(convertPricing);
  const activePrices = convertedPrices.filter((p) => !p.isFuture);
  const futurePrices = convertedPrices.filter((p) => p.isFuture);

  // query data includes all past pricings also, remove them
  const prices =
    activePrices.length > 1
      ? [activePrices[activePrices.length - 1], ...futurePrices]
      : convertedPrices;

  // Always include at least two pricings in the form data (the frontend doesn't support dynamic adding)
  // negative pk for new pricings
  let rollingIndex = -1;
  while (prices.length < 2 || !prices.some((p) => p.isFuture)) {
    // if we need to add first price, it's always current
    const isFuture = prices.length > 0;
    const begins =
      prices.length === 0
        ? toUIDate(new Date())
        : toUIDate(addDays(new Date(), 1));

    prices.push({
      pk: rollingIndex--,
      taxPercentage: 0,
      lowestPrice: 0,
      lowestPriceNet: 0,
      highestPrice: 0,
      highestPriceNet: 0,
      isFuture,
      isPaid: false,
      priceUnit: null,
      begins,
    });
  }
  return prices;
}

function convertImage(image?: Node["images"][0]): ImageFormType {
  return {
    pk: image?.pk ?? 0,
    imageUrl: image?.imageUrl ?? undefined,
    mediumUrl: image?.mediumUrl ?? undefined,
    imageType: image?.imageType ?? undefined,
    originalImageType: image?.imageType ?? undefined,
    bytes: undefined,
  };
}

// Always return all 7 days
// Always return at least one reservableTime
function convertSeasonalList(
  data: NonNullable<Node["applicationRoundTimeSlots"]>
): ReservationUnitEditFormValues["seasons"] {
  const days = [0, 1, 2, 3, 4, 5, 6];
  return days.map((d) => {
    const season = data.find((s) => s.weekday === d);

    const times = filterNonNullable(season?.reservableTimes).map((rt) => ({
      begin: convertTime(rt.begin),
      end: convertTime(rt.end),
    }));
    return {
      pk: season?.pk ?? 0,
      weekday: d,
      closed: season?.closed ?? false,
      reservableTimes: times.length > 0 ? times : [{ begin: "", end: "" }],
    };
  });
}

export function convertReservationUnit(
  data?: Node
): ReservationUnitEditFormValues {
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
      ReservationStartInterval.Interval_15Mins,
    canApplyFreeOfCharge: data?.canApplyFreeOfCharge ?? false,
    reservationsMinDaysBefore: data?.reservationsMinDaysBefore ?? 0,
    reservationsMaxDaysBefore: data?.reservationsMaxDaysBefore ?? 0,
    reservationKind: data?.reservationKind ?? ReservationKind.DirectAndSeason,
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
    spaces: filterNonNullable(data?.spaces?.map((s) => s?.pk)),
    resources: filterNonNullable(data?.resources?.map((r) => r?.pk)),
    equipments: filterNonNullable(data?.equipments?.map((e) => e?.pk)),
    purposes: filterNonNullable(data?.purposes?.map((p) => p?.pk)),
    qualifiers: filterNonNullable(data?.qualifiers?.map((q) => q?.pk)),
    surfaceArea: data?.surfaceArea ?? 0,
    authentication: data?.authentication ?? Authentication.Weak,
    reservationUnitType: data?.reservationUnitType?.pk ?? null,
    metadataSet: data?.metadataSet?.pk ?? null,
    paymentTerms: data?.paymentTerms?.pk ?? null,
    pricingTerms: data?.pricingTerms?.pk ?? null,
    serviceSpecificTerms: data?.serviceSpecificTerms?.pk ?? null,
    cancellationTerms: data?.cancellationTerms?.pk ?? null,
    cancellationRule: data?.cancellationRule?.pk ?? null,
    paymentTypes: filterNonNullable(data?.paymentTypes?.map((pt) => pt?.code)),
    pricings: convertPricingList(filterNonNullable(data?.pricings)),
    images: filterNonNullable(data?.images).map((i) => convertImage(i)),
    isDraft: data?.isDraft ?? false,
    isArchived: false,
    seasons: convertSeasonalList(
      filterNonNullable(data?.applicationRoundTimeSlots)
    ),
    hasFuturePricing:
      data?.pricings?.some((p) => new Date(p.begins) > new Date()) ?? false,
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
}

// Too hard to type this because of two separate mutations that have optional fields in them
export function transformReservationUnit(
  values: ReservationUnitEditFormValues
) {
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
    cancellationRule,
    termsOfUseEn,
    termsOfUseFi,
    termsOfUseSv,
    seasons,
    images, // images are updated with a separate mutation
    ...vals
  } = values;

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
    ...(pk > 0 ? { pk } : {}),
    name: vals.nameFi.trim(),
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
    bufferTimeAfter:
      hasBufferTimeAfter && reservationBlockWholeDay === "buffer-times-set"
        ? bufferTimeAfter
        : 0,
    bufferTimeBefore:
      hasBufferTimeBefore && reservationBlockWholeDay === "buffer-times-set"
        ? bufferTimeBefore
        : 0,
    isDraft,
    isArchived,
    termsOfUseEn: termsOfUseEn !== "" ? termsOfUseEn : null,
    termsOfUseFi: termsOfUseFi !== "" ? termsOfUseFi : null,
    termsOfUseSv: termsOfUseSv !== "" ? termsOfUseSv : null,
    cancellationRule: hasCancellationRule ? cancellationRule : null,
    pricings: filterNonNullable(
      pricings.map((p) => transformPricing(p, hasFuturePricing))
    ),
    applicationRoundTimeSlots,
  };
}

function transformPricing(
  p: PricingFormValues,
  hasFuturePricing: boolean
): ReservationUnitPricingSerializerInput | null {
  if (!hasFuturePricing && isAfterToday(p.begins)) {
    return null;
  }
  const begins = fromUIDate(p.begins) ?? new Date();
  return {
    ...(p.taxPercentage > 0 ? { taxPercentage: p.taxPercentage } : {}),
    begins: toApiDate(begins) ?? "",
    highestPrice: p.isPaid ? p.highestPrice.toString() : "0",
    lowestPrice: p.isPaid ? p.lowestPrice.toString() : "0",
    ...(p.pk > 0 ? { pk: p.pk } : {}),
    ...(p.priceUnit != null ? { priceUnit: p.priceUnit } : {}),
  };
}
