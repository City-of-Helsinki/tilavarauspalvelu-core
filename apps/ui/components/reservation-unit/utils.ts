import {
  addDays,
  addMinutes,
  isAfter,
  isBefore,
  set,
  startOfDay,
} from "date-fns";
import type {
  AvailableTimesReservationUnitFieldsFragment,
  BlockingReservationFieldsFragment,
  IsReservableFieldsFragment,
} from "@gql/gql-types";
import { getPossibleTimesForDay } from "@/modules/reservationUnit";
import {
  type RoundPeriod,
  type ReservableMap,
  dateToKey,
  isRangeReservable,
} from "@/modules/reservable";
import { dayMax, dayMin, timeToMinutes } from "common/src/helpers";
import { gql } from "@apollo/client";

export type LastPossibleReservationDateProps = Pick<
  IsReservableFieldsFragment,
  "reservationsMaxDaysBefore" | "reservableTimeSpans" | "reservationEnds"
>;

// Returns the last possible reservation date for the given reservation unit
export function getLastPossibleReservationDate(
  reservationUnit: LastPossibleReservationDateProps
): Date | null {
  if (!reservationUnit) {
    return null;
  }
  const { reservationsMaxDaysBefore, reservableTimeSpans, reservationEnds } =
    reservationUnit;
  if (!reservableTimeSpans?.length) {
    return null;
  }

  const lastPossibleReservationDate =
    reservationsMaxDaysBefore != null && reservationsMaxDaysBefore > 0
      ? addDays(new Date(), reservationsMaxDaysBefore)
      : undefined;
  const reservationUnitNotReservable = reservationEnds
    ? new Date(reservationEnds)
    : undefined;
  // Why does this return now instead of null if there are no reservableTimeSpans?
  const endDateTime = reservableTimeSpans.at(-1)?.endDatetime ?? undefined;
  const lastOpeningDate = endDateTime ? new Date(endDateTime) : new Date();
  return (
    dayMin([
      reservationUnitNotReservable,
      lastPossibleReservationDate,
      lastOpeningDate,
    ]) ?? null
  );
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
  const { reservationStartInterval: interval } = reservationUnit;
  return getPossibleTimesForDay({
    reservableTimes,
    interval,
    date: start,
    reservationUnit,
    activeApplicationRounds,
    durationValue: duration,
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
  const { reservationsMinDaysBefore, reservationsMaxDaysBefore } =
    reservationUnit;

  const minReservationDate = addDays(
    new Date(),
    reservationsMinDaysBefore ?? 0
  );
  const possibleEndDay = getLastPossibleReservationDate(reservationUnit);
  const endDay = possibleEndDay ? addDays(possibleEndDay, 1) : undefined;
  // NOTE there is still a case where application rounds have a hole but there are no reservable times
  // this is not a real use case but technically possible
  const openAfterRound: Date | undefined = props.activeApplicationRounds.reduce<
    Date | undefined
  >((acc, round) => {
    if (round.reservationPeriodEnd == null) {
      return acc;
    }
    const end = new Date(round.reservationPeriodEnd);
    const begin = new Date(round.reservationPeriodBegin);
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
    return dayMax([acc, new Date(round.reservationPeriodEnd)]);
  }, undefined);

  let minDay = new Date(
    dayMax([minReservationDate, start, openAfterRound]) ?? minReservationDate
  );

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
