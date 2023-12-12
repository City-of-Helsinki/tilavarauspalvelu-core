import {
  addDays,
  addMinutes,
  addSeconds,
  areIntervalsOverlapping,
  differenceInMinutes,
  differenceInSeconds,
  format,
  getISODay,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  roundToNearestMinutes,
  startOfDay,
} from "date-fns";
import { TFunction } from "next-i18next";
import {
  type ReservableTimeSpanType,
  type ReservationType,
  type ReservationUnitByPkType,
  type ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationState,
} from "../../types/gql-types";
import {
  type CalendarEventBuffer,
  type SlotProps,
  type ApplicationEvent,
  type OptionType,
  type PendingReservation,
  type ReservationUnitNode,
} from "../../types/common";
import {
  convertHMSToSeconds,
  endOfWeek,
  formatSecondDuration,
  parseDate,
  secondsToHms,
  startOfWeek,
  toUIDate,
} from "../common/util";
import { filterNonNullable } from "../helpers";

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

export const getWeekOptions = (
  t: TFunction,
  applicationEvent: ApplicationEvent
): OptionType[] => {
  const { begin, end } = applicationEvent;
  const beginDate = parseDate(begin as string);
  const endDate = parseDate(end as string);
  const endSunday = addDays(endDate, getISODay(endDate));
  let date = beginDate;
  const options = [] as OptionType[];
  while (isBefore(date, endSunday)) {
    options.push(getWeekOption(date, t));
    date = addDays(date, 7);
  }
  return options;
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
  reservableTimes: ReservableTimeSpanType[],
  slotDate: Date,
  validateEnding = false
): boolean => {
  return !!reservableTimes?.some((oh) => {
    const { startDatetime, endDatetime } = oh;

    if (!startDatetime || !endDatetime) return false;

    const startDate = new Date(startDatetime);
    const endDate = new Date(endDatetime);

    return validateEnding
      ? startDate <= slotDate && endDate >= slotDate
      : startDate <= slotDate;
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
  reservationsMinDaysBefore: number,
  reservationsMaxDaysBefore: number,
  reservationBegins?: Date,
  reservationEnds?: Date
) => {
  const isLegalTimeframe =
    isAfter(start, new Date()) &&
    isSlotWithinReservationTime(start, reservationBegins, reservationEnds);
  const latest = addDays(new Date(), reservationsMaxDaysBefore);
  // if max days === 0 => latest = today
  const isBeforeMaxDaysBefore =
    reservationsMaxDaysBefore === 0 || !isAfter(start, latest);
  const earliestReservationStart = addDays(
    new Date(),
    reservationsMinDaysBefore
  );
  const isAfterMinDaysBefore = !isBefore(
    start,
    startOfDay(earliestReservationStart)
  );
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
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices
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
    default:
      return 0;
  }
};

export const generateSlots = (
  start: Date,
  end: Date,
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices
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
  reservableTimes: ReservableTimeSpanType[],
  reservationsMinDaysBefore: number,
  reservationsMaxDaysBefore: number,
  reservationBegins?: Date,
  reservationEnds?: Date,
  activeApplicationRounds: RoundPeriod[] = [],
  validateEnding = false
): boolean => {
  return slots.every((slot) => {
    const slotDate = new Date(slot);

    return (
      areReservableTimesAvailable(reservableTimes, slotDate, validateEnding) &&
      isSlotWithinTimeframe(
        slotDate,
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
        reservationBegins,
        reservationEnds
      ) &&
      !doesSlotCollideWithApplicationRounds(slot, activeApplicationRounds)
    );
  });
};

export const isRangeReservable = ({
  range,
  reservableTimes,
  reservationBegins,
  reservationEnds,
  reservationsMinDaysBefore = 0,
  reservationsMaxDaysBefore = 0,
  activeApplicationRounds = [],
  reservationStartInterval,
}: {
  range: Date[];
  reservableTimes: ReservableTimeSpanType[];
  reservationsMinDaysBefore: number;
  reservationsMaxDaysBefore: number;
  reservationBegins?: Date;
  reservationEnds?: Date;
  activeApplicationRounds: RoundPeriod[];
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
}): boolean => {
  const slots = generateSlots(range[0], range[1], reservationStartInterval);

  if (
    !slots.every((slot) =>
      areReservableTimesAvailable(reservableTimes, slot, true)
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
      { start: new Date(reservation.begin), end: new Date(reservation.end) },
      { start, end }
    )
  );
};

export const getDayIntervals = (
  startTime: string,
  endTime: string,
  interval: ReservationUnitsReservationUnitReservationStartIntervalChoices
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

export const isStartTimeWithinInterval = (
  start: Date,
  reservableTimeSpans: ReservableTimeSpanType[],
  interval?: ReservationUnitsReservationUnitReservationStartIntervalChoices
): boolean => {
  if (reservableTimeSpans?.length < 1) return false;
  if (!interval) return true;

  const startHMS = `${toUIDate(start, "HH:mm")}:00`;
  const timeframe: ReservableTimeSpanType =
    reservableTimeSpans?.find((n) => {
      if (!n.startDatetime || !n.endDatetime) return false;
      const startTime = `${toUIDate(new Date(n.startDatetime), "HH:mm")}:00`;
      const endTime = `${toUIDate(
        addMinutes(new Date(n.endDatetime), -1),
        "HH:mm"
      )}:00`;

      return startTime <= startHMS && endTime > startHMS;
    }) || {};

  return (
    !!timeframe.startDatetime &&
    !!timeframe.endDatetime &&
    getDayIntervals(
      format(new Date(timeframe.startDatetime), "HH:mm"),
      format(new Date(timeframe.endDatetime), "HH:mm"),
      interval
    ).includes(startHMS)
  );
};

export const getMinReservation = ({
  begin,
  reservationStartInterval,
  minReservationDuration = 0,
}: {
  begin: Date;
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
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
  reservationStartInterval: ReservationUnitsReservationUnitReservationStartIntervalChoices;
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
    reservableTimes,
    activeApplicationRounds,
    reservationBegins,
    reservationEnds,
    reservationsMinDaysBefore,
    reservationsMaxDaysBefore,
    currentDate,
    customValidation,
  }: {
    reservableTimes: ReservableTimeSpanType[];
    activeApplicationRounds: RoundPeriod[];
    reservationsMinDaysBefore: number;
    reservationsMaxDaysBefore: number;
    currentDate: Date;
    customValidation?: (arg: Date) => boolean;
    reservationBegins?: Date;
    reservationEnds?: Date;
  }) =>
  (date: Date): SlotProps => {
    const hours = reservableTimes?.filter((n) => {
      if (!n.startDatetime || !n.endDatetime) return false;
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      const nStartDate = new Date(n.startDatetime);
      const nEndDate = new Date(n.endDatetime);
      return nStartDate >= start && nEndDate <= end;
    });
    switch (
      areSlotsReservable(
        [date],
        hours,
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
        reservationBegins,
        reservationEnds,
        activeApplicationRounds
      ) &&
      (customValidation ? customValidation(date) : true)
    ) {
      case true:
        return {};
      default:
        return {
          className: "rbc-timeslot-inactive",
        };
    }
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
  const before = addSeconds(start, -1 * (bufferTimeBefore || 0));
  const after = addSeconds(end, bufferTimeAfter || 0);
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
  reservationUnit?: ReservationUnitByPkType | null
): boolean => {
  if (!reservationUnit) {
    return false;
  }
  const { reservationState, minReservationDuration, maxReservationDuration } =
    reservationUnit;

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
      return (
        hasSupportedFields &&
        hasReservableTimes &&
        (!resBegins || resBegins < new Date()) &&
        !!minReservationDuration &&
        !!maxReservationDuration
      );
    }
    default:
      return false;
  }
};

export const isReservationStartInFuture = (
  reservationUnit: ReservationUnitNode,
  now = new Date()
): boolean => {
  const bufferDays = reservationUnit.reservationsMaxDaysBefore || 0;
  const negativeBuffer = Math.abs(bufferDays) * -1;

  return (
    !!reservationUnit.reservationBegins &&
    now < addDays(new Date(reservationUnit.reservationBegins), negativeBuffer)
  );
};

export const getNormalizedReservationBeginTime = (
  reservationUnit: ReservationUnitNode
): string => {
  const bufferDays = reservationUnit.reservationsMaxDaysBefore || 0;
  const negativeBuffer = Math.abs(bufferDays) * -1;

  return addDays(
    new Date(reservationUnit.reservationBegins as string),
    negativeBuffer
  ).toISOString();
};

export const parseTimeframeLength = (begin: string, end: string): string => {
  const beginDate = new Date(begin);
  const endDate = new Date(end);
  const diff = differenceInSeconds(endDate, beginDate);
  return formatSecondDuration(diff);
};

// Returns an timeslot array (in HH:mm format) with the time-slots that are
// available for reservation on the given date
export const getAvailableTimes = (
  reservationUnit: ReservationUnitByPkType,
  date: Date
): string[] => {
  const allTimes: string[] = [];
  const { reservableTimeSpans, reservationStartInterval } = reservationUnit;
  filterNonNullable(reservableTimeSpans)
    ?.filter(({ startDatetime }) => {
      if (!startDatetime) return false;
      const startDate = new Date(startDatetime);
      return isSameDay(new Date(date), startDate);
    })
    ?.forEach((rts) => {
      if (!rts?.startDatetime || !rts?.endDatetime) return;
      const intervals = getDayIntervals(
        format(new Date(rts.startDatetime), "HH:mm"),
        format(new Date(rts.endDatetime), "HH:mm"),
        reservationStartInterval
      );

      const times: string[] = intervals.map((val) => {
        const [startHours, startMinutes] = val.split(":");

        return `${startHours}:${startMinutes}`;
      });
      allTimes.push(...times);
    });

  return allTimes;
};

export const getOpenDays = (
  reservationUnit: ReservationUnitByPkType
): Date[] => {
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
    }) || roundToNearestMinutes(end);

  if (normalizedEnd < minEnd) {
    normalizedEnd = minEnd;
  }

  return {
    begin: start?.toISOString(),
    end: normalizedEnd?.toISOString(),
  };
};
