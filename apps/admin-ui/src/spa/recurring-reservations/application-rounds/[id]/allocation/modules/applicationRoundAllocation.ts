import { padStart, sortBy } from "lodash";
import {
  type ApplicationEventScheduleNode,
  type ApplicationEventNode,
  ApplicationsApplicationApplicantTypeChoices,
  type ApplicationNode,
  ApplicationEventStatusChoice,
} from "common/types/gql-types";
import type { ApplicationEventSchedulePriority } from "common/types/common";
import i18next from "i18next";
import { filterNonNullable } from "common/src/helpers";

const parseApplicationEventScheduleTime = (
  applicationEventSchedule: ApplicationEventScheduleNode
): string => {
  const weekday = i18next.t(`dayShort.${applicationEventSchedule?.day}`);
  return `${weekday} ${Number(
    applicationEventSchedule.begin.substring(0, 2)
  )}-${Number(applicationEventSchedule.end.substring(0, 2))}`;
};

export type Cell = {
  hour: number;
  minute: number;
  state?: string;
  key: string;
};

export const applicationEventSchedulesToCells = (
  firstSlotStart: number,
  lastSlotStart: number
): Cell[][] => {
  const cells = [] as Cell[][];

  // TODO don't string encode
  // if it's important then use a Map with { day: number, hour: number } as key
  for (let j = 0; j < 7; j += 1) {
    const day = [];
    for (let i = firstSlotStart; i <= lastSlotStart; i += 1) {
      day.push({
        key: `${j}-${i}-00`,
        hour: i,
        minute: 0,
      });
      day.push({
        key: `${j}-${i}-30`,
        hour: i,
        minute: 30,
      });
    }
    cells.push(day);
  }

  return cells;
};

export const getApplicationEventScheduleTimes = (
  applicationEventSchedule: ApplicationEventScheduleNode
): { begin: string; end: string } => {
  return {
    begin: `${applicationEventSchedule?.day}-${Number(
      applicationEventSchedule?.begin.substring(0, 2)
    )}-${applicationEventSchedule?.begin.substring(3, 5)}`,
    end: `${applicationEventSchedule?.day}-${Number(
      applicationEventSchedule?.end.substring(0, 2)
    )}-${applicationEventSchedule?.end.substring(3, 5)}`,
  };
};

export const timeSlotKeyToTime = (slot: string): number => {
  const [, hour, minute] = slot.split("-").map(Number);
  return new Date().setHours(hour, minute);
};

export const doSomeSlotsFitApplicationEventSchedule = (
  applicationEventSchedule: ApplicationEventScheduleNode,
  slots: string[]
): boolean => {
  const { begin, end } = getApplicationEventScheduleTimes(
    applicationEventSchedule
  );

  return slots.some((slot) => {
    const [slotDay, slotHour, slotMinute] = slot.split("-").map(Number);
    const [beginDay, beginHour, beginMinute] = begin.split("-").map(Number);
    const [, endHour, endMinute] = end.split("-").map(Number);
    const slotTime = new Date().setHours(slotHour, slotMinute);
    const beginTime = new Date().setHours(beginHour, beginMinute);
    const endTime = new Date().setHours(endHour, endMinute);
    return slotDay === beginDay && beginTime <= slotTime && endTime > slotTime;
  });
};

export const getTimeSlotOptions = (
  day: string,
  startHours: number,
  startMinutes: number,
  endHours: number,
  endOptions?: boolean
): Array<{ label: string; value: string }> => {
  const timeSlots = [];
  for (let i = startHours; i <= endHours; i += 1) {
    if (endOptions) {
      timeSlots.push({
        label: `${i}:30`,
        value: `${day}-${i}-00`,
      });
      timeSlots.push({
        label: `${i === 23 ? 0 : i + 1}:00`,
        value: `${day}-${i}-30`,
      });
    } else {
      timeSlots.push({
        label: `${i}:00`,
        value: `${day}-${i}-00`,
      });
      timeSlots.push({
        label: `${i}:30`,
        value: `${day}-${i}-30`,
      });
    }
  }

  if (startMinutes === 30) timeSlots.shift();

  return timeSlots;
};

type TimeSlotInput = {
  day: number;
  begin: string;
  end: string;
};

export const getTimeSlots = (
  applicationEventSchedules: TimeSlotInput[]
): string[] => {
  return applicationEventSchedules?.reduce<string[]>((acc, cur) => {
    const { day } = cur;
    const [startHours, startMinutes] = cur.begin.split(":").map(Number);
    const [endHours, endMinutes] = cur.end.split(":").map(Number);
    if (startHours > endHours) {
      return acc;
    }
    if (startHours === endHours && startMinutes >= endMinutes) {
      return acc;
    }
    if (Number.isNaN(startHours) || Number.isNaN(endHours)) {
      return acc;
    }
    // No NaN check for minutes because of equality checks

    const timeSlots: string[] = [];
    for (let i = startHours; i <= endHours; i += 1) {
      timeSlots.push(`${day}-${i}-00`);
      timeSlots.push(`${day}-${i}-30`);
    }

    if (startMinutes === 30) timeSlots.shift();
    if (endMinutes === 0) {
      timeSlots.pop();
      timeSlots.pop();
    }
    if (endMinutes === 30) {
      timeSlots.pop();
    }

    return [...acc, ...timeSlots];
  }, []);
};

export type TimeSlot = { day: number; hour: number };
function decodeTimeSlot(slot: string): TimeSlot {
  const [day, hour, min] = slot.split("-").map(Number);
  return { day, hour: hour + min / 60 };
}

export function encodeTimeSlot(day: number, hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${day}-${h < 10 ? `0${h}` : h}-${m < 10 ? `0${m}` : m}`;
}

function getRequestedTime(
  aes: ApplicationEventScheduleNode
): TimeSlot[] | null {
  const { day, begin, end } = aes;
  if (day == null || begin == null || end == null) {
    // eslint-disable-next-line no-console
    console.warn("Invalid time slot", aes);
    return null;
  }
  return constructTimeRange(day, begin, end);
}

function getAllocatedTime(
  aes: ApplicationEventScheduleNode
): TimeSlot[] | null {
  const { allocatedDay, allocatedBegin, allocatedEnd } = aes;
  if (!allocatedDay || !allocatedBegin || !allocatedEnd) {
    return null;
  }
  return constructTimeRange(allocatedDay, allocatedBegin, allocatedEnd);
}

export function constructTimeSlot(day: number, begin: string): TimeSlot | null {
  const time = parseApiTime(begin);
  if (time == null) {
    return null;
  }
  return { day, hour: time };
}

// returns time in hours from a python time string: "HH:MM:SS"
export function parseApiTime(time: string): number | null {
  const t = time.split(":").map((n) => parseInt(n, 10));
  if (t.length < 2) {
    // eslint-disable-next-line no-console
    console.warn("Invalid time", time);
    return null;
  }
  const [h1, m1] = t;
  if (h1 < 0 || h1 > 23 || m1 < 0 || m1 > 59) {
    // eslint-disable-next-line no-console
    console.warn("Invalid time", time);
    return null;
  }
  return h1 + m1 / 60;
}

export function constructTimeRange(
  day: number,
  begin: string,
  end: string
): TimeSlot[] | null {
  const endTime = parseApiTime(end);
  const beginTime = parseApiTime(begin);
  if (endTime == null || beginTime == null) {
    return null;
  }
  if (beginTime >= endTime) {
    // eslint-disable-next-line no-console
    console.warn("Invalid time range", begin, end);
    return null;
  }
  return [
    { day, hour: beginTime },
    { day, hour: endTime },
  ];
}

// TODO copy paste because we have strings here, and Cells in AllocationCalendar
export function isSlotAccepted(
  aes: ApplicationEventScheduleNode,
  slot: string
): boolean {
  const timeRange = getAllocatedTime(aes);
  if (timeRange == null) {
    // eslint-disable-next-line no-console
    console.warn("Invalid application event", aes);
    return false;
  }
  if (timeRange.length < 2) {
    // eslint-disable-next-line no-console
    console.warn("Invalid application event", aes);
    return false;
  }
  const s = decodeTimeSlot(slot);
  if (timeRange[0].day !== s.day) {
    // eslint-disable-next-line no-console
    console.warn("Invalid time slot string", slot);
    return false;
  }
  const beginTime = timeRange[0].hour;
  const endTime = timeRange[1].hour;
  return s.hour >= beginTime && s.hour < endTime;
}

export const getTimeSeries = (
  day: string,
  begin: string,
  end: string
): string[] => {
  const [, startHours, startMinutes] = begin.split("-").map(Number);
  const [, endHours, endMinutes] = end.split("-").map(Number);
  const timeSlots: string[] = [];
  for (let i = startHours; i <= endHours; i += 1) {
    timeSlots.push(`${day}-${i}-00`);
    timeSlots.push(`${day}-${i}-30`);
  }

  if (startMinutes === 30) timeSlots.shift();
  if (endMinutes === 0) timeSlots.pop();

  return timeSlots;
};

export const getApplicantName = (
  application: ApplicationNode | undefined
): string => {
  return application?.applicantType ===
    ApplicationsApplicationApplicantTypeChoices.Individual
    ? `${application?.contactPerson?.firstName} ${application?.contactPerson?.lastName}`.trim()
    : application?.applicant?.name || "";
};

export function getSlotApplicationEvents(
  slots: string[] | null,
  aes: ApplicationEventNode[] | null
): ApplicationEventNode[] {
  if (!slots) {
    return [];
  }

  return filterNonNullable(aes).filter(
    (ae) =>
      ae?.applicationEventSchedules?.some((schedule) =>
        doSomeSlotsFitApplicationEventSchedule(schedule, slots)
      )
  );
}

export function getApplicationEventsInsideSelection(
  aes: ApplicationEventNode[],
  selection: string[] | null,
  reservationUnitPk: number
): ApplicationEventNode[] {
  if (!selection || !aes || selection.length < 1) {
    return [];
  }

  const selectionDecoded = selection.map(decodeTimeSlot);
  const isInRange = (slot: TimeSlot, range: TimeSlot[] | null) => {
    if (!range) {
      return false;
    }
    if (range.length < 2) {
      return false;
    }
    if (slot.day !== range[0].day) {
      return false;
    }
    if (slot.hour < range[0].hour) {
      return false;
    }
    if (slot.hour >= range[1].hour) {
      return false;
    }
    return true;
  };

  const day = selectionDecoded[0].day;
  const filtered = aes
    .filter((ae) => {
      // this makes it impossible to revert decline
      return ae.status !== ApplicationEventStatusChoice.Declined;
    })
    .filter((ae) => {
      const times =
        ae.applicationEventSchedules
          ?.filter((s) => s.day === day)
          .map(getRequestedTime) ?? [];
      return times.some(
        (slot) => slot && selectionDecoded.some((item) => isInRange(item, slot))
      );
    })
    .filter((ae) => {
      const isAllocatedForToday =
        ae.applicationEventSchedules?.some((s) => s.allocatedDay) ?? false;
      const nAllocated =
        ae.applicationEventSchedules?.filter((s) => s.allocatedDay === day)
          .length ?? 0;
      const nRequested = ae.eventsPerWeek ?? 0;
      // if it's allocated already for today compare selection to allocation time, not requested time
      // ex. requested 10 - 16, but allocated for 10 - 12, only show it if selection includes a slot between 10 - 12
      if (isAllocatedForToday) {
        const aesToday = ae.applicationEventSchedules?.filter(
          (s) => s.allocatedDay === day
        );
        if (aesToday != null && aesToday?.length > 0) {
          const fa = aesToday.map((s) => {
            const timeRange = getAllocatedTime(s);
            if (!timeRange) {
              return false;
            }
            return selectionDecoded
              .map((x) => isInRange(x, timeRange))
              .some((b) => b);
          });
          return fa.some((b) => b);
        }
        return nAllocated < nRequested;
      }
      return true;
    })
    // remove all events that are allocated but not in this reservation unit
    .map((ae) => ({
      ...ae,
      applicationEventSchedules:
        ae.applicationEventSchedules?.filter(
          (s) =>
            s.allocatedReservationUnit == null ||
            s.allocatedReservationUnit.pk === reservationUnitPk
        ) ?? [],
    }))
    .sort((a, b) => {
      // if there is already allocated they are always shown first
      // TODO sorted by their allocation start time
      if (a.applicationEventSchedules?.some((s) => s.allocatedDay === day)) {
        return -1;
      }
      if (b.applicationEventSchedules?.some((s) => s.allocatedDay === day)) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

  return filtered;
}

export const getApplicationEventScheduleTimeString = (
  aes: ApplicationEventScheduleNode[],
  priority: ApplicationEventSchedulePriority
): string => {
  const schedules = sortBy(aes?.filter((s) => s?.priority === priority), [
    "day",
    "begin",
  ]);

  return filterNonNullable(schedules)
    .map((schedule) => parseApplicationEventScheduleTime(schedule))
    .join(", ");
};

export const timeSlotKeyToScheduleTime = (
  slot: string,
  padEnd = false
): string => {
  let [, hours, minutes] = slot.split("-").map(Number);
  if (padEnd) {
    if (minutes === 0) {
      minutes = 30;
    } else {
      hours = hours < 23 ? hours + 1 : 0;
      minutes = 0;
    }
  }

  return `${padStart(`${hours}`, 2, "0")}:${padStart(`${minutes}`, 2, "0")}:00`;
};

// remove the trailing seconds from time values
// TODO this should be an util function (there is similar used in application-round page)
export function formatTime(time?: string) {
  if (time == null) {
    return "";
  }
  return time.slice(0, 5);
}

export type ApplicationEventScheduleResultStatuses = {
  acceptedSlots: string[];
  declinedSlots: string[];
};
