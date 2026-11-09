import { addDays, endOfDay } from "date-fns";
import { z } from "zod";
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
import {
  cleanHtmlContent,
  convertTime,
  filterNonNullable,
  formatWhitespace,
  stripHtml,
  toNumber,
} from "ui/src/modules/helpers";
import { checkTimeStringFormat } from "ui/src/schemas/schemaCommon";
import {
  AccessType,
  AuthenticationType,
  ReservationUnitImageType,
  PaymentType,
  PriceUnit,
  ReservationFormType,
  ReservationKind,
  ReservationStartInterval,
  Weekday,
} from "@gql/gql-types";
import type {
  OwnPricingInputSerializerInput,
  ReservationUnitEditQuery,
  UpdateApplicationRoundTimeSlotSerializerInput,
  ReservationUnitAccessTypeSerializerInput,
} from "@gql/gql-types";
import { getOwnPricings } from "./pricing";
import type { OwnPriceComponent } from "./pricing";
import type { TaxLevelOption } from "./PricingSection";

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

const cleanHtmlWhitespace = (str: string) => {
  return cleanHtmlContent(formatWhitespace(str));
};

const PricingFormSchema = z.object({
  // pk === 0 fails silently on the backend, but undefined creates a new pricing
  // on the frontend pk <= 0 is a new pricing
  pk: z.number(),
  // The saved price in effect today. The backend does not allow changes to it.
  isReadOnly: z.boolean(),
  taxLevel: z.number(),
  salesItem: z.number().nullable(),
  price: z.number({ error: "Required" }),
  priceUnit: z.enum(PriceUnit).nullable(),
  canApplyForDiscount: z.boolean(),
  // NOTE this has to be a string because of HDS date input in ui format: "d.M.yyyy"
  begins: z.string(),
  // frontend only value, otherwise invalid begin values will break future dates
  isFuture: z.boolean(),
  // frontend only value, this is used to control if we should show price section
  // A new price has no choice, so that it is not saved as free by accident
  isPaid: z.boolean().nullable(),
  hasMaterialPrice: z.boolean(),
  materialPriceDescriptionFi: z
    .string()
    .transform(cleanHtmlWhitespace)
    .refine((x) => stripHtml(x).length <= 500, { message: "Too big. expected string to have <=500 characters" }),
  materialPriceDescriptionEn: z
    .string()
    .transform(cleanHtmlWhitespace)
    .refine((x) => stripHtml(x).length <= 500, { message: "Too big. expected string to have <=500 characters" }),
  materialPriceDescriptionSv: z
    .string()
    .transform(cleanHtmlWhitespace)
    .refine((x) => stripHtml(x).length <= 500, { message: "Too big. expected string to have <=500 characters" }),
});

type PricingFormValues = z.infer<typeof PricingFormSchema>;

function validatePricing(data: PricingFormValues | undefined, ctx: z.RefinementCtx, path: string) {
  if (data == null || data.isReadOnly) {
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
  // A saved price can only begin in the future, so a new current price begins today or earlier
  if (!data.isFuture && date && date > endOfDay(new Date())) {
    ctx.addIssue({
      message: "Begin can't be in the future",
      path: [`${path}.begins`],
      code: "custom",
    });
  }

  if (data.isPaid) {
    if (Number.isNaN(data.price)) {
      ctx.addIssue({
        message: "must be a number",
        path: [`${path}.price`],
        code: "custom",
      });
    }
    if (data.taxLevel <= 0) {
      ctx.addIssue({
        message: "taxLevel must be selected",
        path: [`${path}.taxLevel`],
        code: "custom",
      });
    }
    if (data.priceUnit == null) {
      ctx.addIssue({
        message: "Required",
        path: [`${path}.priceUnit`],
        code: "custom",
      });
    }

    if (data.hasMaterialPrice) {
      for (const fieldName of [
        "materialPriceDescriptionFi",
        "materialPriceDescriptionSv",
        "materialPriceDescriptionEn",
      ] as const) {
        if (stripHtml(data[fieldName]).length === 0) {
          ctx.addIssue({
            message: "Required",
            path: [`${path}.${fieldName}`],
            code: "custom",
          });
        }
      }
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

  for (const at of accessTypes) {
    const index = accessTypes.indexOf(at);
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
  }
}

function validateSeasonalTimes(data: SeasonalFormType[], ctx: z.RefinementCtx): void {
  for (const season of data) {
    const index = data.indexOf(season);
    // closed don't need validation (time is not saved)
    if (season.closed) {
      continue;
    }
    // pass empties and "" because they are never sent
    let lastEnd: number | null = null;
    for (const reservableTime of season.reservableTimes) {
      const i = season.reservableTimes.indexOf(reservableTime);
      if (reservableTime == null) {
        continue;
      }
      // check both begin and end
      if (reservableTime.begin == null && reservableTime.end == null) {
        continue;
      }
      if (reservableTime.begin === "" && reservableTime.end === "") {
        continue;
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
    }
  }
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
    reservationsMinDaysBefore: z.number({ error: "Required" }),
    reservationsMaxDaysBefore: z.number(),
    reservationKind: z.enum(ReservationKind),
    contactInformation: z.string().max(500, { message: "Too big. expected string to have <=500 characters" }),
    reservationPendingInstructionsFi: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    reservationPendingInstructionsEn: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    reservationPendingInstructionsSv: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    reservationConfirmedInstructionsEn: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    reservationConfirmedInstructionsFi: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    reservationConfirmedInstructionsSv: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    reservationCancelledInstructionsFi: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    reservationCancelledInstructionsEn: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    reservationCancelledInstructionsSv: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    descriptionFi: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    descriptionEn: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    descriptionSv: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 4000, { message: "Too big. expected string to have <=4000 characters" }),
    nameFi: z.string().min(1, { message: "Required" }).max(80),
    nameEn: z.string().max(80),
    nameSv: z.string().max(80),
    // backend allows nulls but not empty strings, these are not required though
    notesWhenApplyingFi: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 2000, { message: "Too big. expected string to have <=2000 characters" }),
    notesWhenApplyingEn: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 2000, { message: "Too big. expected string to have <=2000 characters" }),
    notesWhenApplyingSv: z
      .string()
      .transform(cleanHtmlWhitespace)
      .refine((x) => stripHtml(x).length <= 2000, { message: "Too big. expected string to have <=2000 characters" }),
    spaces: z.array(z.number()).refine((x) => x.length > 0, { message: "Required" }),
    resources: z.array(z.number()),
    equipments: z.array(z.number()),
    intendedUses: z.array(z.number()),
    pricings: z.array(PricingFormSchema),
    paymentType: z.enum(PaymentType).nullable(),
    seasons: z.array(SeasonalFormSchema),
    // "Not draft reservation unit must have a reservation unit type."
    reservationUnitType: z.number().nullable(),
    cancellationRule: z.number().nullable(),
    // Terms pks are actually slugs
    paymentTerms: z.string().prefault("").nonoptional(),
    pricingTerms: z.string().nullable(),
    cancellationTerms: z.string().prefault("").nonoptional(),
    serviceSpecificTerms: z.string().prefault("").nonoptional(),
    reservationForm: z.enum(ReservationFormType).optional(),
    surfaceArea: z.number({ error: "Required" }),
    images: z.array(ImageFormSchema),
    // internal values
    isDraft: z.boolean(),
    // The prices of a shared pricing group are not edited in this form
    isSharedPricingGroup: z.boolean(),
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
      if (
        v.minReservationDuration != null &&
        v.maxReservationDuration != null &&
        v.minReservationDuration > v.maxReservationDuration
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Min reservation duration must be less than max duration",
          path: ["maxReservationDuration"],
        });
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

    if (v.isDraft) {
      return;
    }

    const isOnlinePayment = v.paymentType === PaymentType.Online || v.paymentType === PaymentType.OnlineOrInvoice;
    for (let i = 0; i < v.pricings.length; i++) {
      const pricing = v.pricings[i];
      // The prices of a shared pricing group are not edited or sent, so the form has only placeholders for them
      if (pricing == null || v.isSharedPricingGroup || (pricing.isFuture && !v.hasFuturePricing)) {
        continue;
      }
      validatePricing(pricing, ctx, `pricings.${i}`);
      if (pricing.isPaid == null) {
        ctx.addIssue({
          message: "Required",
          path: [`pricings.${i}.isPaid`],
          code: "custom",
        });
      }
      // The webshop needs the sales item for the accounting of a paid price
      if (!pricing.isReadOnly && pricing.isPaid && isOnlinePayment && pricing.salesItem == null) {
        ctx.addIssue({
          message: "Required",
          path: [`pricings.${i}.salesItem`],
          code: "custom",
        });
      }
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
    for (const fieldName of ["descriptionFi", "descriptionSv", "descriptionEn"] as const) {
      const stripped = stripHtml(v[fieldName]);
      if (stripped.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: [fieldName],
          message: "Message cannot be shorter than 1 characters",
        });
      }
    }

    if (v.maxPersons && v.minPersons && v.maxPersons < v.minPersons) {
      ctx.addIssue({
        code: "custom",
        message: "Max persons must be greater than min persons",
        path: ["maxPersons"],
      });
    }

    const shownPricingList = v.pricings.filter((p) => !p.isFuture || v.hasFuturePricing);
    const isPaid = shownPricingList.some((p) => p.isPaid && p.price > 0);
    const hasDiscount = shownPricingList.some((p) => p.isPaid && p.price > 0 && p.canApplyForDiscount);
    if (hasDiscount && v.pricingTerms == null) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["pricingTerms"],
      });
    }
    if (isPaid && !v.isSharedPricingGroup && v.paymentType == null) {
      ctx.addIssue({
        code: "custom",
        message: "Required",
        path: ["paymentType"],
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

function convertPriceComponent(component: OwnPriceComponent, isFuture: boolean): PricingFormValues {
  const price = toNumber(component.amount) ?? 0;
  return {
    pk: component.pk ?? 0,
    isReadOnly: !isFuture,
    taxLevel: component.taxLevel.pk ?? 0,
    salesItem: component.salesItem?.pk ?? null,
    price,
    isPaid: price > 0,
    isFuture,
    priceUnit: component.priceUnit,
    canApplyForDiscount: component.canApplyForDiscount,
    begins: convertBegins(component.validFrom),
    hasMaterialPrice: !!component.materialPriceDescriptionFi,
    materialPriceDescriptionFi: component.materialPriceDescriptionFi ?? "",
    materialPriceDescriptionEn: component.materialPriceDescriptionEn ?? "",
    materialPriceDescriptionSv: component.materialPriceDescriptionSv ?? "",
  };
}

function createNewPricing(pk: number, isFuture: boolean): PricingFormValues {
  return {
    pk,
    isReadOnly: false,
    taxLevel: 0,
    salesItem: null,
    price: 0,
    isFuture,
    isPaid: null,
    priceUnit: null,
    canApplyForDiscount: false,
    begins: isFuture ? formatDate(addDays(new Date(), 1)) : formatDate(new Date()),
    hasMaterialPrice: false,
    materialPriceDescriptionFi: "",
    materialPriceDescriptionEn: "",
    materialPriceDescriptionSv: "",
  };
}

/// The form has the current price and at least one future price, because the frontend can not add prices.
/// Negative pks are new prices.
/// A new current price is only possible when the reservation unit has no prices yet.
/// A saved price can only begin in the future.
function convertPricingList(data: Node | undefined): PricingFormValues[] {
  if (data == null) {
    return [createNewPricing(-1, false), createNewPricing(-2, true)];
  }
  const { current, futureList } = getOwnPricings(data, new Date());
  const prices = [
    ...(current != null ? [convertPriceComponent(current, false)] : []),
    ...futureList.map((component) => convertPriceComponent(component, true)),
  ];
  if (prices.length === 0) {
    prices.push(createNewPricing(-1, false));
  }
  if (!prices.some((p) => p.isFuture)) {
    prices.push(createNewPricing(-2, true));
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
    paymentTerms: data?.paymentTerms?.pk ?? "",
    pricingTerms: data?.pricingTerms?.pk ?? null,
    serviceSpecificTerms: data?.serviceSpecificTerms?.pk ?? "",
    cancellationTerms: data?.cancellationTerms?.pk ?? "",
    cancellationRule: data?.cancellationRule?.pk ?? null,
    pricings: convertPricingList(data),
    paymentType: data?.paymentType ?? null,
    isSharedPricingGroup: data != null ? getOwnPricings(data, new Date()).isShared : false,
    images: filterNonNullable(data?.images).map((i) => convertImage(i)),
    isDraft: data?.isDraft ?? false,
    seasons: convertSeasonalList(filterNonNullable(data?.applicationRoundTimeSlots)),
    hasFuturePricing: data != null ? getOwnPricings(data, new Date()).futureList.length > 0 : false,
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

const isReservableTime = (t?: SeasonalFormType["reservableTimes"][0]) => t && t.begin && t.end;

function maybeToApiDateTime(date: string, time: string): string | null {
  const d = fromUIDateTime(date, time);
  return d != null ? d.toISOString() : null;
}

// Too hard to type this because of two separate mutations that have optional fields in them
export function transformReservationUnit(values: ReservationUnitEditFormValues, taxLevelOptions: TaxLevelOption[]) {
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
    isSharedPricingGroup,
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

  // NOTE mutation doesn't support pks (even if changing not adding) unlike other mutations
  const applicationRoundTimeSlots: UpdateApplicationRoundTimeSlotSerializerInput[] = seasons
    .filter((s) => s.reservableTimes.some(isReservableTime) || s.closed)
    .map((s) => ({
      weekday: s.weekday,
      isClosed: s.closed,
      reservableTimes: !s.closed ? filterNonNullable(s.reservableTimes.filter(isReservableTime)) : [],
    }));

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
    // Prices that are not sent are deleted, so a shared pricing group gets no prices from this form
    ...(isSharedPricingGroup
      ? {}
      : {
          // A price without the choice of paid or free is not saved, so a draft is not saved as free by accident
          ownPricings: pricings
            .filter((p) => (!p.isFuture || hasFuturePricing) && p.isPaid != null)
            .map((p) => transformPricing(p, taxLevelOptions)),
        }),
    accessTypes,
    applicationRoundTimeSlots,
  };
}

function transformPricing(
  values: PricingFormValues,
  taxLevelOptions: TaxLevelOption[]
): OwnPricingInputSerializerInput {
  // without a valid taxLevel mutation fails even if it's free pricing
  // but we don't have a valid taxLevel for free pricings (user has made no selection)
  const taxLevel = values.taxLevel > 0 ? values.taxLevel : (taxLevelOptions[0]?.pk ?? 0);
  if (taxLevel === 0) {
    throw new Error("Tax level is required for pricing");
  }

  const isPaid = values.isPaid && values.price > 0;
  const begins = parseUIDate(values.begins) ?? new Date();
  return {
    ...(values.pk > 0 ? { pk: values.pk } : {}),
    begins: formatApiDate(begins) ?? "",
    amount: isPaid ? values.price.toString() : "0",
    priceUnit: values.priceUnit ?? PriceUnit.Fixed,
    taxLevel,
    salesItem: isPaid ? values.salesItem : null,
    // A discount is only possible for a paid price
    canApplyForDiscount: isPaid && values.canApplyForDiscount,
    materialPriceDescriptionFi: values.hasMaterialPrice ? values.materialPriceDescriptionFi : "",
    materialPriceDescriptionEn: values.hasMaterialPrice ? values.materialPriceDescriptionEn : "",
    materialPriceDescriptionSv: values.hasMaterialPrice ? values.materialPriceDescriptionSv : "",
  };
}
