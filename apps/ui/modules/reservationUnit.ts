import { formatters as getFormatters, getReservationPrice, getUnRoundedReservationVolume } from "common";
import { trim, uniq } from "lodash-es";
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  getHours,
  getMinutes,
  isAfter,
  isBefore,
  isSameDay,
  set,
  startOfDay,
  sub,
} from "date-fns";
import { i18n } from "next-i18next";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";
import {
  type AvailableTimesReservationUnitFieldsFragment,
  type BlockingReservationFieldsFragment,
  type EquipmentFieldsFragment,
  type IsReservableFieldsFragment,
  type NotReservableFieldsFragment,
  type PriceReservationUnitFieldsFragment,
  PriceUnit,
  type PricingFieldsFragment,
  ReservationKind,
  type ReservationPriceFieldsFragment,
  ReservationStartInterval,
  ReservationStateChoice,
  type ReservationUnitAccessTypeNode,
  type ReservationUnitNode,
  ReservationUnitPublishingState,
  ReservationUnitReservationState,
  type UnitNode,
} from "@gql/gql-types";
import {
  dateToKey,
  isRangeReservable,
  isSlotWithinReservationTime,
  type ReservableMap,
  type RoundPeriod,
} from "@/modules/reservable";
import { gql } from "@apollo/client";
import { getIntervalMinutes } from "common/src/conversion";
import { capitalize, dayMax, dayMin, filterNonNullable, isPriceFree, type ReadonlyDeep } from "common/src/helpers";
import { timeToMinutes, toApiDate } from "common/src/date-utils";
import { type LocalizationLanguages } from "common/src/urlBuilder";
import { type TFunction } from "i18next";

export function isReservationUnitPublished(reservationUnit: Pick<ReservationUnitNode, "publishingState">): boolean {
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

export function getEquipmentCategories(equipment: Readonly<Pick<EquipmentFieldsFragment, "category">[]>): string[] {
  if (!equipment || equipment.length === 0) {
    return [];
  }
  const categories: Array<(typeof equipmentCategoryOrder)[number]> = filterNonNullable(
    equipment.map((n) => {
      const index = equipmentCategoryOrder.findIndex((order) => order === n.category?.nameFi);
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
  equipments: Readonly<EquipmentFieldsFragment[]>,
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
            !equipmentCategoryOrder.find((order) => order === n.category.nameFi))
      )
      .sort((a, b) => (a.nameFi && b.nameFi ? a.nameFi.localeCompare(b.nameFi) : 0))
  );

  return sortedEquipment.map((n) => getTranslationSafe(n, "name", lang));
}

export function getReservationUnitName(
  reservationUnit: Pick<ReservationUnitNode, "nameFi" | "nameSv" | "nameEn"> | undefined,
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
  unit: Pick<UnitNode, "nameFi" | "nameSv" | "nameEn">,
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
    pricings: Readonly<PricingFieldsFragment[]>;
  }>
): PricingFieldsFragment | undefined {
  const { pricings } = reservationUnit;
  return pricings.find((pricing) => isActivePricing(pricing));
}

export const RESERVATION_UNIT_PRICE_FRAGMENT = gql`
  fragment PriceReservationUnitFields on ReservationUnitNode {
    id
    pricings {
      ...PricingFields
    }
    reservationBeginsAt
    reservationEndsAt
  }
`;

export function getFuturePricing(
  reservationUnit: PriceReservationUnitFieldsFragment,
  applicationRounds: ReadonlyDeep<RoundPeriod[]> = [],
  reservationDate?: Readonly<Date>
): PricingFieldsFragment | null {
  if (!reservationUnit) {
    return null;
  }
  const { pricings, reservationBeginsAt, reservationEndsAt } = reservationUnit;

  if (!pricings || pricings.length === 0) {
    return null;
  }

  const begin = reservationBeginsAt ? new Date(reservationBeginsAt) : undefined;
  const end = reservationEndsAt ? new Date(reservationEndsAt) : undefined;

  const futurePricings = pricings
    .filter((p) => isFuturePricing(p))
    .filter((fp) =>
      isSlotWithinReservationTime({
        start: new Date(fp.begins),
        reservationBeginsAt: begin,
        reservationEndsAt: end,
      })
    )
    .filter((futurePricing) => {
      return !applicationRounds.some((applicationRound) => {
        const { reservationPeriodBeginDate, reservationPeriodEndDate } = applicationRound;
        if (!reservationPeriodBeginDate || !reservationPeriodEndDate) {
          return false;
        }
        const begins = new Date(futurePricing.begins);
        const periodStart = new Date(reservationPeriodBeginDate);
        const periodEnd = new Date(reservationPeriodEndDate);
        return begins >= periodStart && begins <= periodEnd;
      });
    })
    .sort((a, b) => (a.begins > b.begins ? 1 : -1));

  if (futurePricings.length === 0) {
    return null;
  }

  return reservationDate
    ? (futurePricings.reverse().find((n) => {
        const apiDate = toApiDate({ date: new Date(reservationDate) });
        return apiDate ? n.begins <= apiDate : false;
      }) ?? null)
    : (futurePricings[0] ?? null);
}

function formatPrice(price: number, toCurrency?: boolean): string {
  const enableDecimals = price !== 0;
  const currencyFormatter = enableDecimals ? "currencyWithDecimals" : "currency";
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
    pricing.priceUnit === PriceUnit.Fixed || minutes ? "" : t(`prices:priceUnits.${pricing.priceUnit}`);
  return trim(`${priceString} / ${unitString}`, " / ");
}

export type GetReservationUnitPriceProps = {
  t: TFunction;
  reservationUnit: ReadonlyDeep<PriceReservationUnitFieldsFragment>;
  pricingDate: Date;
  minutes?: number;
};

export function getReservationUnitPrice(props: GetReservationUnitPriceProps): string | null {
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
  fragment ReservationPriceFields on ReservationNode {
    id
    reservationUnit {
      ...PriceReservationUnitFields
    }
    price
    state
    beginsAt
    endsAt
    applyingForFreeOfCharge
    appliedPricing {
      highestPrice
      taxPercentage
    }
  }
`;

// TODO why do we need both this and getPriceString?
export function getPrice(
  t: TFunction,
  reservation: ReservationPriceFieldsFragment,
  lang: LocalizationLanguages,
  reservationUnitPriceOnly = false
): string | null {
  const reservationUnit = reservation.reservationUnit;
  const begin = new Date(reservation.beginsAt);
  const end = new Date(reservation.endsAt);
  const minutes = differenceInMinutes(end, begin);

  const subventionState = getSubventionState(reservation);
  const showReservationUnitPrice = reservationUnitPriceOnly || subventionState === "pending";

  if (showReservationUnitPrice && reservationUnit) {
    return getReservationUnitPrice({
      t,
      reservationUnit,
      pricingDate: begin,
      minutes,
    });
  }
  return getReservationPrice(reservation.price ?? undefined, t("prices:priceFree"), true, lang);
}

function getSubventionState(
  reservation: Pick<ReservationPriceFieldsFragment, "applyingForFreeOfCharge" | "state">
): "pending" | "none" | "done" {
  if (reservation.applyingForFreeOfCharge && reservation.state === ReservationStateChoice.RequiresHandling) {
    return "pending";
  }
  if (!reservation.applyingForFreeOfCharge) {
    return "none";
  }
  return "done";
}

export function isReservationUnitFreeOfCharge(pricings: Readonly<PricingFieldsFragment[]>, date?: Date): boolean {
  return !isReservationUnitPaid(pricings, date);
}

export function isReservationUnitPaid(pricings: Readonly<PricingFieldsFragment[]>, date?: Date): boolean {
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
export function isInTimeSpan(date: Date, timeSpan: NonNullable<ReservationUnitNode["reservableTimeSpans"]>[0]) {
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

export type PossibleTimesCommonProps = Readonly<{
  reservableTimes: Readonly<ReservableMap>;
  reservationUnit: Omit<IsReservableFieldsFragment, "reservableTimeSpans">;
  activeApplicationRounds: readonly RoundPeriod[];
  duration: number;
  blockingReservations: readonly BlockingReservationFieldsFragment[];
}>;
export type GetPossibleTimesForDayProps = {
  date: Readonly<Date>;
} & PossibleTimesCommonProps;
// Returns an timeslot array (in HH:mm format) with the time-slots that are
// available for reservation on the given date
// TODO should rewrite the timespans to be NonNullable and dates (and do the conversion early, not on each component render)
export function getPossibleTimesForDay({
  reservableTimes,
  date,
  reservationUnit,
  activeApplicationRounds,
  duration,
  blockingReservations,
}: GetPossibleTimesForDayProps): { label: string; value: string }[] {
  const interval = reservationUnit.reservationStartInterval;
  const allTimes: Array<{ h: number; m: number }> = [];
  const slotsForDay = reservableTimes.get(dateToKey(date)) ?? [];
  for (const slot of slotsForDay) {
    const startDate = slot.start;
    const endDate = slot.end;
    const begin = isSameDay(startDate, date) ? startDate : set(date, { hours: 0, minutes: 0 });
    const end = isSameDay(endDate, date) ? endDate : set(date, { hours: 23, minutes: 59 });

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

  const realDuration = duration >= getIntervalMinutes(interval) ? duration : getIntervalMinutes(interval);
  return filterNonNullable(
    allTimes
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
            end: addMinutes(slotDate, realDuration),
          },
          reservationUnit,
          reservableTimes,
          activeApplicationRounds,
        });
        return isReservable;
      })
      // TODO the conversion should be done in a separate function so we can reuse the logic without string conversion
      .map((time) => convertTimeToOptions(time))
  );
}

function convertTimeToOptions(time: { h: number; m: number }): { label: string; value: string } | null {
  const { h, m } = time;
  if (h < 0 || m < 0) {
    return null;
  }
  const label = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  return { label, value: label };
}

export type LastPossibleReservationDateProps = Pick<
  IsReservableFieldsFragment,
  "reservationsMaxDaysBefore" | "reservableTimeSpans" | "reservationEndsAt"
>;

// Returns the last possible reservation date for the given reservation unit
export function getLastPossibleReservationDate(reservationUnit: LastPossibleReservationDateProps): Date | null {
  if (!reservationUnit) {
    return null;
  }
  const { reservationsMaxDaysBefore, reservableTimeSpans, reservationEndsAt } = reservationUnit;
  if (!reservableTimeSpans?.length) {
    return null;
  }

  const lastPossibleReservationDate =
    reservationsMaxDaysBefore != null && reservationsMaxDaysBefore > 0
      ? addDays(new Date(), reservationsMaxDaysBefore)
      : undefined;
  const reservationUnitNotReservable = reservationEndsAt ? new Date(reservationEndsAt) : undefined;
  // Why does this return now instead of null if there are no reservableTimeSpans?
  const endDateTime = reservableTimeSpans.at(-1)?.endDatetime ?? undefined;
  const lastOpeningDate = endDateTime ? new Date(endDateTime) : new Date();
  return dayMin([reservationUnitNotReservable, lastPossibleReservationDate, lastOpeningDate]) ?? null;
}

export const AVILABLE_TIMES_RESERVATION_UNIT_FRAGMENT = gql`
  fragment AvailableTimesReservationUnitFields on ReservationUnitNode {
    ...IsReservableFields
    reservationsMinDaysBefore
    reservationsMaxDaysBefore
  }
`;

export type AvailableTimesProps = {
  start: Date;
  duration: number;
  reservationUnit: AvailableTimesReservationUnitFieldsFragment;
  reservableTimes: ReservableMap;
  activeApplicationRounds: readonly RoundPeriod[];
  blockingReservations: readonly BlockingReservationFieldsFragment[];
  fromStartOfDay?: boolean;
};

// Returns an array of available times for the given duration and day
// TODO this is really slow (especially if called from a loop)
function getAvailableTimesForDay({
  start,
  duration,
  reservationUnit,
  reservableTimes,
  activeApplicationRounds,
  blockingReservations,
}: AvailableTimesProps): string[] {
  if (!reservationUnit) {
    return [];
  }
  const [timeHours, timeMinutesRaw] = [0, 0];

  const timeMinutes = timeMinutesRaw > 59 ? 59 : timeMinutesRaw;
  return getPossibleTimesForDay({
    reservableTimes,
    date: start,
    reservationUnit,
    activeApplicationRounds,
    duration,
    blockingReservations,
  })
    .map((n) => {
      const [slotHours, slotMinutes] = n.label.split(":").map(Number);
      const startDate = new Date(start);
      startDate.setHours(slotHours ?? 0, slotMinutes, 0, 0);
      const endDate = addMinutes(startDate, duration ?? 0);
      const startTime = new Date(start);
      startTime.setHours(timeHours, timeMinutes, 0, 0);
      const isReservable = isRangeReservable({
        range: {
          start: startDate,
          end: endDate,
        },
        reservationUnit,
        reservableTimes,
        activeApplicationRounds,
        blockingReservations,
      });

      return isReservable && !isBefore(startDate, startTime) ? n.label : null;
    })
    .filter((n): n is NonNullable<typeof n> => n != null);
}

// Returns the next available time, after the given time (Date object)
export function getNextAvailableTime(props: AvailableTimesProps): Date | null {
  const { start, reservationUnit, reservableTimes } = props;
  if (reservationUnit == null) {
    return null;
  }
  const { reservationsMinDaysBefore, reservationsMaxDaysBefore } = reservationUnit;

  const minReservationDate = addDays(new Date(), reservationsMinDaysBefore ?? 0);
  const possibleEndDay = getLastPossibleReservationDate(reservationUnit);
  const endDay = possibleEndDay ? addDays(possibleEndDay, 1) : undefined;
  // NOTE there is still a case where application rounds have a hole but there are no reservable times
  // this is not a real use case but technically possible
  const openAfterRound: Date | undefined = props.activeApplicationRounds.reduce<Date | undefined>((acc, round) => {
    if (round.reservationPeriodEndDate == null) {
      return acc;
    }
    const end = new Date(round.reservationPeriodEndDate);
    const begin = new Date(round.reservationPeriodBeginDate);
    if (isBefore(end, minReservationDate)) {
      return acc;
    }
    if (acc == null) {
      return end;
    }
    // skip non-overlapping ranges
    if (startOfDay(begin) > startOfDay(acc)) {
      return acc;
    }
    return dayMax([acc, new Date(round.reservationPeriodEndDate)]);
  }, undefined);

  let minDay = new Date(dayMax([minReservationDate, start, openAfterRound]) ?? minReservationDate);

  // Find the first possible day
  let openTimes = reservableTimes.get(dateToKey(minDay)) ?? [];
  const it = reservableTimes.entries();
  while (openTimes.length === 0) {
    const result = it.next();
    if (result.done) {
      return null;
    }
    if (endDay != null && isAfter(minDay, endDay)) {
      return null;
    }

    const {
      value: [_key, value],
    } = result;
    const startValue = value[0]?.start;
    if (startValue) {
      // the map contains all the days, skip the ones before the minDay
      if (isBefore(startValue, minDay)) {
        continue;
      }
      minDay = startValue;
      openTimes = reservableTimes.get(dateToKey(minDay)) ?? [];
    }
  }
  if (openTimes.length === 0) {
    return null;
  }

  const interval = openTimes[0];
  const intervalStart = interval?.start;
  const startDay = dayMax([intervalStart, minDay]) ?? minDay;

  // 2 years is the absolute maximum, use max days before as a performance optimization
  const MAX_DAYS = 2 * 365;
  const maxDaysBefore = reservationsMaxDaysBefore ?? 0;
  const maxDays = maxDaysBefore > 0 ? maxDaysBefore : MAX_DAYS;

  // Find the first possible time for that day, continue for each day until we find one
  for (let i = 0; i < maxDays; i++) {
    const singleDay = addDays(startDay, i);
    // have to run this complex check to remove already reserved times
    const availableTimesForDay = getAvailableTimesForDay({
      ...props,
      start: singleDay,
    });
    const hasAvailableTimes = availableTimesForDay.length > 0;
    if (hasAvailableTimes) {
      const startDatetime = availableTimesForDay[0];
      const minutes = timeToMinutes(startDatetime ?? "");
      return set(singleDay, { hours: 0, minutes });
    }
  }

  return null;
}

export function isReservationUnitReservable(reservationUnit: NotReservableFieldsFragmentNarrow):
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

export const NOT_RESERVABLE_FIELDS_FRAGMENT = gql`
  fragment NotReservableFields on ReservationUnitNode {
    ...IsReservableFields
    reservationState
    reservationKind
    ...MetadataSets
  }
`;

export type NotReservableFieldsFragmentNarrow = Omit<
  NotReservableFieldsFragment,
  | "bufferTimeBefore"
  | "bufferTimeAfter"
  | "reservationStartInterval"
  | "reservationEndsAt"
  | "reservationsMaxDaysBefore"
  | "reservationsMinDaysBefore"
  | "maxPersons"
  | "minPersons"
>;

// Why doesn't this check reservationEndsAt?
function getNotReservableReason(reservationUnit: NotReservableFieldsFragmentNarrow): string | null {
  const {
    minReservationDuration,
    maxReservationDuration,
    reservationKind,
    reservationState,
    metadataSet,
    reservableTimeSpans,
    reservationBeginsAt,
  } = reservationUnit;

  if (
    reservationState !== ReservationUnitReservationState.Reservable &&
    reservationState !== ReservationUnitReservationState.ScheduledClosing
  ) {
    return "reservationUnit is not reservable";
  }
  const resBegins = reservationBeginsAt ? new Date(reservationBeginsAt) : null;
  const hasSupportedFields = (metadataSet?.supportedFields?.length ?? 0) > 0;
  const hasReservableTimes = (reservableTimeSpans?.length ?? 0) > 0;
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

type AccessTypeDurations = Pick<ReservationUnitAccessTypeNode, "beginDate" | "accessType" | "pk">;
type AccessTypeDurationsExtended = {
  accessType: string;
  pk: number | null;
  beginDate: Date;
  endDate: Date | null;
};

export function getReservationUnitAccessPeriods(
  accessTypes: Readonly<AccessTypeDurations[]>
): Readonly<AccessTypeDurationsExtended[]> {
  type nextEndDateIterator = {
    nextEndDate: Date | null;
    array: AccessTypeDurationsExtended[];
  };
  // map the access type periods to a list of objects with the begin and end dates in Date format
  const accessTypeDurationDates = accessTypes.map((aT) => ({
    type: aT.accessType,
    pk: aT.pk,
    begin: new Date(aT.beginDate),
    end: null,
  }));

  return accessTypeDurationDates.reduceRight<nextEndDateIterator>(
    (acc, aT) => {
      const endDate = acc.nextEndDate ? sub(acc.nextEndDate, { days: 1 }) : null;
      const beginDate = aT.begin;
      const accessTypeWithEndDate = {
        ...aT,
        accessType: aT.type,
        pk: aT.pk,
        beginDate: aT.begin,
        endDate,
      };
      acc.nextEndDate = beginDate;
      acc.array.unshift(accessTypeWithEndDate);
      return { nextEndDate: acc.nextEndDate, array: acc.array };
    },
    { nextEndDate: null, array: [] }
  ).array;
}

// Format an approximation of days based on the number of days
export function formatNDays(t: TFunction, days: number): string {
  if (days <= 0) {
    return "";
  }
  if (days < 14) {
    return t("common:days", { count: Math.floor(days) });
  }

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return t("common:weeks", { count: weeks });
  }

  const months = Math.floor(days / 30);
  return t("common:months", { count: months });
}
