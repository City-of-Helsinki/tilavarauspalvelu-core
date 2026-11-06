import { gql } from "@apollo/client";
import {
  addDays,
  addMinutes,
  getHours,
  getMinutes,
  isAfter,
  isBefore,
  isSameDay,
  set,
  startOfDay,
  sub,
} from "date-fns";
import { uniq } from "lodash-es";
import type { TFunction } from "i18next";
import { getIntervalMinutes } from "@ui/modules/conversion";
import { parseApiDate, timeToMinutes } from "@ui/modules/date-utils";
import { getTranslation, dayMax, dayMin, filterNonNullable, formatTimeStruct } from "@ui/modules/helpers";
import type { LocalizationLanguages } from "@ui/modules/urlBuilder";
import { ReservationKind, ReservationUnitPublishingState, ReservationUnitReservationState } from "@gql/gql-types";
import type {
  AvailableTimesReservationUnitFieldsFragment,
  BlockingReservationFieldsFragment,
  EquipmentFieldsFragment,
  IsReservableFieldsFragment,
  NotReservableFieldsFragment,
  ReservationUnitAccessTypeNode,
  ReservationUnitNode,
  ReservationStartInterval,
} from "@gql/gql-types";
import { dateToKey, isRangeReservable } from "@/modules/reservable";
import type { ReservableMap, RoundPeriod } from "@/modules/reservable";

export function isReservationUnitPublished(reservationUnit: Pick<ReservationUnitNode, "publishingState">): boolean {
  const { publishingState } = reservationUnit;

  switch (publishingState) {
    case ReservationUnitPublishingState.Published:
    case ReservationUnitPublishingState.ScheduledHiding:
      return true;
    case ReservationUnitPublishingState.Archived:
    case ReservationUnitPublishingState.Draft:
    case ReservationUnitPublishingState.Hidden:
    case ReservationUnitPublishingState.ScheduledPeriod:
    case ReservationUnitPublishingState.ScheduledPublishing:
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
  equipment: Readonly<Array<Pick<EquipmentFieldsFragment, "category">>>
): string[] {
  if (!equipment || equipment.length === 0) {
    return [];
  }
  const categories: Array<(typeof equipmentCategoryOrder)[number]> = filterNonNullable(
    equipment.map((n) => {
      const categoryName = n.category?.nameFi as (typeof equipmentCategoryOrder)[number];
      const index = equipmentCategoryOrder.indexOf(categoryName);
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

function equipmentFilterFunc(n: EquipmentFieldsFragment, category: string): boolean {
  if (n.category.nameFi == null) {
    return false;
  }
  if (n.category.nameFi === category) {
    return true;
  }
  return category === "Muu" && !equipmentCategoryOrder.some((order) => order === n.category.nameFi);
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
      .filter((n) => equipmentFilterFunc(n, category))
      .sort((a, b) => (a.nameFi && b.nameFi ? a.nameFi.localeCompare(b.nameFi) : 0))
  );

  return sortedEquipment.map((n) => getTranslation(n, "name", lang));
}

/// Returns true if the given time is 'inside' the time span
/// inside in this case means it's either the same day or the time span is multiple days
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
export function getDayIntervals(
  startTime: { h: number; m: number },
  endTime: { h: number; m: number },
  interval: ReservationStartInterval
): Array<{ h: number; m: number }> {
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
  activeApplicationRounds: ReadonlyArray<RoundPeriod>;
  duration: number;
  blockingReservations: ReadonlyArray<BlockingReservationFieldsFragment>;
}>;
export type GetPossibleTimesForDayProps = {
  date: Readonly<Date>;
} & PossibleTimesCommonProps;

// Returns an timeslot array (in HH:mm format) with the time-slots that are
// available for reservation on the given date
export function getPossibleTimesForDay({
  reservableTimes,
  date,
  reservationUnit,
  activeApplicationRounds,
  duration,
  blockingReservations,
}: GetPossibleTimesForDayProps): Array<{ label: string; value: string }> {
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
      .map((time) => convertTimeToOptions(time))
  );
}

function convertTimeToOptions(time: { h: number; m: number }): { label: string; value: string } | null {
  const { h, m } = time;
  if (h < 0 || m < 0) {
    return null;
  }
  const label = formatTimeStruct({ hour: h, minute: m });
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
  activeApplicationRounds: ReadonlyArray<RoundPeriod>;
  blockingReservations: ReadonlyArray<BlockingReservationFieldsFragment>;
  fromStartOfDay?: boolean;
};

// Returns an array of available times for the given duration and day
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

  const timeMinutes = Math.min(59, timeMinutesRaw);
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
    const end = parseApiDate(round.reservationPeriodEndDate);
    const begin = parseApiDate(round.reservationPeriodBeginDate);
    if (end == null || begin == null) {
      return acc;
    }
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
    return dayMax([acc, end]);
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
  const hasReservableTimes = (reservableTimeSpans?.length ?? 0) > 0;
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
  const accessTypeDurationDates = filterNonNullable(
    accessTypes.map((aT) => {
      const begin = parseApiDate(aT.beginDate);
      if (begin == null) {
        return null;
      }
      return {
        type: aT.accessType,
        pk: aT.pk,
        begin,
        end: null as Date | null,
      };
    })
  );

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
