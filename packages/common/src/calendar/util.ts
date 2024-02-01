import {
  addDays,
  addMinutes,
  addSeconds,
  areIntervalsOverlapping,
  differenceInMinutes,
  differenceInSeconds,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  roundToNearestMinutes,
  set,
  startOfDay,
} from "date-fns";
import { TFunction } from "next-i18next";
import {
  type ReservableTimeSpanType,
  ReservationState,
  type ReservationType,
  type ReservationUnitType,
  ReservationKind,
  type ReservationStartInterval,
} from "../../types/gql-types";
import {
  type CalendarEventBuffer,
  type OptionType,
  type PendingReservation,
  type ReservationUnitNode,
  type SlotProps,
} from "../../types/common";
import {
  convertHMSToSeconds,
  endOfWeek,
  secondsToHms,
  startOfWeek,
  toUIDate,
} from "../common/util";

export const longDate = (date: Date, t: TFunction): string =>
  t("common:dateLong", {
    date,
  });

export const getWeekOption = (date: Date, t: TFunction): OptionType => {
  const begin = startOfWeek(date);
  const end = endOfWeek(date);
  const monthName = t(`common:month.${begin.getMonth()}`);
  return {
    label: `${monthName} ${longDate(begin, t)} - ${longDate(end, t)} `,
    value: begin.getTime(),
  };
};

export const displayDate = (date: Date, t: TFunction): string => {
  const weekday = t(`common:weekDay.${date.getDay()}`);
  return `${weekday} ${longDate(date, t)}`;
};

export const isReservationShortEnough = (
  start: Date,
  end: Date,
  maxDuration: number
): boolean => {
  if (!maxDuration) return true;

  const reservationDuration = differenceInSeconds(
    new Date(end),
    new Date(start)
  );
  return reservationDuration <= maxDuration;
};

export const isReservationLongEnough = (
  start: Date,
  end: Date,
  minDuration: number
): boolean => {
  if (!minDuration) return true;

  const reservationDuration = differenceInSeconds(
    new Date(end),
    new Date(start)
  );
  return reservationDuration >= minDuration;
};

export const areReservableTimesAvailable = (
  reservableTimeSpans: ReservableTimeSpanType[],
  slotDate: Date,
  validateEnding = false
): boolean => {
  return reservableTimeSpans?.some((rts) => {
    const { startDatetime, endDatetime } = rts;

    if (!startDatetime || !endDatetime) return false;

    const startDate = new Date(startDatetime);
    const endDate = new Date(endDatetime);

    if (validateEnding) {
      return startDate <= slotDate && endDate > slotDate;
    }
    return startDate <= slotDate;
  });
};

export const isSlotWithinReservationTime = (
  start: Date,
  reservationBegins?: Date,
  reservationEnds?: Date
): boolean => {
  return (
    (!reservationBegins || isAfter(start, new Date(reservationBegins))) &&
    (!reservationEnds || isBefore(start, new Date(reservationEnds)))
  );
};

export const isSlotWithinTimeframe = (
  start: Date,
  minDaysBefore: number,
  maxDaysBefore: number,
  reservationBegins?: Date,
  reservationEnds?: Date
) => {
  const isLegalTimeframe =
    isAfter(start, new Date()) &&
    isSlotWithinReservationTime(start, reservationBegins, reservationEnds);
  const maxDay = addDays(new Date(), maxDaysBefore);
  // if max days === 0 => latest = today
  const isBeforeMaxDaysBefore = maxDaysBefore === 0 || !isAfter(start, maxDay);
  const minDay = addDays(new Date(), minDaysBefore);
  const isAfterMinDaysBefore = !isBefore(start, startOfDay(minDay));
  return isLegalTimeframe && isAfterMinDaysBefore && isBeforeMaxDaysBefore;
};

export type RoundPeriod = {
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
};
const doesSlotCollideWithApplicationRounds = (
  slot: Date,
  rounds: RoundPeriod[]
): boolean => {
  if (rounds.length < 1) return false;

  return rounds.some((round) =>
    isWithinInterval(slot, {
      start: new Date(round.reservationPeriodBegin),
      end: new Date(round.reservationPeriodEnd).setHours(23, 59, 59),
    })
  );
};

export const getIntervalMinutes = (
  reservationStartInterval: ReservationStartInterval
): number => {
  switch (reservationStartInterval) {
    case "INTERVAL_15_MINS":
      return 15;
    case "INTERVAL_30_MINS":
      return 30;
    case "INTERVAL_60_MINS":
      return 60;
    case "INTERVAL_90_MINS":
      return 90;
    case "INTERVAL_120_MINS":
      return 120;
    case "INTERVAL_180_MINS":
      return 180;
    case "INTERVAL_240_MINS":
      return 240;
    case "INTERVAL_300_MINS":
      return 300;
    case "INTERVAL_360_MINS":
      return 360;
    case "INTERVAL_420_MINS":
      return 420;
    default:
      return 0;
  }
};

export const generateSlots = (
  start: Date,
  end: Date,
  reservationStartInterval: ReservationStartInterval
): Date[] => {
  if (!start || !end || !reservationStartInterval) return [];

  const slots = [];
  const intervalMinutes = getIntervalMinutes(reservationStartInterval);

  for (let i = new Date(start); i <= end; i = addMinutes(i, intervalMinutes)) {
    slots.push(i);
  }

  return slots;
};

export const areSlotsReservable = (
  slots: Date[],
  reservableTimeSpans: ReservableTimeSpanType[],
  reservationsMinDaysBefore: number,
  reservationsMaxDaysBefore: number,
  reservationBegins?: Date,
  reservationEnds?: Date,
  activeApplicationRounds: RoundPeriod[] = []
): boolean => {
  return slots.every(
    (slotDate) =>
      // NOTE seems that the order of checks improves performance
      isSlotWithinTimeframe(
        slotDate,
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
        reservationBegins,
        reservationEnds
      ) &&
      areReservableTimesAvailable(reservableTimeSpans, slotDate, true) &&
      !doesSlotCollideWithApplicationRounds(slotDate, activeApplicationRounds)
  );
};

export const isRangeReservable = ({
  range,
  reservableTimeSpans,
  reservationBegins,
  reservationEnds,
  reservationsMinDaysBefore = 0,
  reservationsMaxDaysBefore = 0,
  activeApplicationRounds = [],
  reservationStartInterval,
}: {
  range: Date[];
  reservableTimeSpans: ReservableTimeSpanType[];
  reservationsMinDaysBefore: number;
  reservationsMaxDaysBefore: number;
  reservationBegins?: Date;
  reservationEnds?: Date;
  activeApplicationRounds: RoundPeriod[];
  reservationStartInterval: ReservationStartInterval;
}): boolean => {
  const slots = generateSlots(range[0], range[1], reservationStartInterval);

  if (
    !slots.every((slot) =>
      areReservableTimesAvailable(reservableTimeSpans, slot, true)
    )
  ) {
    return false;
  }

  const isSlotReservable = (slot: Date) => {
    const isInFrame = isSlotWithinTimeframe(
      slot,
      reservationsMinDaysBefore,
      reservationsMaxDaysBefore,
      reservationBegins,
      reservationEnds
    );
    const collides = doesSlotCollideWithApplicationRounds(
      slot,
      activeApplicationRounds
    );
    return isInFrame && !collides;
  };

  return range.every((slot) => isSlotReservable(slot));
};

export const doReservationsCollide = (
  newReservation: { start: Date; end: Date },
  reservations: ReservationType[] = []
): boolean => {
  const { start, end } = newReservation;
  return reservations.some((reservation) =>
    areIntervalsOverlapping(
      {
        start: new Date(reservation.begin),
        end: new Date(reservation.end),
      },
      { start, end }
    )
  );
};

export const getDayIntervals = (
  startTime: string,
  endTime: string,
  interval: ReservationStartInterval
): string[] => {
  // normalize end time to allow comparison
  const normalizedEndTime = endTime === "00:00" ? "23:59" : endTime;

  const start = convertHMSToSeconds(startTime?.substring(0, 5));
  const end = convertHMSToSeconds(normalizedEndTime?.substring(0, 5));
  const intervals: string[] = [];

  let intervalSeconds = 0;
  switch (interval) {
    case "INTERVAL_15_MINS":
      intervalSeconds = 15 * 60;
      break;
    case "INTERVAL_30_MINS":
      intervalSeconds = 30 * 60;
      break;
    case "INTERVAL_60_MINS":
      intervalSeconds = 60 * 60;
      break;
    case "INTERVAL_90_MINS":
      intervalSeconds = 90 * 60;
      break;
    case "INTERVAL_120_MINS":
      intervalSeconds = 120 * 60;
      break;
    case "INTERVAL_180_MINS":
      intervalSeconds = 180 * 60;
      break;
    case "INTERVAL_240_MINS":
      intervalSeconds = 240 * 60;
      break;
    case "INTERVAL_300_MINS":
      intervalSeconds = 300 * 60;
      break;
    case "INTERVAL_360_MINS":
      intervalSeconds = 360 * 60;
      break;
    case "INTERVAL_420_MINS":
      intervalSeconds = 420 * 60;
      break;
    default:
  }

  if (!intervalSeconds || start == null || !end || start >= end) return [];

  for (let i = start; i <= end; i += intervalSeconds) {
    const { h, m, s } = secondsToHms(i);
    intervals.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`
    );
  }

  return intervals.filter((n) => n.substring(0, 5) !== normalizedEndTime);
};

/// TODO this function is still a performance problem (looking at the flame graph)
/// The filtering helps, but the real solution would be to refactor the TimeSpan construction
/// to the Page load: do 7 / 30 days at a time, not all intervals (2 years)
export const isStartTimeWithinInterval = (
  start: Date,
  reservableTimeSpans: ReservableTimeSpanType[],
  interval?: ReservationStartInterval
): boolean => {
  if (reservableTimeSpans.length < 1) return false;
  if (!interval) return true;

  // TODO this is awfully similar to the one in QuickReservation
  // TODO could early break if the start is after the last interval
  // TODO this part should be refactored to either the Node backend or on Page load
  // split the intervals into days so we can just do a hash table search
  type TimeFrame = { start: Date; end: Date };
  const timeframeArr = reservableTimeSpans
    .map((n) =>
      n.startDatetime != null && n.endDatetime != null
        ? { start: new Date(n.startDatetime), end: new Date(n.endDatetime) }
        : null
    )
    .filter((n): n is NonNullable<typeof n> => n != null)
    .filter((n) => {
      if (n.start > start) return false;
      return n.end >= start;
    })
    .filter((n) => {
      const begin = isSameDay(n.start, start)
        ? n.start
        : set(start, { hours: 0, minutes: 0 });
      const end = isSameDay(n.end, start)
        ? new Date(n.end)
        : set(start, { hours: 23, minutes: 59 });
      return isWithinInterval(start, { start: begin, end });
    });

  const timeframe = timeframeArr.reduce<TimeFrame | null>((acc, curr) => {
    const begin = isSameDay(new Date(curr.start), start)
      ? new Date(curr.start)
      : set(start, { hours: 0, minutes: 0 });
    const end = isSameDay(new Date(curr.end), start)
      ? new Date(curr.end)
      : set(start, { hours: 23, minutes: 59 });
    return {
      start: acc?.start && acc.start < begin ? acc.start : begin,
      end: acc?.end && acc.end > end ? acc.end : end,
    };
  }, null);

  if (timeframe?.start == null || timeframe.end == null) {
    return false;
  }

  const startHMS = `${toUIDate(start, "HH:mm")}:00`;
  return getDayIntervals(
    format(timeframe.start, "HH:mm"),
    format(timeframe.end, "HH:mm"),
    interval
  ).includes(startHMS);
};

export const getMinReservation = ({
  begin,
  reservationStartInterval,
  minReservationDuration = 0,
}: {
  begin: Date;
  reservationStartInterval: ReservationStartInterval;
  minReservationDuration?: number;
}): { begin: Date; end: Date } => {
  const minDurationMinutes = minReservationDuration / 60;
  const intervalMinutes = getIntervalMinutes(reservationStartInterval);

  const minutes =
    minDurationMinutes < intervalMinutes ? intervalMinutes : minDurationMinutes;
  return { begin, end: addMinutes(begin, minutes) };
};

export const getValidEndingTime = ({
  start,
  end,
  reservationStartInterval,
}: {
  start: Date;
  end: Date;
  reservationStartInterval: ReservationStartInterval;
}): Date | null => {
  if (!start || !end || !reservationStartInterval) return null;

  const intervalMinutes = getIntervalMinutes(reservationStartInterval);

  const durationMinutes = differenceInMinutes(end, start);
  const remainder = durationMinutes % intervalMinutes;

  if (remainder !== 0) {
    const wholeIntervals = Math.abs(
      Math.floor(durationMinutes / intervalMinutes)
    );

    return addMinutes(start, wholeIntervals * intervalMinutes);
  }

  return end;
};

export const getSlotPropGetter =
  ({
    reservableTimeSpans,
    activeApplicationRounds,
    reservationBegins,
    reservationEnds,
    reservationsMinDaysBefore,
    reservationsMaxDaysBefore,
    customValidation,
  }: {
    reservableTimeSpans: ReservableTimeSpanType[];
    activeApplicationRounds: RoundPeriod[];
    reservationsMinDaysBefore: number;
    reservationsMaxDaysBefore: number;
    customValidation?: (arg: Date) => boolean;
    reservationBegins?: Date;
    reservationEnds?: Date;
  }) =>
  (date: Date): SlotProps => {
    if (
      areSlotsReservable(
        [date],
        reservableTimeSpans,
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
        reservationBegins,
        reservationEnds,
        activeApplicationRounds
      ) &&
      (customValidation ? customValidation(date) : true)
    ) {
      return {};
    }

    return {
      className: "rbc-timeslot-inactive",
    };
  };

// TimeSlots change the Calendar view. How many intervals are shown i.e. every half an hour, every hour
// we use every hour only => 2
// TODO migrate users to constant over a function call
export const SLOTS_EVERY_HOUR = 2;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getTimeslots = (interval?: unknown): number => SLOTS_EVERY_HOUR;

export const getBufferedEventTimes = (
  start: Date,
  end: Date,
  bufferTimeBefore?: number,
  bufferTimeAfter?: number
): { start: Date; end: Date } => {
  const before = addSeconds(start, -1 * (bufferTimeBefore ?? 0));
  const after = addSeconds(end, bufferTimeAfter ?? 0);
  return { start: before, end: after };
};

export const doesBufferCollide = (
  reservation: ReservationType,
  newReservation: {
    start: Date;
    end: Date;
    isBlocked?: boolean;
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
  }
): boolean => {
  if (newReservation.isBlocked) return false;

  const newReservationStartBuffer =
    reservation.bufferTimeAfter &&
    reservation.bufferTimeAfter > (newReservation.bufferTimeBefore || 0)
      ? reservation.bufferTimeAfter
      : newReservation.bufferTimeBefore;
  const newReservationEndBuffer =
    reservation.bufferTimeBefore &&
    reservation.bufferTimeBefore > (newReservation.bufferTimeAfter || 0)
      ? reservation.bufferTimeBefore
      : newReservation.bufferTimeAfter;

  const bufferedNewReservation = getBufferedEventTimes(
    newReservation.start,
    newReservation.end,
    newReservationStartBuffer,
    newReservationEndBuffer
  );

  const reservationInterval = {
    start: new Date(reservation.begin),
    end: new Date(reservation.end),
  };

  const newReservationInterval = reservation.isBlocked
    ? { start: newReservation.start, end: newReservation.end }
    : {
        start: bufferedNewReservation.start,
        end: bufferedNewReservation.end,
      };

  return areIntervalsOverlapping(reservationInterval, newReservationInterval);
};

export const doBuffersCollide = (
  newReservation: {
    start: Date;
    end: Date;
    isBlocked?: boolean;
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
  },
  reservations: ReservationType[] = []
): boolean => {
  return reservations.some((reservation) =>
    doesBufferCollide(reservation, newReservation)
  );
};

export const getEventBuffers = (
  events: (PendingReservation | ReservationType)[]
): CalendarEventBuffer[] => {
  const buffers: CalendarEventBuffer[] = [];
  events.forEach((event) => {
    if (!event.begin || !event.end) return;
    const { bufferTimeBefore, bufferTimeAfter } = event;
    const begin = new Date(event.begin);
    const end = new Date(event.end);

    if (bufferTimeBefore) {
      buffers.push({
        start: addSeconds(begin, -1 * Number(bufferTimeBefore)),
        end: begin,
        event: { ...event, state: "BUFFER" },
      });
    }
    if (bufferTimeAfter) {
      buffers.push({
        start: end,
        end: addSeconds(end, Number(bufferTimeAfter)),
        event: { ...event, state: "BUFFER" },
      });
    }
  });

  return buffers;
};

export const isReservationUnitReservable = (
  reservationUnit?: ReservationUnitType | null
): [false, string] | [true] => {
  if (!reservationUnit) {
    return [false, "reservationUnit is null"];
  }
  const {
    reservationState,
    minReservationDuration,
    maxReservationDuration,
    reservationKind,
  } = reservationUnit;

  switch (reservationState) {
    case ReservationState.Reservable:
    case ReservationState.ScheduledClosing: {
      const resBegins = reservationUnit.reservationBegins
        ? new Date(reservationUnit.reservationBegins)
        : null;
      const hasSupportedFields =
        (reservationUnit.metadataSet?.supportedFields?.length ?? 0) > 0;
      const hasReservableTimes =
        (reservationUnit.reservableTimeSpans?.length ?? 0) > 0;
      if (!hasSupportedFields) {
        return [false, "reservationUnit has no supported fields"];
      }
      if (!hasReservableTimes) {
        return [false, "reservationUnit has no reservable times"];
      }
      if (resBegins && resBegins > new Date()) {
        return [false, "reservationUnit reservation begins in future"];
      }
      if (!minReservationDuration || !maxReservationDuration) {
        return [false, "reservationUnit has no min/max reservation duration"];
      }
      if (reservationKind === ReservationKind.Season) {
        return [
          false,
          "reservationUnit is only available for seasonal booking",
        ];
      }
      return [true];
    }
    default:
      return [false, "reservationUnit is not reservable"];
  }
};

export const isReservationStartInFuture = (
  reservationUnit: ReservationUnitNode,
  now = new Date()
): boolean => {
  const bufferDays = reservationUnit.reservationsMaxDaysBefore ?? 0;
  const negativeBuffer = Math.abs(bufferDays) * -1;

  return (
    !!reservationUnit.reservationBegins &&
    now < addDays(new Date(reservationUnit.reservationBegins), negativeBuffer)
  );
};

export const getNormalizedReservationBeginTime = (
  reservationUnit: ReservationUnitNode
): string => {
  const bufferDays = reservationUnit.reservationsMaxDaysBefore ?? 0;
  const negativeBuffer = Math.abs(bufferDays) * -1;

  return addDays(
    new Date(reservationUnit.reservationBegins as string),
    negativeBuffer
  ).toISOString();
};

export const getOpenDays = (reservationUnit: ReservationUnitType): Date[] => {
  const { reservableTimeSpans } = reservationUnit;

  const openDays: Date[] = [];

  reservableTimeSpans?.forEach((reservableTime) => {
    if (reservableTime) {
      const date = new Date(String(reservableTime.startDatetime));
      openDays.push(date);
    }
  });

  return openDays.sort((a, b) => a.getTime() - b.getTime());
};

export const getNewReservation = ({
  start,
  end,
  reservationUnit,
}: {
  reservationUnit: ReservationUnitNode;
  start: Date;
  end: Date;
}): PendingReservation => {
  const { minReservationDuration, reservationStartInterval } = reservationUnit;

  const { end: minEnd } = getMinReservation({
    begin: start,
    minReservationDuration: minReservationDuration || 0,
    reservationStartInterval,
  });

  let normalizedEnd =
    getValidEndingTime({
      start,
      end: roundToNearestMinutes(end),
      reservationStartInterval,
    }) ?? roundToNearestMinutes(end);

  if (normalizedEnd < minEnd) {
    normalizedEnd = minEnd;
  }

  return {
    begin: start?.toISOString(),
    end: normalizedEnd?.toISOString(),
  };
};
