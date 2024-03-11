import { filterNonNullable } from "common/src/helpers";
import { addDays, addMinutes, isAfter, isBefore } from "date-fns";
import { ReservationUnitByPkType } from "common/types/gql-types";
import {
  getPossibleTimesForDay,
  isInTimeSpan,
} from "@/modules/reservationUnit";

function pickMaybeDay(
  a: Date | undefined,
  b: Date | undefined,
  compF: (a: Date, b: Date) => boolean
): Date | undefined {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return compF(a, b) ? a : b;
}

// Returns a Date object with the first day of the given array of Dates
const dayMin = (days: Array<Date | undefined>): Date | undefined => {
  return filterNonNullable(days).reduce<Date | undefined>((acc, day) => {
    return pickMaybeDay(acc, day, isBefore);
  }, undefined);
};

const dayMax = (days: Array<Date | undefined>): Date | undefined => {
  return filterNonNullable(days).reduce<Date | undefined>((acc, day) => {
    return pickMaybeDay(acc, day, isAfter);
  }, undefined);
};

// Returns the last possible reservation date for the given reservation unit
const getLastPossibleReservationDate = (
  reservationUnit?: ReservationUnitByPkType
): Date | null => {
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
  const endDateTime = reservableTimeSpans.at(-1)?.endDatetime ?? undefined;
  const lastOpeningDate = endDateTime ? new Date(endDateTime) : new Date();
  return (
    dayMin([
      reservationUnitNotReservable,
      lastPossibleReservationDate,
      lastOpeningDate,
    ]) ?? null
  );
};

type AvailableTimesProps = {
  day: Date;
  duration: number;
  isSlotReservable: (start: Date, end: Date) => boolean;
  fromStartOfDay?: boolean;
  reservationUnit?: ReservationUnitByPkType;
  slots?: string[];
};

// Returns an array of available times for the given duration and day
// TODO this is really slow (especially if called from a loop)
const getAvailableTimesForDay = ({
  day,
  duration,
  isSlotReservable,
  reservationUnit,
}: AvailableTimesProps): string[] => {
  if (reservationUnit == null) return [];
  const [timeHours, timeMinutesRaw] = [0, 0];

  const timeMinutes = timeMinutesRaw > 59 ? 59 : timeMinutesRaw;
  const { reservableTimeSpans: spans, reservationStartInterval: interval } =
    reservationUnit;
  return getPossibleTimesForDay(spans, interval, day)
    .map((n) => {
      const [slotHours, slotMinutes] = n.split(":").map(Number);
      const start = new Date(day);
      start.setHours(slotHours, slotMinutes, 0, 0);
      const end = addMinutes(start, duration ?? 0);
      const startTime = new Date(day);
      startTime.setHours(timeHours, timeMinutes, 0, 0);

      return isSlotReservable(start, end) && !isBefore(start, startTime)
        ? n
        : null;
    })
    .filter((n): n is NonNullable<typeof n> => n != null);
};

// Returns the next available time, after the given time (Date object)
const getNextAvailableTime = (props: AvailableTimesProps): Date | null => {
  const { day, reservationUnit, slots } = props;
  if (reservationUnit == null) {
    return null;
  }
  const {
    reservableTimeSpans,
    reservationsMinDaysBefore,
    reservationsMaxDaysBefore,
  } = reservationUnit;

  const today = addDays(new Date(), reservationsMinDaysBefore ?? 0);
  const possibleEndDay = getLastPossibleReservationDate(reservationUnit);
  const endDay = possibleEndDay ? addDays(possibleEndDay, 1) : undefined;
  const minDay = dayMax([today, day]) ?? today;

  // Find the first possible day
  const interval = filterNonNullable(reservableTimeSpans).find((x) =>
    isInTimeSpan(minDay, x)
  );
  if (!interval?.startDatetime || !interval.endDatetime) {
    return null;
  }
  if (endDay && endDay < new Date(interval.endDatetime) && endDay < minDay) {
    return null;
  }

  const startDay = dayMax([new Date(interval.startDatetime), minDay]) ?? minDay;
  const daysToGenerate = reservationsMaxDaysBefore ?? 180;
  const days = Array.from({ length: daysToGenerate }, (_, i) =>
    addDays(startDay, i)
  );

  // Find the first possible time for that day, continue for each day until we find one
  for (const singleDay of days) {
    const availableTimesForDay =
      slots ??
      getAvailableTimesForDay({
        ...props,
        day: singleDay,
        fromStartOfDay: true,
        reservationUnit,
      });
    if (availableTimesForDay.length > 0) {
      const [hours, minutes] = availableTimesForDay[0]
        .toString()
        .split(":")
        .map(Number);
      singleDay.setHours(hours, minutes, 0, 0);
      return singleDay;
    }
  }

  return null;
};

export { dayMax, getNextAvailableTime, getLastPossibleReservationDate };
