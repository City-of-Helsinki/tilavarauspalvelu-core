import {
  addDays,
  addMinutes,
  isAfter,
  isBefore,
  set,
  startOfDay,
} from "date-fns";
import type {
  ReservationUnitNode,
  ReservationUnitPageQuery,
} from "@gql/gql-types";
import { getPossibleTimesForDay } from "@/modules/reservationUnit";
import {
  type RoundPeriod,
  type ReservableMap,
  dateToKey,
  isRangeReservable,
} from "@/modules/reservable";
import { dayMax, dayMin } from "common/src/helpers";

type LastPossibleReservationDateProps = Pick<
  ReservationUnitNode,
  "reservationsMaxDaysBefore" | "reservableTimeSpans" | "reservationEnds"
>;

// Returns the last possible reservation date for the given reservation unit
export function getLastPossibleReservationDate(
  reservationUnit?: LastPossibleReservationDateProps
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

type QueryT = NonNullable<ReservationUnitPageQuery["reservationUnit"]>;
type AvailableTimesProps = {
  start: Date;
  duration: number;
  reservationUnit: QueryT;
  reservableTimes: ReservableMap;
  activeApplicationRounds: readonly RoundPeriod[];
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
  })
    .map((n) => {
      const [slotHours, slotMinutes] = n.label.split(":").map(Number);
      const startDate = new Date(start);
      startDate.setHours(slotHours, slotMinutes, 0, 0);
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
  const minDay =
    dayMax([minReservationDate, start, openAfterRound]) ?? minReservationDate;

  // Find the first possible day
  let openTimes = reservableTimes.get(dateToKey(minDay));
  const it = reservableTimes.entries();
  while (openTimes == null || openTimes.length === 0) {
    const result = it.next();
    if (result.done) {
      return null;
    }
    const {
      value: [_key, value],
    } = result;
    if (endDay != null && isAfter(minDay, endDay)) {
      return null;
    }
    if (value.length > 0) {
      minDay.setDate(value[0].start.getDate());
      openTimes = reservableTimes.get(dateToKey(minDay));
    }
  }
  if (openTimes == null || openTimes.length === 0) {
    return null;
  }

  const interval = openTimes[0];
  const startDay = dayMax([new Date(interval.start), minDay]) ?? minDay;

  const daysToGenerate = reservationsMaxDaysBefore ?? 180;
  const days = Array.from({ length: daysToGenerate }, (_, i) =>
    addDays(startDay, i)
  );

  // Find the first possible time for that day, continue for each day until we find one
  for (const singleDay of days) {
    // have to run this complex check to remove already reserved times
    const availableTimesForDay = getAvailableTimesForDay({
      ...props,
      start: singleDay,
    });
    const hasAvailableTimes = availableTimesForDay.length > 0;
    if (hasAvailableTimes) {
      const startDatetime = availableTimesForDay[0];
      const [hours, minutes] = startDatetime
        .split(":")
        .map(Number)
        .filter(Number.isFinite);
      return set(singleDay, { hours, minutes });
    }
  }

  return null;
}
