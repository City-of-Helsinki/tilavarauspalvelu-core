import { padStart, sortBy } from "lodash";
import {
  type SuitableTimeRangeNode,
  type ApplicationSectionNode,
  Priority,
  type AllocatedTimeSlotNode,
  Weekday,
} from "common/types/gql-types";
import i18next from "i18next";
import { type TFunction } from "next-i18next";
import { filterNonNullable } from "common/src/helpers";
import { formatDuration } from "common/src/common/util";
import { Day, convertWeekday, transformWeekday } from "common/src/conversion";

export type RelatedSlot = {
  day: number;
  beginTime: number;
  endTime: number;
};

export type Cell = {
  hour: number;
  minute: number;
  key: string;
};

// TODO why is there a similar function in ui?
export function applicationEventSchedulesToCells(
  firstSlotStart: number,
  lastSlotStart: number
): Cell[][] {
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
}

export const timeSlotKeyToTime = (slot: string): number => {
  const [, hour, minute] = slot.split("-").map(Number);
  return new Date().setHours(hour, minute);
};

export function getTimeSlotOptions(
  day: string,
  startHours: number,
  startMinutes: number,
  endHours: number,
  endOptions?: boolean
): Array<{ label: string; value: string }> {
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
}

type TimeSlot = { day: number; hour: number };

export function decodeTimeSlot(slot: string): TimeSlot {
  const [day, hour, min] = slot.split("-").map(Number);
  return { day, hour: hour + min / 60 };
}

export function encodeTimeSlot(day: number, hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${day}-${h < 10 ? `0${h}` : h}-${m < 10 ? `0${m}` : m}`;
}

function constructTimeSlot(day: number, begin: string): TimeSlot | null {
  const time = parseApiTime(begin);
  if (time == null) {
    return null;
  }
  return { day, hour: time };
}

/// Convert python time string to hours
/// @return time in hours
/// @param from a python time string: "HH:MM:SS"
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

// TODO is this parse? or format? it looks like a format
function formatTimeRange(range: SuitableTimeRangeNode): string {
  // TODO convert the day of the week
  const day = convertWeekday(range.dayOfTheWeek);
  const weekday = i18next.t(`dayShort.${day}`);
  // TODO don't use substring to convert times (wrap it in a function)
  return `${weekday} ${Number(
    range.beginTime.substring(0, 2)
  )}-${Number(range.endTime.substring(0, 2))}`;
}

export function formatTimeRangeList(
  aes: SuitableTimeRangeNode[],
  priority: Priority
): string {
  const schedules = sortBy(
    aes?.filter((s) => s?.priority === priority),
    ["day", "begin"]
  );

  return filterNonNullable(schedules)
    .map((schedule) => formatTimeRange(schedule))
    .join(", ");
}

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

export function createDurationString(
  section: ApplicationSectionNode,
  t: TFunction
) {
  const minDuration = section.reservationMinDuration;
  const maxDuration = section.reservationMaxDuration;

  const minDurString =
    minDuration != null ? formatDuration(minDuration / 60, t) : undefined;
  const maxDurString =
    maxDuration != null ? formatDuration(maxDuration / 60, t) : undefined;
  const durationString =
    minDuration === maxDuration
      ? minDurString
      : `${minDurString ?? ""} - ${maxDurString ?? ""}`;
  return durationString;
}

export function getRelatedTimeSlots(
  allocations: AllocatedTimeSlotNode[]
): RelatedSlot[][] {
  const relatedSpacesTimeSlots = allocations;

  // split the data to days
  // sort every array by start time
  // run reduce to get contiguous time slots (and remove extras)
  // we should end up with 7 arrays (one for each day), each having a list of time slots (beginTime, endTime)
  // then we can use that data to draw the calendar
  const dayArray = Array.from(Array(7)).map(() => []);
  const relatedSpacesTimeSlotsByDay = relatedSpacesTimeSlots.reduce<
    RelatedSlot[][]
  >((acc, ts) => {
    const day = convertWeekday(ts.dayOfTheWeek);
    const begin = parseApiTime(ts.beginTime);
    const end = parseApiTime(ts.endTime);
    if (begin == null || end == null) {
      return acc;
    }
    acc[day].push({
      day,
      beginTime: begin * 60,
      endTime: end * 60,
    });
    return acc;
  }, dayArray);

  // TODO sort by beginTime
  // TODO reduce the array to contiguous time slots

  return relatedSpacesTimeSlotsByDay;
}

export function isInsideSelection(
  selection: { day: Day; start: number; end: number },
  tr: {
    dayOfTheWeek: Weekday;
    beginTime: string;
    endTime: string;
  }
): boolean {
  const start = constructTimeSlot(selection.day, tr.beginTime);
  const end = constructTimeSlot(selection.day, tr.endTime);
  if (!start || !end) {
    return false;
  }
  // NOTE 00:00 could be either 24:00 or 00:00
  // but we use number comparison so for end we need 24 and start 0
  if (end?.hour === 0) {
    end.hour = 24;
  }
  if (selection.day !== convertWeekday(tr.dayOfTheWeek)) {
    return false;
  }
  if (start.hour > selection.end) {
    return false;
  }
  if (end.hour <= selection.start) {
    return false;
  }
  return true;
}

// TODO combine common functionaility with isInsideSelection
export function isInsideCell(
  day: Day,
  cell: Cell,
  ts: {
    dayOfTheWeek: Weekday;
    beginTime: string;
    endTime: string;
  }
) {
  const { beginTime, endTime, dayOfTheWeek } = ts;
  if (dayOfTheWeek !== transformWeekday(day)) {
    return false;
  }
  // NOTE if the end time is 00:00 swap it to 24:00 (24h)
  const begin = parseApiTime(beginTime);
  const end = parseApiTime(endTime);
  if (begin == null || end == null) {
    return false;
  }
  const cellTime = cell.hour * 60 + cell.minute;
  const beginMinutes = begin * 60;
  const endMinutes = (end === 0 ? 24 : end) * 60;
  return cellTime >= beginMinutes && cellTime < endMinutes;
}

export function convertPriorityFilter(values: string[]): Priority[] {
  return values
    ?.map((x) => Number(x))
    .reduce<Array<Priority>>((acc, x) => {
      if (x === 200) {
        return [...acc, Priority.Secondary];
      } else if (x === 300) {
        return [...acc, Priority.Primary];
      }
      return acc;
    }, []);
}
