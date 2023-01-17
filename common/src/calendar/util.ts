import {
  addDays,
  addMinutes,
  addSeconds,
  areIntervalsOverlapping,
  differenceInSeconds,
  format,
  getISODay,
  isAfter,
  isBefore,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { TFunction } from "next-i18next";
import {
  ApplicationRoundType,
  OpeningTimesType,
  ReservationType,
  ReservationUnitByPkType,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationUnitType,
} from "../../types/gql-types";
import {
  CalendarEventBuffer,
  SlotProps,
  ApplicationEvent,
  OptionType,
  PendingReservation,
  ApplicationRound,
} from "../../types/common";
import {
  convertHMSToSeconds,
  endOfWeek,
  formatSecondDuration,
  parseDate,
  secondsToHms,
  startOfWeek,
  toApiDate,
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

const areOpeningTimesAvailable = (
  openingHours: OpeningTimesType[],
  slotDate: Date
): boolean => {
  return !!openingHours?.some((oh) => {
    const startDate = oh.date;
    const startDateTime = new Date(`${startDate}T${oh.startTime}`);
    const endDateTime = new Date(`${startDate}T${oh.endTime}`);

    return (
      toApiDate(slotDate) === startDate?.toString() &&
      slotDate < endDateTime &&
      startDateTime.getDay() === slotDate.getDay() &&
      startDateTime.getHours() <= slotDate.getHours() &&
      endDateTime.getHours() >= slotDate.getHours()
    );
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
  reservationsMinDaysBefore = 0,
  reservationBegins?: Date,
  reservationEnds?: Date
): boolean => {
  return reservationsMinDaysBefore
    ? isAfter(
        start,
        startOfDay(addDays(new Date(), reservationsMinDaysBefore))
      ) &&
        isSlotWithinReservationTime(start, reservationBegins, reservationEnds)
    : isAfter(start, new Date()) &&
        isSlotWithinReservationTime(start, reservationBegins, reservationEnds);
};

const doesSlotCollideWithApplicationRounds = (
  applicationRounds: ApplicationRound[] | ApplicationRoundType[] = [],
  slot: Date
): boolean => {
  if (applicationRounds?.length < 1) return false;
  return applicationRounds?.some((applicationRound) =>
    isWithinInterval(slot, {
      start: new Date(applicationRound.reservationPeriodBegin),
      end: new Date(applicationRound.reservationPeriodEnd).setHours(23, 59, 59),
    })
  );
};

export const areSlotsReservable = (
  slots: Date[],
  openingHours: OpeningTimesType[],
  activeApplicationRounds: ApplicationRound[] | ApplicationRoundType[] = [],
  reservationBegins?: Date,
  reservationEnds?: Date,
  reservationsMinDaysBefore = 0
): boolean => {
  return slots.every((slot) => {
    const slotDate = new Date(slot);
    return (
      areOpeningTimesAvailable(openingHours, slotDate) &&
      isSlotWithinTimeframe(
        slotDate,
        reservationsMinDaysBefore,
        reservationBegins,
        reservationEnds
      ) &&
      !doesSlotCollideWithApplicationRounds(activeApplicationRounds, slot)
    );
  });
};

export const doReservationsCollide = (
  reservations: ReservationType[] = [],
  newReservation: { start: Date; end: Date }
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
  const start = convertHMSToSeconds(startTime?.substring(0, 5));
  const end = convertHMSToSeconds(endTime?.substring(0, 5));
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

  if (!intervalSeconds || start === null || !end || start >= end) return [];

  for (let i = start; i <= end; i += intervalSeconds) {
    const { h, m, s } = secondsToHms(i);
    intervals.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`
    );
  }

  return intervals.filter((n) => n.substring(0, 5) !== endTime);
};

export const isStartTimeWithinInterval = (
  start: Date,
  openingTimes: OpeningTimesType[],
  interval?: ReservationUnitsReservationUnitReservationStartIntervalChoices
): boolean => {
  if (openingTimes?.length < 1) return false;
  if (!interval) return true;

  const startHMS = `${toUIDate(start, "HH:mm")}:00`;
  const { startTime: dayStartTime, endTime: dayEndTime } =
    openingTimes?.find((n) => n.date === toApiDate(start)) || {};

  const [startHours, startMinutes] = dayStartTime?.split(":").map(Number) || [
    0, 0,
  ];
  const startTime = new Date();
  startTime.setUTCHours(startHours, startMinutes, 0);

  const [endHours, endMinutes] = dayEndTime?.split(":").map(Number) || [0, 0];
  const endTime = new Date();
  endTime.setUTCHours(endHours, endMinutes, 0);

  return getDayIntervals(
    format(startTime, "HH:mm"),
    format(endTime, "HH:mm"),
    interval
  ).includes(startHMS);
};

export const getSlotPropGetter =
  (
    openingHours: OpeningTimesType[],
    activeApplicationRounds: ApplicationRound[] | ApplicationRoundType[],
    reservationBegins: Date,
    reservationEnds: Date,
    reservationsMinDaysBefore?: number,
    customValidation?: (arg: Date) => boolean
  ) =>
  (date: Date): SlotProps => {
    switch (
      areSlotsReservable(
        [date],
        openingHours,
        activeApplicationRounds,
        reservationBegins,
        reservationEnds,
        reservationsMinDaysBefore
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

export const getTimeslots = (
  interval: ReservationUnitsReservationUnitReservationStartIntervalChoices
): number => {
  switch (interval) {
    case "INTERVAL_90_MINS":
    case "INTERVAL_60_MINS":
    case "INTERVAL_30_MINS":
    case "INTERVAL_15_MINS":
    default:
      return 2;
  }
};

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
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
  }
): boolean => {
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

  const bufferedNewReservationInterval = {
    start: bufferedNewReservation.start,
    end: bufferedNewReservation.end,
  };

  return areIntervalsOverlapping(
    reservationInterval,
    bufferedNewReservationInterval
  );
};

export const doBuffersCollide = (
  reservations: ReservationType[] = [],
  newReservation: {
    start: Date;
    end: Date;
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
  }
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
  reservationUnit: ReservationUnitByPkType,
  now = new Date()
): boolean => {
  const isAfterReservationStart =
    now >= new Date(reservationUnit.reservationBegins as string);
  const isBeforeReservationEnd =
    now <= new Date(reservationUnit.reservationEnds as string);

  return (
    !!reservationUnit.metadataSet?.supportedFields?.length &&
    !!reservationUnit.openingHours?.openingTimes?.length &&
    reservationUnit.openingHours?.openingTimes?.length > 0 &&
    !!reservationUnit.minReservationDuration &&
    !!reservationUnit.maxReservationDuration &&
    (isAfterReservationStart || !reservationUnit.reservationBegins) &&
    (isBeforeReservationEnd || !reservationUnit.reservationEnds)
  );
};

export const isReservationStartInFuture = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType,
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
  reservationUnit: ReservationUnitType | ReservationUnitByPkType
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

export const getMaxReservation = (
  begin: Date,
  duration: number
): { begin: Date; end: Date } => {
  const slots = duration / (30 * 60);
  const end = addMinutes(begin, slots * 30);
  return { begin, end };
};

export const getAvailableTimes = (
  reservationUnit: ReservationUnitByPkType,
  date: Date
): string[] => {
  const { openingHours, reservationStartInterval } = reservationUnit;

  const openingTimes = openingHours?.openingTimes?.find(
    (n) => n?.date === toUIDate(date, "yyyy-MM-dd")
  );

  const { startTime, endTime } = openingTimes || {};

  const intervals = getDayIntervals(
    startTime as string,
    endTime as string,
    reservationStartInterval
  );

  const times: string[] = intervals.map((val) => {
    const [startHours, startMinutes] = val.split(":").map(Number);

    const start = new Date(date);
    start.setHours(startHours, startMinutes);

    return toUIDate(start, "HH:mm");
  });

  return times;
};

export const getOpenDays = (
  reservationUnit: ReservationUnitByPkType
): Date[] => {
  const { openingHours } = reservationUnit;

  const openDays: Date[] = [];

  openingHours?.openingTimes?.forEach((openingTime) => {
    if (openingTime && openingTime.state === "open") {
      const date = new Date(openingTime?.date as string);
      openDays.push(date);
    }
  });

  return openDays.sort((a, b) => a.getTime() - b.getTime());
};
