import { addDays, endOfDay } from "date-fns";
import { z } from "zod";
import { cleanHtmlContent } from "ui/src/components/Sanitize";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import { getIntervalMinutes } from "ui/src/modules/conversion";
import {
  parseApiDate,
  parseUIDate,
  fromUIDateTime,
  timeToMinutes,
  formatApiDate,
  formatDate,
  formatTime,
} from "ui/src/modules/date-utils";
import { convertTime, filterNonNullable, toNumber } from "ui/src/modules/helpers";
import { checkLengthWithoutHtml, checkTimeStringFormat } from "ui/src/schemas/schemaCommon";
import {
  AccessType,
  AuthenticationType,
  ReservationUnitImageType,
  PaymentType,
  PriceUnit,
  ReservationFormType,
  ReservationKind,
  ReservationStartInterval,
  type ReservationUnitEditQuery,
  type ReservationUnitPricingSerializerInput,
  type UpdateApplicationRoundTimeSlotSerializerInput,
  type ReservationUnitAccessTypeSerializerInput,
  Weekday,
} from "@gql/gql-types";
import { type TaxOption } from "./PricingSection";

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

/// @param date string in UI format
/// @returns true if date is in the future
function isAfterToday(date: string) {
  const d = parseUIDate(date);
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
  priceUnit: z.enum(PriceUnit).nullable(),
  paymentType: z.enum(PaymentType).nullable(),
  // NOTE this has to be a string because of HDS date input in ui format: "d.M.yyyy"
  begins: z.string(),
  // frontend only value, otherwise invalid begin values will break future dates
  isFuture: z.boolean(),
  // frontend only value, this is used to control if we should show price section
  isPaid: z.boolean(),
  hasMaterialPrice: z.boolean(),
  materialPriceDescriptionFi: z
    .string()
    .refine((x) => x.length <= 500)
    .transform(cleanHtmlContent),
  materialPriceDescriptionEn: z
    .string()
    .refine((x) => x.length <= 500)
    .transform(cleanHtmlContent),
  materialPriceDescriptionSv: z
    .string()
    .refine((x) => x.length <= 500)
    .transform(cleanHtmlContent),
});

type PricingFormValues = z.infer<typeof PricingFormSchema>;

function validatePricing(data: PricingFormValues | undefined, ctx: z.RefinementCtx, path: string) {
  if (data == null) {
    return;
  }
  if (data.begins === "") {
    ctx.addIssue({
      message: "Required",
      path: [`${path}.begins`],
      code: "custom",
    });
  }
  const date = parseUIDate(data.begins);
  if (date == null || Number.isNaN(date.getTime())) {
    ctx.addIssue({
      message: "Invalid date",
      path: [`${path}.begins`],
      code: "custom",
    });
  }

  if (data.isFuture && date && date <= endOfDay(new Date())) {
    ctx.addIssue({
      message: "Begin needs to be in the future",
      path: [`${path}.begins`],
      code: "custom",
    });
  }

  if (data.isPaid) {
    const { lowestPrice, highestPrice, lowestPriceNet, highestPriceNet } = data;

    if (Number.isNaN(lowestPrice)) {
      ctx.addIssue({
        message: "must be a number",
        path: [`${path}.lowestPrice`],
        code: "custom",
      });
    }
    if (Number.isNaN(highestPrice)) {
      ctx.addIssue({
        message: "must be a number",
        path: [`${path}.highestPrice`],
        code: "custom",
      });
    }
    if (Number.isNaN(lowestPriceNet)) {
      ctx.addIssue({
        message: "must be a number",
        path: [`${path}.lowestPriceNet`],
        code: "custom",
      });
    }
    if (Number.isNaN(highestPriceNet)) {
      ctx.addIssue({
        message: "must be a number",
        path: [`${path}.highestPriceNet`],
        code: "custom",
      });
    }
    if (data.taxPercentage <= 0) {
      ctx.addIssue({
        message: "taxPercentage must be selected",
        path: [`${path}.taxPercentage`],
        code: "custom",
      });
    }
    if (lowestPrice > highestPrice) {
      ctx.addIssue({
        message: "lowestPrice must be lower than highestPrice",
        path: [`${path}.lowestPrice`],
        code: "custom",
      });
    }

    if (!data.paymentType) {
      ctx.addIssue({
        message: "Required",
        path: [`${path}.paymentType`],
        code: "custom",
      });
    }

    if (data.hasMaterialPrice) {
      (["materialPriceDescriptionFi", "materialPriceDescriptionSv", "materialPriceDescriptionEn"] as const).map(
        (fieldName) => {
          if (!data[fieldName]) {
            ctx.addIssue({
              message: "Required",
              path: [`${path}.${fieldName}`],
              code: "custom",
            });
          }
        }
      );
    }
  }
}

const ImageFormSchema = z.object({
  pk: z.number().optional(),
  mediumUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  imageType: z.enum(ReservationUnitImageType).optional(),
  originalImageType: z.enum(ReservationUnitImageType).optional(),
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
  weekday: z.enum(Weekday),
  // unregister leaves undefined in the array
  // undefined => not rendered, not saved
  // empty => rendered as empty, not saved
  // valid => rendered as valid, saved
  reservableTimes: z.array(ReservableTimeSchema.optional()),
});
type SeasonalFormType = z.infer<typeof SeasonalFormSchema>;

const AccessTypesFormSchema = z.object({
  pk: z.number().optional(),
  accessType: z.enum(AccessType),
  beginDate: z.string(),
});
export type AccessTypesFormType = z.infer<typeof AccessTypesFormSchema>;

function validateAccessTypes(accessTypes: AccessTypesFormType[], ctx: z.RefinementCtx): void {
  const seenDates: string[] = [];

  accessTypes.forEach((at, index) => {
    if (parseUIDate(at.beginDate) == null) {
      ctx.addIssue({
        code: "custom",
        message: "access type invalid beginDate",
        path: [`accessTypes.${index}.beginDate`],
      });
    }

    if (seenDates.includes(at.beginDate)) {
      ctx.addIssue({
        code: "custom",
        message: "access type duplicate beginDate",
        path: [`accessTypes.${index}.beginDate`],
      });
    }
    seenDates.push(at.beginDate);
  });
}

function validateSeasonalTimes(data: SeasonalFormType[], ctx: z.RefinementCtx): void {
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
      checkTimeStringFormat(reservableTime?.begin, ctx, `${path}.begin`, "time");
      checkTimeStringFormat(reservableTime?.end, ctx, `${path}.end`, "time");

      const beginTimeMinutes = timeToMinutes(reservableTime.begin);
      const endTimeMinutes = timeToMinutes(reservableTime.end);
      // this corresponds to the backend error: "Timeslot 1 begin and end time must be at 30 minute intervals."
      if (beginTimeMinutes % 30 !== 0) {
        ctx.addIssue({
          code: "custom",
          message: "time must be at 30 minute intervals",
          path: [`${path}.begin`],
        });
      }
      if (endTimeMinutes % 30 !== 0) {
        ctx.addIssue({
          code: "custom",
          message: "time must be at 30 minute intervals",
          path: [`${path}.end`],
        });
      }

      // check that the beginning is before the end
      const t1 = beginTimeMinutes;
      const t2 = endTimeMinutes;
      if (t1 >= t2 && t2 !== 0) {
        ctx.addIssue({
          code: "custom",
          message: "Begin must be before end",
          path: [`${path}.end`],
        });
      }

      // check that the first can't end after the second begins
      if (i > 0) {
        if (lastEnd != null) {
          if (lastEnd === beginTimeMinutes) {
            ctx.addIssue({
              code: "custom",
              message: "Previous end can't be the same as next begin",
              // NOTE design has it the other way around
              path: [`${path}.begin`],
            });
          }
          if (lastEnd === 0 || lastEnd > beginTimeMinutes) {
            ctx.addIssue({
              code: "custom",
              message: "Previous end must be before next begin",
              // NOTE design has it the other way around
              path: [`${path}.begin`],
            });
          }
        }
        if (lastEnd == null) {
          ctx.addIssue({
            code: "custom",
            message: "Not allowed to add a second time without first",
            path: [`${path}.begin`],
          });
        }
      }

      lastEnd = endTimeMinutes;
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
      code: "custom",
      message: "Required",
      path: [path.beginTime],
    });
  }
  if (beginDate === "" && beginTime !== "") {
    ctx.addIssue({
      code: "custom",
      message: "Required",
      path: [path.beginDate],
    });
  }

  if (endDate !== "" && endTime === "") {
    ctx.addIssue({
      code: "custom",
      message: "Required",
      path: [path.endTime],
    });
  }
  if (endDate === "" && endTime !== "") {
    ctx.addIssue({
      code: "custom",
      message: "Required",
      path: [path.endDate],
    });
  }

  const begin = fromUIDateTime(beginDate, beginTime);
  const end = fromUIDateTime(endDate, endTime);
  if (beginDate !== "" && begin == null) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid date",
      path: [path.beginDate],
    });
  }
  if (endDate !== "" && end == null) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid date",
      path: [path.endDate],
    });
  }
  if (begin && end && begin >= end) {
    ctx.addIssue({
      code: "custom",
      message: `${path.beginDate} must be before end`,
      path: [path.beginDate],
    });
  }
}

const bufferTimeSchema = z.literal("noBuffer").or(z.literal("blocksWholeDay")).or(z.literal("bufferTimesSet"));

// Don't enable blocksWholeDay as selectable option for users
// because it doesn't work in customer ui (backend supports it though)
export const BUFFER_TIME_OPTIONS = ["noBuffer", "bufferTimesSet"] as const;

export const ReservationUnitEditSchema = z
  .object({
    authentication: z.enum(AuthenticationType),
    // TODO these are optional (0 is bit different than not set)
    // because if they are set (non undefined) we should show the active checkbox
    bufferTimeAfter: z.number(),
    bufferTimeBefore: z.number(),
    bufferType: bufferTimeSchema,
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
    requireAdultReservee: z.boolean(),
    requireReservationHandling: z.boolean(),
    reservationStartInterval: z.enum(ReservationStartInterval),
    canApplyFreeOfCharge: z.boolean(),
    reservationsMinDaysBefore: z.number(),
    reservationsMaxDaysBefore: z.number(),
    reservationKind: z.enum(ReservationKind),
    contactInformation: z.string(),
    reservationPendingInstructionsFi: z.string().transform(cleanHtmlContent),
    reservationPendingInstructionsEn: z.string().transform(cleanHtmlContent),
    reservationPendingInstructionsSv: z.string().transform(cleanHtmlContent),
    reservationConfirmedInstructionsFi: z.string().transform(cleanHtmlContent),
    reservationConfirmedInstructionsEn: z.string().transform(cleanHtmlContent),
    reservationConfirmedInstructionsSv: z.string().transform(cleanHtmlContent),
    reservationCancelledInstructionsFi: z.string().transform(cleanHtmlContent),
    reservationCancelledInstructionsEn: z.string().transform(cleanHtmlContent),
    reservationCancelledInstructionsSv: z.string().transform(cleanHtmlContent),
    descriptionFi: z.string().max(4000).transform(cleanHtmlContent),
    descriptionEn: z.string().max(4000).transform(cleanHtmlContent),
    descriptionSv: z.string().max(4000).transform(cleanHtmlContent),
    nameFi: z.string().min(1, { message: "Required" }).max(80),
    nameEn: z.string().max(80),
    nameSv: z.string().max(80),
    // backend allows nulls but not empty strings, these are not required though
    notesWhenApplyingFi: z.string().max(2000).transform(cleanHtmlContent),
    notesWhenApplyingEn: z.string().max(2000).transform(cleanHtmlContent),
    notesWhenApplyingSv: z.string().max(2000).transform(cleanHtmlContent),
    spaces: z.array(z.number()),
    resources: z.array(z.number()),
    equipments: z.array(z.number()),
    intendedUses: z.array(z.number()),
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
    reservationForm: z.enum(ReservationFormType).optional(),
    surfaceArea: z.number(),
    images: z.array(ImageFormSchema),
    // internal values
    isDraft: z.boolean(),
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
    accessTypes: z.array(AccessTypesFormSchema),
  })
  .superRefine((v, ctx) => {
    validateAccessTypes(v.accessTypes, ctx);

    // Drafts also require seasonal times validation
    if (v.reservationKind !== ReservationKind.Direct) {
      validateSeasonalTimes(v.seasons, ctx);
    }

    // Drafts require this validation, but only if it's directly bookable
    if (v.reservationKind !== ReservationKind.Season) {
      if (v.minReservationDuration != null && v.maxReservationDuration != null) {
        if (v.minReservationDuration > v.maxReservationDuration) {
          ctx.addIssue({
            code: "custom",
            message: "Min reservation duration must be less than max duration",
            path: ["maxReservationDuration"],
          });
        }
      }

      if (v.minReservationDuration != null) {
        const minDurationMinutes = Math.floor(v.minReservationDuration / 60);
        if (minDurationMinutes < getIntervalMinutes(v.reservationStartInterval)) {
          ctx.addIssue({
            code: "custom",
            message: "duration can't be less than reservation start interval",
            path: ["minReservationDuration"],
          });
        }
        if (minDurationMinutes % getIntervalMinutes(v.reservationStartInterval) !== 0) {
          ctx.addIssue({
            code: "custom",
            message: "duration must be a multiple of the reservation start interval",
            path: ["minReservationDuration"],
          });
        }
      }

      if (v.maxReservationDuration != null) {
        const maxDurationMinutes = Math.floor(v.maxReservationDuration / 60);
        if (maxDurationMinutes % getIntervalMinutes(v.reservationStartInterval) !== 0) {
          ctx.addIssue({
            code: "custom",
            message: "duration must be a multiple of the reservation start interval",
            path: ["maxReservationDuration"],
          });
        }
        if (maxDurationMinutes < getIntervalMinutes(v.reservationStartInterval)) {
          ctx.addIssue({
            code: "custom",
            message: "duration can't be less than reservation start interval",
            path: ["maxReservationDuration"],
          });
        }
      }
    }

    if (!v.isDraft || v.pricings.length) {
      for (let i = 0; i < v.pricings.length; i++) {
        validatePricing(v.pricings[i], ctx, `pricings.${i}`);
      }
    }

    if (v.isDraft) {
      return;
    }

    if (v.accessTypes.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "access types are required for publish",
        path: ["accessTypes"],
      });
    }

    if (v.reservationKind !== ReservationKind.Season) {
      if (v.minReservationDuration == null) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["minReservationDuration"],
        });
      }
      if (v.maxReservationDuration == null) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["maxReservationDuration"],
        });
      }
      if (v.reservationsMinDaysBefore == null) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["reservationsMinDaysBefore"],
        });
      }
      if (v.reservationsMaxDaysBefore == null || v.reservationsMaxDaysBefore === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["reservationsMaxDaysBefore"],
        });
      }
      if (v.reservationStartInterval == null) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["reservationStartInterval"],
        });
      }
      if (v.authentication == null) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["authentication"],
        });
      }
      if (v.reservationForm == null) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: ["reservationForm"],
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
        code: "custom",
        message: "Required",
        path: ["spaces"],
      });
    }
    if (v.reservationUnitType == null) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["reservationUnitType"],
      });
    }
    if (v.nameEn === "") {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["nameEn"],
      });
    }
    if (v.nameSv === "") {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["nameSv"],
      });
    }
    checkLengthWithoutHtml(v.descriptionEn, ctx, "descriptionEn", 1, undefined, "description");
    checkLengthWithoutHtml(v.descriptionFi, ctx, "descriptionFi", 1, undefined, "description");
    checkLengthWithoutHtml(v.descriptionSv, ctx, "descriptionSv", 1, undefined, "description");

    if (v.maxPersons && v.minPersons) {
      if (v.maxPersons < v.minPersons) {
        ctx.addIssue({
          code: "custom",
          message: "Max persons must be greater than min persons",
          path: ["maxPersons"],
        });
      }
    }

    // TODO if it includes futurePricing check that the futurePrice date is in the future (is today ok?)
    const isPaid = v.pricings.some((p) => p.highestPrice > 0);
    if (v.canApplyFreeOfCharge && isPaid && v.pricingTerms == null) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["pricingTerms"],
      });
    }
  });

export type ReservationUnitEditFormValues = z.infer<typeof ReservationUnitEditSchema>;

function convertBegins(begins?: string) {
  const d = begins != null && begins !== "" ? parseApiDate(begins) : undefined;
  const today = new Date();
  if (d != null) {
    return formatDate(d);
  }
  return formatDate(today);
}

type PricingNode = NonNullable<Node["pricings"]>[0];

function convertPricing(p?: PricingNode): PricingFormValues {
  const lowestPriceNet = Math.floor(100 * (toNumber(p?.lowestPriceNet) ?? 0)) / 100;
  const highestPriceNet = Math.floor(100 * (toNumber(p?.highestPriceNet) ?? 0)) / 100;
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
    paymentType: p?.paymentType ?? null,
    begins: convertBegins(p?.begins),
    hasMaterialPrice: !!p?.materialPriceDescriptionFi,
    materialPriceDescriptionFi: p?.materialPriceDescriptionFi ?? "",
    materialPriceDescriptionEn: p?.materialPriceDescriptionEn ?? "",
    materialPriceDescriptionSv: p?.materialPriceDescriptionSv ?? "",
  };
}

function convertPricingList(pricings: PricingNode[]): PricingFormValues[] {
  // NOTE Even though the frontend doesn't support adding more than two prices we can show / save more
  const convertedPrices = pricings.map(convertPricing);
  const activePrices = convertedPrices.filter((p) => !p.isFuture);
  const futurePrices = convertedPrices.filter((p) => p.isFuture);

  const activePrice = activePrices[activePrices.length - 1];
  // query data includes all past pricings also, remove them
  const prices = activePrice != null ? [activePrice, ...futurePrices] : convertedPrices;

  // Always include at least two pricings in the form data (the frontend doesn't support dynamic adding)
  // negative pk for new pricings
  let rollingIndex = -1;
  while (prices.length < 2 || !prices.some((p) => p?.isFuture)) {
    // if we need to add first price, it's always current
    const isFuture = prices.length > 0;
    const begins = prices.length === 0 ? formatDate(new Date()) : formatDate(addDays(new Date(), 1));

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
      paymentType: null,
      begins,
      hasMaterialPrice: false,
      materialPriceDescriptionFi: "",
      materialPriceDescriptionEn: "",
      materialPriceDescriptionSv: "",
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
  return WEEKDAYS_SORTED.map((weekday) => {
    const season = data.find((s) => s.weekday === weekday);
    const times = filterNonNullable(season?.reservableTimes).map((reservableTimes) => ({
      begin: convertTime(reservableTimes.begin),
      end: convertTime(reservableTimes.end),
    }));

    return {
      pk: season?.pk ?? 0,
      weekday: weekday,
      closed: season?.isClosed ?? false,
      reservableTimes: times.length > 0 ? times : [{ begin: "", end: "" }],
    };
  });
}

function convertAccessTypes(accessTypes: NonNullable<Node["accessTypes"]>): AccessTypesFormType[] {
  return accessTypes.map((at) => ({
    pk: at?.pk ?? undefined,
    accessType: at.accessType,
    beginDate: convertBegins(at.beginDate),
  }));
}

export function convertReservationUnit(data?: Node): ReservationUnitEditFormValues {
  // Convert from API data to form values
  return {
    bufferType:
      data?.reservationBlockWholeDay === true
        ? "blocksWholeDay"
        : data?.bufferTimeAfter || data?.bufferTimeBefore
          ? "bufferTimesSet"
          : "noBuffer",
    bufferTimeAfter: data?.bufferTimeAfter ?? 0,
    bufferTimeBefore: data?.bufferTimeBefore ?? 0,
    maxReservationsPerUser: data?.maxReservationsPerUser ?? null,
    maxPersons: data?.maxPersons ?? null,
    minPersons: data?.minPersons ?? null,
    maxReservationDuration: data?.maxReservationDuration ?? null,
    minReservationDuration: data?.minReservationDuration ?? null,
    pk: data?.pk ?? 0,
    // Date split for ui components
    publishBeginsDate: data?.publishBeginsAt ? formatDate(new Date(data.publishBeginsAt)) : "",
    publishBeginsTime: data?.publishBeginsAt ? formatTime(new Date(data.publishBeginsAt)) : "",
    publishEndsDate: data?.publishEndsAt ? formatDate(new Date(data.publishEndsAt)) : "",
    publishEndsTime: data?.publishEndsAt ? formatTime(new Date(data.publishEndsAt)) : "",
    reservationBeginsDate: data?.reservationBeginsAt ? formatDate(new Date(data.reservationBeginsAt)) : "",
    reservationBeginsTime: data?.reservationBeginsAt ? formatTime(new Date(data.reservationBeginsAt)) : "",
    reservationEndsDate: data?.reservationEndsAt ? formatDate(new Date(data.reservationEndsAt)) : "",
    reservationEndsTime: data?.reservationEndsAt ? formatTime(new Date(data.reservationEndsAt)) : "",
    requireAdultReservee: data?.requireAdultReservee ?? false,
    requireReservationHandling: data?.requireReservationHandling ?? false,
    reservationStartInterval: data?.reservationStartInterval ?? ReservationStartInterval.Interval_15Minutes,
    canApplyFreeOfCharge: data?.canApplyFreeOfCharge ?? false,
    reservationsMinDaysBefore: data?.reservationsMinDaysBefore ?? 0,
    reservationsMaxDaysBefore: data?.reservationsMaxDaysBefore ?? 0,
    reservationKind: data?.reservationKind ?? ReservationKind.DirectAndSeason,
    contactInformation: data?.contactInformation ?? "",
    reservationPendingInstructionsFi: data?.reservationPendingInstructionsFi ?? "",
    reservationPendingInstructionsEn: data?.reservationPendingInstructionsEn ?? "",
    reservationPendingInstructionsSv: data?.reservationPendingInstructionsSv ?? "",
    reservationConfirmedInstructionsFi: data?.reservationConfirmedInstructionsFi ?? "",
    reservationConfirmedInstructionsEn: data?.reservationConfirmedInstructionsEn ?? "",
    reservationConfirmedInstructionsSv: data?.reservationConfirmedInstructionsSv ?? "",
    reservationCancelledInstructionsFi: data?.reservationCancelledInstructionsFi ?? "",
    reservationCancelledInstructionsEn: data?.reservationCancelledInstructionsEn ?? "",
    reservationCancelledInstructionsSv: data?.reservationCancelledInstructionsSv ?? "",
    descriptionFi: data?.descriptionFi ?? "",
    descriptionEn: data?.descriptionEn ?? "",
    descriptionSv: data?.descriptionSv ?? "",
    nameFi: data?.nameFi ?? "",
    nameEn: data?.nameEn ?? "",
    nameSv: data?.nameSv ?? "",
    notesWhenApplyingFi: data?.notesWhenApplyingFi ?? "",
    notesWhenApplyingEn: data?.notesWhenApplyingEn ?? "",
    notesWhenApplyingSv: data?.notesWhenApplyingSv ?? "",
    spaces: filterNonNullable(data?.spaces?.map((s) => s?.pk)),
    resources: filterNonNullable(data?.resources?.map((r) => r?.pk)),
    equipments: filterNonNullable(data?.equipments?.map((e) => e?.pk)),
    intendedUses: filterNonNullable(data?.intendedUses?.map((p) => p?.pk)),
    surfaceArea: data?.surfaceArea ?? 0,
    authentication: data?.authentication ?? AuthenticationType.Weak,
    reservationUnitType: data?.reservationUnitType?.pk ?? null,
    reservationForm: data?.reservationForm,
    paymentTerms: data?.paymentTerms?.pk ?? null,
    pricingTerms: data?.pricingTerms?.pk ?? null,
    serviceSpecificTerms: data?.serviceSpecificTerms?.pk ?? null,
    cancellationTerms: data?.cancellationTerms?.pk ?? null,
    cancellationRule: data?.cancellationRule?.pk ?? null,
    pricings: convertPricingList(filterNonNullable(data?.pricings)),
    images: filterNonNullable(data?.images).map((i) => convertImage(i)),
    isDraft: data?.isDraft ?? false,
    seasons: convertSeasonalList(filterNonNullable(data?.applicationRoundTimeSlots)),
    hasFuturePricing: data?.pricings?.some((p) => new Date(p.begins) > new Date()) ?? false,
    hasScheduledPublish: data?.publishBeginsAt != null || data?.publishEndsAt != null,
    hasScheduledReservation: data?.reservationBeginsAt != null || data?.reservationEndsAt != null,
    hasPublishBegins: data?.publishBeginsAt != null,
    hasPublishEnds: data?.publishEndsAt != null,
    hasReservationBegins: data?.reservationBeginsAt != null,
    hasReservationEnds: data?.reservationEndsAt != null,
    hasBufferTimeBefore: !!data?.bufferTimeBefore,
    hasBufferTimeAfter: !!data?.bufferTimeAfter,
    hasCancellationRule: data?.cancellationRule != null,
    accessTypes: convertAccessTypes(filterNonNullable(data?.accessTypes)),
  };
}

// Too hard to type this because of two separate mutations that have optional fields in them
export function transformReservationUnit(values: ReservationUnitEditFormValues, taxPercentageOptions: TaxOption[]) {
  // Convert from form values to API data
  const {
    pk,
    isDraft,
    surfaceArea,
    reservationKind,
    reservationEndsDate,
    reservationEndsTime,
    reservationBeginsDate,
    reservationBeginsTime,
    publishBeginsDate,
    publishBeginsTime,
    publishEndsDate,
    publishEndsTime,
    minReservationDuration,
    maxReservationDuration,
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
    bufferType,
    bufferTimeAfter,
    bufferTimeBefore,
    cancellationRule,
    seasons,
    accessTypes: accessTypesForm,
    images, // images are updated with a separate mutation
    ...vals
  } = values;

  const isReservableTime = (t?: SeasonalFormType["reservableTimes"][0]) => t && t.begin && t.end;
  // NOTE mutation doesn't support pks (even if changing not adding) unlike other mutations
  const applicationRoundTimeSlots: UpdateApplicationRoundTimeSlotSerializerInput[] = seasons
    .filter((s) => s.reservableTimes.filter(isReservableTime).length > 0 || s.closed)
    .map((s) => ({
      weekday: s.weekday,
      isClosed: s.closed,
      reservableTimes: !s.closed ? filterNonNullable(s.reservableTimes.filter(isReservableTime)) : [],
    }));

  function maybeToApiDateTime(date: string, time: string): string | null {
    const d = fromUIDateTime(date, time);
    return d != null ? d.toISOString() : null;
  }
  const accessTypes: ReservationUnitAccessTypeSerializerInput[] = filterNonNullable(
    accessTypesForm.map((at) => ({
      pk: at.pk,
      accessType: at.accessType,
      beginDate: formatApiDate(parseUIDate(at.beginDate) || new Date()) || "",
    }))
  );

  return {
    ...vals,
    ...(pk > 0 ? { pk } : {}),
    name: vals.nameFi.trim(),
    surfaceArea: surfaceArea != null && surfaceArea > 0 ? Math.floor(surfaceArea) : null,
    reservationBeginsAt:
      hasScheduledReservation && hasReservationBegins
        ? maybeToApiDateTime(reservationBeginsDate, reservationBeginsTime)
        : null,
    reservationEndsAt:
      hasScheduledReservation && hasReservationEnds
        ? maybeToApiDateTime(reservationEndsDate, reservationEndsTime)
        : null,
    publishBeginsAt:
      hasScheduledPublish && hasPublishBegins ? maybeToApiDateTime(publishBeginsDate, publishBeginsTime) : null,
    publishEndsAt: hasScheduledPublish && hasPublishEnds ? maybeToApiDateTime(publishEndsDate, publishEndsTime) : null,
    // Set min/max reservation duration to null if ReservationKind is Season
    // (They are not used and can cause errors if reservation interval is changed)
    minReservationDuration: reservationKind !== ReservationKind.Season ? minReservationDuration : null,
    maxReservationDuration: reservationKind !== ReservationKind.Season ? maxReservationDuration : null,
    reservationBlockWholeDay: bufferType === "blocksWholeDay",
    bufferTimeAfter: hasBufferTimeAfter && bufferType === "bufferTimesSet" ? bufferTimeAfter : 0,
    bufferTimeBefore: hasBufferTimeBefore && bufferType === "bufferTimesSet" ? bufferTimeBefore : 0,
    reservationKind,
    isDraft,
    cancellationRule: hasCancellationRule ? cancellationRule : null,
    pricings: filterNonNullable(pricings.map((p) => transformPricing(p, hasFuturePricing, taxPercentageOptions))),
    accessTypes,
    applicationRoundTimeSlots,
  };
}

function transformPricing(
  values: PricingFormValues,
  hasFuturePricing: boolean,
  taxPercentageOptions: TaxOption[]
): ReservationUnitPricingSerializerInput | null {
  if (!hasFuturePricing && isAfterToday(values.begins)) {
    return null;
  }
  // without a valid taxPrecentage mutation fails even if it's free pricing
  // but we don't have a valid taxPercentage for free pricings (user has made no selection)
  const taxPercentage = values.taxPercentage > 0 ? values.taxPercentage : (taxPercentageOptions[0]?.pk ?? 0);
  if (taxPercentage === 0) {
    throw new Error("Tax percentage is required for pricing");
  }

  const begins = parseUIDate(values.begins) ?? new Date();
  return {
    taxPercentage,
    begins: formatApiDate(begins) ?? "",
    highestPrice: values.isPaid ? values.highestPrice.toString() : "0",
    lowestPrice: values.isPaid ? values.lowestPrice.toString() : "0",
    ...(values.pk > 0 ? { pk: values.pk } : {}),
    ...(values.priceUnit != null ? { priceUnit: values.priceUnit } : {}),
    ...(values.paymentType != null ? { paymentType: values.paymentType } : {}),
    materialPriceDescriptionFi: values.hasMaterialPrice ? values.materialPriceDescriptionFi : "",
    materialPriceDescriptionEn: values.hasMaterialPrice ? values.materialPriceDescriptionEn : "",
    materialPriceDescriptionSv: values.hasMaterialPrice ? values.materialPriceDescriptionSv : "",
  };
}
