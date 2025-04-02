import {
  formatters as getFormatters,
  getReservationPrice,
  getUnRoundedReservationVolume,
} from "common";
import { trim, uniq } from "lodash-es";
import {
  addMinutes,
  differenceInMinutes,
  getHours,
  getMinutes,
  isAfter,
  isBefore,
  isSameDay,
  set,
  sub,
} from "date-fns";
import { i18n } from "next-i18next";
import {
  convertLanguageCode,
  getTranslationSafe,
  toUIDate,
} from "common/src/common/util";
import {
  ReservationUnitPublishingState,
  type ReservationUnitNode,
  PriceUnit,
  type EquipmentFieldsFragment,
  type PriceReservationUnitFragment,
  type UnitNode,
  ReservationUnitReservationState,
  type MetadataSetsFragment,
  ReservationKind,
  type IsReservableFieldsFragment,
  ReservationStartInterval,
  Maybe,
  BlockingReservationFieldsFragment,
  AccessType,
  type ReservationPriceFragment,
  ReservationStateChoice,
} from "@gql/gql-types";
import {
  type ReservableMap,
  type RoundPeriod,
  isSlotWithinReservationTime,
  dateToKey,
  isRangeReservable,
} from "@/modules/reservable";
import { type PricingFieldsFragment } from "common/gql/gql-types";
import { gql } from "@apollo/client";
import { getIntervalMinutes } from "common/src/conversion";
import {
  capitalize,
  filterNonNullable,
  isPriceFree,
  type LocalizationLanguages,
  type ReadonlyDeep,
} from "common/src/helpers";
import { type TFunction } from "i18next";

function formatTimeObject(time: { h: number; m: number }): string {
  return `${time.h.toString().padStart(2, "0")}:${time.m.toString().padStart(2, "0")}`;
}
function formatTime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return formatTimeObject({ h: getHours(date), m: getMinutes(date) });
}

export { formatTime as getTimeString };

export function isReservationUnitPublished(
  reservationUnit: Readonly<Pick<ReservationUnitNode, "publishingState">>
): boolean {
  const { publishingState } = reservationUnit;

  switch (publishingState) {
    case ReservationUnitPublishingState.Published:
    case ReservationUnitPublishingState.ScheduledHiding:
      return true;
    default:
      return false;
  }
}

const equipmentCategoryOrder = [
  "Huonekalut",
  "Keittiö",
  "Liikunta- ja pelivälineet",
  "Tekniikka",
  "Pelikonsoli",
  "Liittimet",
  "Muu",
] as const;

export function getEquipmentCategories(
  equipment: ReadonlyDeep<Pick<EquipmentFieldsFragment, "category">[]>
): string[] {
  if (!equipment || equipment.length === 0) {
    return [];
  }
  const categories: Array<(typeof equipmentCategoryOrder)[number]> =
    filterNonNullable(
      equipment.map((n) => {
        const index = equipmentCategoryOrder.findIndex(
          (order) => order === n.category?.nameFi
        );
        if (index === -1) {
          return "Muu";
        }
        return equipmentCategoryOrder[index];
      })
    );

  categories.sort((a, b) => {
    const left = equipmentCategoryOrder.indexOf(a);
    const right = equipmentCategoryOrder.indexOf(b);
    return left - right;
  });

  return uniq(categories);
}

// Why are we doing complex frontend sorting? and always in finnish?
export function getEquipmentList(
  equipments: ReadonlyDeep<EquipmentFieldsFragment[]>,
  lang: LocalizationLanguages
): string[] {
  if (equipments.length === 0) {
    return [];
  }

  const categories = getEquipmentCategories(equipments);

  const sortedEquipment = categories.flatMap((category) =>
    equipments
      .filter(
        (n) =>
          n.category?.nameFi === category ||
          (category === "Muu" &&
            n.category?.nameFi &&
            !equipmentCategoryOrder.find(
              (order) => order === n.category.nameFi
            ))
      )
      .sort((a, b) =>
        a.nameFi && b.nameFi ? a.nameFi.localeCompare(b.nameFi) : 0
      )
  );

  return sortedEquipment.map((n) => getTranslationSafe(n, "name", lang));
}

export function getReservationUnitName(
  // TODO use a fragment for ReservationUnitName
  reservationUnit?: Pick<
    ReadonlyDeep<ReservationUnitNode>,
    "nameFi" | "nameSv" | "nameEn"
  > | null,
  language: string = i18n?.language ?? "fi"
): string | undefined {
  if (!reservationUnit) {
    return undefined;
  }
  const key = `name${capitalize(language)}`;
  if (key in reservationUnit) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- silly magic to avoid implicit any type
    const val: unknown = (reservationUnit as any)[key];
    if (typeof val === "string" && val.length > 0) {
      return val;
    }
  }
  return reservationUnit.nameFi ?? "-";
}

export function getUnitName(
  unit:
    | Pick<ReadonlyDeep<UnitNode>, "nameFi" | "nameSv" | "nameEn">
    | null
    | undefined,
  locale: LocalizationLanguages
): string | undefined {
  if (unit == null) {
    return undefined;
  }
  return getTranslationSafe(unit, "name", convertLanguageCode(locale));
}

function isActivePricing(pricing: PricingFieldsFragment): boolean {
  return new Date(pricing.begins) <= new Date();
}
function isFuturePricing(pricing: PricingFieldsFragment): boolean {
  return new Date(pricing.begins) > new Date();
}

export function getActivePricing(
  reservationUnit: Readonly<{
    pricings: Readonly<ReadonlyDeep<PricingFieldsFragment>[]>;
  }>
): PricingFieldsFragment | undefined {
  const { pricings } = reservationUnit;
  return pricings.find((pricing) => isActivePricing(pricing));
}

export const RESERVATION_UNIT_PRICE_FRAGMENT = gql`
  fragment PriceReservationUnit on ReservationUnitNode {
    id
    pricings {
      ...PricingFields
    }
    reservationBegins
    reservationEnds
  }
`;

export function getFuturePricing(
  reservationUnit:
    | Maybe<ReadonlyDeep<PriceReservationUnitFragment>>
    | undefined,
  applicationRounds: ReadonlyDeep<RoundPeriod[]> = [],
  reservationDate?: Readonly<Date>
): PricingFieldsFragment | null {
  if (!reservationUnit) {
    return null;
  }
  const { pricings, reservationBegins, reservationEnds } = reservationUnit;

  if (!pricings || pricings.length === 0) {
    return null;
  }

  const begin = reservationBegins ? new Date(reservationBegins) : undefined;
  const end = reservationEnds ? new Date(reservationEnds) : undefined;

  const futurePricings = pricings
    .filter((p) => isFuturePricing(p))
    .filter((fp) =>
      isSlotWithinReservationTime({
        start: new Date(fp.begins),
        reservationBegins: begin,
        reservationEnds: end,
      })
    )
    .filter((futurePricing) => {
      return !applicationRounds.some((applicationRound) => {
        const { reservationPeriodBegin, reservationPeriodEnd } =
          applicationRound;
        if (!reservationPeriodBegin || !reservationPeriodEnd) {
          return false;
        }
        const begins = new Date(futurePricing.begins);
        const periodStart = new Date(reservationPeriodBegin);
        const periodEnd = new Date(reservationPeriodEnd);
        return begins >= periodStart && begins <= periodEnd;
      });
    })
    .sort((a, b) => (a.begins > b.begins ? 1 : -1));

  if (futurePricings.length === 0) {
    return null;
  }

  return reservationDate
    ? (futurePricings.reverse().find((n) => {
        return n.begins <= toUIDate(new Date(reservationDate), "yyyy-MM-dd");
      }) ?? null)
    : (futurePricings[0] ?? null);
}

function formatPrice(price: number, toCurrency?: boolean): string {
  const enableDecimals = price !== 0;
  const currencyFormatter = enableDecimals
    ? "currencyWithDecimals"
    : "currency";
  const floatFormatter = enableDecimals ? "twoDecimal" : "strippedDecimal";
  const formatters = getFormatters("fi");
  const formatter = formatters[toCurrency ? currencyFormatter : floatFormatter];
  return formatter?.format(price) ?? "";
}

export type GetPriceType = {
  t: TFunction;
  pricing: PricingFieldsFragment;
  minutes?: number; // additional minutes for total price calculation
};

function getReservationVolume(minutes: number, unit: PriceUnit): number {
  if (!minutes) {
    return 1;
  }

  return getUnRoundedReservationVolume(minutes, unit);
}

// TODO rewrite this return number normally
// and a separate function to format it to string
export function getPriceString(props: GetPriceType): string {
  const { t, pricing, minutes = 0 } = props;

  if (isPriceFree(pricing)) {
    return t("prices:priceFree") ?? "0";
  }

  const volume = getReservationVolume(minutes, pricing.priceUnit);
  const highestPrice = parseFloat(pricing.highestPrice) * volume;
  const lowestPrice = parseFloat(pricing.lowestPrice) * volume;
  const priceString =
    lowestPrice === highestPrice
      ? formatPrice(lowestPrice, true)
      : `${formatPrice(lowestPrice)} - ${formatPrice(highestPrice, true)}`;
  const unitString =
    pricing.priceUnit === PriceUnit.Fixed || minutes
      ? ""
      : t(`prices:priceUnits.${pricing.priceUnit}`);
  return trim(`${priceString} / ${unitString}`, " / ");
}

export type GetReservationUnitPriceProps = {
  t: TFunction;
  reservationUnit: ReadonlyDeep<PriceReservationUnitFragment>;
  pricingDate: Date;
  minutes?: number;
};

export function getReservationUnitPrice(
  props: GetReservationUnitPriceProps
): string | null {
  const { t, reservationUnit: ru, pricingDate, minutes } = props;
  if (Number.isNaN(pricingDate.getTime())) {
    // eslint-disable-next-line no-console
    console.warn("Invalid pricing date", pricingDate);
  }

  const futurePricing = getFuturePricing(ru, [], pricingDate);
  const activePricing = getActivePricing(ru);
  let pricing = futurePricing ?? activePricing;
  // tax percentage change is based on the day of buying
  if (
    futurePricing &&
    activePricing &&
    futurePricing.taxPercentage.value !== activePricing.taxPercentage.value &&
    isReservationUnitPaid([activePricing])
  ) {
    pricing = activePricing;
  }

  if (pricing == null) {
    return null;
  }

  return getPriceString({
    t,
    pricing,
    minutes,
  });
}

export const RESERVATION_PRICE_FRAGMENT = gql`
  fragment ReservationPrice on ReservationNode {
    id
    reservationUnits {
      ...PriceReservationUnit
    }
    price
    begin
    state
    end
    applyingForFreeOfCharge
  }
`;

// TODO why do we need both this and getPriceString?
export function getPrice(
  t: TFunction,
  reservation: ReservationPriceFragment,
  lang: LocalizationLanguages,
  reservationUnitPriceOnly = false
): string | null {
  const reservationUnit = reservation.reservationUnits.find(() => true);
  const begin = new Date(reservation.begin);
  const end = new Date(reservation.end);
  const minutes = differenceInMinutes(end, begin);

  const subventionState = getSubventionState(reservation);
  const showReservationUnitPrice =
    reservationUnitPriceOnly || subventionState === "pending";

  if (showReservationUnitPrice && reservationUnit) {
    return getReservationUnitPrice({
      t,
      reservationUnit,
      pricingDate: begin,
      minutes,
    });
  }
  return getReservationPrice(
    reservation.price ?? undefined,
    t("prices:priceFree"),
    true,
    lang
  );
}

function getSubventionState(
  reservation: Pick<
    ReservationPriceFragment,
    "applyingForFreeOfCharge" | "state"
  >
): "pending" | "none" | "done" {
  if (
    reservation.applyingForFreeOfCharge &&
    reservation.state === ReservationStateChoice.RequiresHandling
  ) {
    return "pending";
  }
  if (!reservation.applyingForFreeOfCharge) {
    return "none";
  }
  return "done";
}

export function isReservationUnitFreeOfCharge(
  pricings: Readonly<ReadonlyDeep<PricingFieldsFragment>[]>,
  date?: Date
): boolean {
  return !isReservationUnitPaid(pricings, date);
}

export function isReservationUnitPaid(
  pricings: Readonly<ReadonlyDeep<PricingFieldsFragment>[]>,
  date?: Date
): boolean {
  const active = pricings.filter((p) => isActivePricing(p));
  const future = pricings.filter((p) => isFuturePricing(p));
  const d =
    date == null
      ? active
      : active.concat(future).filter((p) => {
          const start = new Date(p.begins);
          return start <= date;
        });
  return d.filter((p) => !isPriceFree(p)).length > 0;
}

/// Returns true if the given time is 'inside' the time span
/// inside in this case means it's either the same day or the time span is multiple days
/// TODO should rewrite this to work on dates since we want to do that conversion first anyway
export function isInTimeSpan(
  date: Date,
  timeSpan: NonNullable<ReservationUnitNode["reservableTimeSpans"]>[0]
) {
  const { startDatetime, endDatetime } = timeSpan ?? {};

  if (!startDatetime || !endDatetime) return false;
  const startDate = new Date(startDatetime);
  const endDate = new Date(endDatetime);
  // either we have per day open time, or we have a span of multiple days
  // another option would be to move the starting time to 00:00
  if (isSameDay(date, startDate)) return true;
  if (isBefore(date, startDate)) return false;
  if (isAfter(date, endDate)) return false;
  return true;
}

/// Generate a list of intervals for a day
// TODO this can be moved to reservationUnit (not used here anymore)
export function getDayIntervals(
  startTime: { h: number; m: number },
  endTime: { h: number; m: number },
  interval: ReservationStartInterval
): { h: number; m: number }[] {
  // normalize end time to allow comparison
  const nEnd = endTime.h === 0 && endTime.m === 0 ? { h: 23, m: 59 } : endTime;
  const iMins = getIntervalMinutes(interval);

  const start = startTime;
  const end = nEnd;

  const startMins = start.h * 60 + start.m;
  const endMins = end.h * 60 + end.m;

  const intervals: Array<{ h: number; m: number }> = [];
  for (let i = startMins; i < endMins; i += iMins) {
    // don't allow interval overflow but handle 0:00 as 23:59
    if (i + iMins > endMins + 1) {
      break;
    }
    const m = i % 60;
    const h = (i - m) / 60;
    intervals.push({ h, m });
  }
  return intervals;
}

// Returns an timeslot array (in HH:mm format) with the time-slots that are
// available for reservation on the given date
// TODO should rewrite the timespans to be NonNullable and dates (and do the conversion early, not on each component render)
export function getPossibleTimesForDay({
  reservableTimes,
  interval,
  date,
  reservationUnit,
  activeApplicationRounds,
  durationValue,
  blockingReservations,
}: {
  reservableTimes: ReservableMap;
  interval: ReservationUnitNode["reservationStartInterval"];
  date: Date;
  reservationUnit: Omit<IsReservableFieldsFragment, "reservableTimeSpans">;
  activeApplicationRounds: readonly RoundPeriod[];
  durationValue: number;
  blockingReservations: readonly BlockingReservationFieldsFragment[];
}): { label: string; value: string }[] {
  const allTimes: Array<{ h: number; m: number }> = [];
  const slotsForDay = reservableTimes.get(dateToKey(date)) ?? [];
  for (const slot of slotsForDay) {
    const startDate = slot.start;
    const endDate = slot.end;
    const begin = isSameDay(startDate, date)
      ? startDate
      : set(date, { hours: 0, minutes: 0 });
    const end = isSameDay(endDate, date)
      ? endDate
      : set(date, { hours: 23, minutes: 59 });

    const s: { h: number; m: number } = {
      h: getHours(begin),
      m: getMinutes(begin),
    };
    const e: { h: number; m: number } = {
      h: getHours(end),
      m: getMinutes(end),
    };
    const intervals = getDayIntervals(s, e, interval);
    allTimes.push(...intervals);
  }

  const times = allTimes
    .filter((span) => {
      const { h: slotH, m: slotM } = span;
      const slotDate = new Date(date);
      slotDate.setHours(slotH, slotM, 0, 0);
      if (slotDate < new Date()) {
        return false;
      }
      const isReservable = isRangeReservable({
        blockingReservations,
        range: {
          start: slotDate,
          end: addMinutes(slotDate, durationValue),
        },
        reservationUnit,
        reservableTimes,
        activeApplicationRounds,
      });
      return isReservable;
    })
    // TODO the conversion should be done in a separate function so we can reuse the logic without string conversion
    .map((time) => formatTimeObject(time))
    .map((time) => ({ label: time, value: time }));
  return times;
}

// TODO use a fragment
export type IsReservableReservationUnitType = Pick<
  ReservationUnitNode,
  | "reservationState"
  | "reservableTimeSpans"
  | "reservationBegins"
  | "minReservationDuration"
  | "maxReservationDuration"
  | "reservationKind"
  | "reservationsMaxDaysBefore"
  | "reservationsMinDaysBefore"
> &
  MetadataSetsFragment;

export function isReservationUnitReservable(
  reservationUnit:
    | ReadonlyDeep<IsReservableReservationUnitType>
    | null
    | undefined
):
  | {
      isReservable: false;
      reason: string;
    }
  | { isReservable: true; reason: null } {
  if (!reservationUnit) {
    return {
      isReservable: false,
      reason: "reservationUnit is null",
    };
  }

  const reason = getNotReservableReason(reservationUnit);
  const isReservable = reason == null;
  if (isReservable) {
    return {
      isReservable,
      reason: null,
    };
  }

  return {
    isReservable: false,
    reason,
  };
}

function getNotReservableReason(
  reservationUnit: ReadonlyDeep<IsReservableReservationUnitType>
): string | null {
  const {
    minReservationDuration,
    maxReservationDuration,
    reservationKind,
    reservationState,
  } = reservationUnit;

  if (
    reservationState !== ReservationUnitReservationState.Reservable &&
    reservationState !== ReservationUnitReservationState.ScheduledClosing
  ) {
    return "reservationUnit is not reservable";
  }
  const resBegins = reservationUnit.reservationBegins
    ? new Date(reservationUnit.reservationBegins)
    : null;
  const hasSupportedFields =
    (reservationUnit.metadataSet?.supportedFields?.length ?? 0) > 0;
  const hasReservableTimes =
    (reservationUnit.reservableTimeSpans?.length ?? 0) > 0;
  if (!hasSupportedFields) {
    return "reservationUnit has no supported fields";
  }
  if (!hasReservableTimes) {
    return "reservationUnit has no reservable times";
  }
  // null -> no limit
  if (resBegins != null && resBegins > new Date()) {
    return "reservationUnit reservation begins in future";
  }
  if (!minReservationDuration || !maxReservationDuration) {
    return "reservationUnit has no min/max reservation duration";
  }
  if (reservationKind === ReservationKind.Season) {
    return "reservationUnit is only available for seasonal booking";
  }
  return null;
}

type AccessTypeDurations = {
  accessType: AccessType;
  beginDate: string;
  endDate?: string | null;
  id: string;
  pk?: number | null;
};

export function getReservationUnitAccessPeriods(
  accessTypes: AccessTypeDurations[]
) {
  type nextEndDateIterator = {
    nextEndDate: string | null;
    array: AccessTypeDurations[];
  };
  return accessTypes.reduceRight<nextEndDateIterator>(
    (acc, aT) => {
      const endDate = acc.nextEndDate
        ? toUIDate(sub(new Date(acc.nextEndDate), { days: 1 }))
        : null;
      const beginDate = toUIDate(new Date(aT.beginDate));
      const accessTypeWithEndDate = { ...aT, beginDate, endDate };
      acc.nextEndDate = aT.beginDate;
      acc.array.unshift(accessTypeWithEndDate);
      return { nextEndDate: acc.nextEndDate, array: acc.array };
    },
    { nextEndDate: null, array: [] }
  ).array;
}
