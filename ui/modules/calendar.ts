import {
  addDays,
  areIntervalsOverlapping,
  differenceInMinutes,
  getISODay,
  isAfter,
  isBefore,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { TFunction } from "next-i18next";
import { SlotProps } from "../components/calendar/Calendar";
import {
  OpeningTimesType,
  ReservationType,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
} from "./gql-types";
import { ApplicationEvent, ApplicationRound, OptionType } from "./types";
import {
  apiDurationToMinutes,
  convertHMSToSeconds,
  endOfWeek,
  parseDate,
  secondsToHms,
  startOfWeek,
  toApiDate,
  toUIDate,
} from "./util";

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
  maxDuration: string
): boolean => {
  if (!maxDuration) return true;

  const reservationDuration = differenceInMinutes(
    new Date(end),
    new Date(start)
  );
  const maxMinutes = apiDurationToMinutes(maxDuration);
  return reservationDuration <= maxMinutes;
};

export const isReservationLongEnough = (
  start: Date,
  end: Date,
  minDuration: string
): boolean => {
  if (!minDuration) return true;

  const reservationDuration = differenceInMinutes(
    new Date(end),
    new Date(start)
  );
  const minMinutes = apiDurationToMinutes(minDuration);
  return reservationDuration >= minMinutes;
};

const areOpeningTimesAvailable = (
  openingHours: OpeningTimesType[],
  slotDate: Date
) => {
  return !!openingHours?.some((oh) => {
    const startDate = oh.date;
    const startTime = new Date(`${startDate}T${oh.startTime}`);
    const endTime = new Date(`${startDate}T${oh.endTime}`);
    return (
      toApiDate(slotDate) === startDate.toString() &&
      startTime.getDay() === slotDate.getDay() &&
      startTime.getHours() <= slotDate.getHours() &&
      endTime.getHours() >= slotDate.getHours()
    );
  });
};

export const isSlotWithinTimeframe = (start: Date, bufferDays = 0): boolean => {
  return bufferDays
    ? isAfter(start, startOfDay(addDays(new Date(), bufferDays)))
    : isAfter(start, new Date());
};

const doesSlotCollideWithApplicationRounds = (
  applicationRounds: ApplicationRound[],
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
  activeApplicationRounds: ApplicationRound[] = [],
  bufferDays?: number
): boolean => {
  return slots.every((slot) => {
    const slotDate = new Date(slot);
    return (
      areOpeningTimesAvailable(openingHours, slotDate) &&
      isSlotWithinTimeframe(slotDate, bufferDays) &&
      !doesSlotCollideWithApplicationRounds(activeApplicationRounds, slot)
    );
  });
};

export const doReservationsCollide = (
  reservations: ReservationType[],
  newReservation: { start: Date; end: Date }
): boolean => {
  return reservations.some((reservation) =>
    areIntervalsOverlapping(
      { start: new Date(reservation.begin), end: new Date(reservation.end) },
      newReservation
    )
  );
};

export const getDayIntervals = (
  startTime: string,
  endTime: string,
  interval: ReservationUnitsReservationUnitReservationStartIntervalChoices
): string[] => {
  const start = convertHMSToSeconds(startTime);
  const end = convertHMSToSeconds(endTime);
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

  if (!intervalSeconds || start >= end) return [];

  for (let i = start; i <= end; i += intervalSeconds) {
    const { h, m, s } = secondsToHms(i);
    intervals.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`
    );
  }

  return intervals;
};

export const isStartTimeWithinInterval = (
  start: Date,
  openingTimes: OpeningTimesType[],
  interval?: ReservationUnitsReservationUnitReservationStartIntervalChoices
): boolean => {
  if (openingTimes?.length < 1) return false;
  if (!interval) return true;
  const startTime = toUIDate(start, "HH:mm:ss");
  const { startTime: dayStartTime, endTime: dayEndTime } =
    openingTimes.find((n) => n.date === toApiDate(start)) || {};

  return getDayIntervals(
    dayStartTime?.substring(0, 5),
    dayEndTime?.substring(0, 5),
    interval
  ).includes(startTime);
};

export const getSlotPropGetter =
  (
    openingHours: OpeningTimesType[],
    activeApplicationRounds: ApplicationRound[],
    bufferDays?: number
  ) =>
  (date: Date): SlotProps => {
    switch (
      areSlotsReservable(
        [date],
        openingHours,
        activeApplicationRounds,
        bufferDays
      )
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
      return 3;
    case "INTERVAL_60_MINS":
    case "INTERVAL_30_MINS":
    case "INTERVAL_15_MINS":
    default:
      return 2;
  }
};
