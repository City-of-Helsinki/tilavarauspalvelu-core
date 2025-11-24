import { set } from "date-fns";
import { padStart } from "lodash-es";
import type { TFunction } from "next-i18next";
import type { DayT } from "ui/src/modules/const";
import { convertWeekday, transformWeekday } from "ui/src/modules/conversion";
import { formatDuration, formatTimeRange, timeToMinutes } from "ui/src/modules/date-utils";
import { filterNonNullable, sort, toNumber } from "ui/src/modules/helpers";
import {
  type SuitableTimeRangeNode,
  type ApplicationSectionNode,
  Priority,
  Weekday,
  type ApplicationSectionAllocationsQuery,
} from "@gql/gql-types";

// TODO use a fragment
type QueryT = NonNullable<ApplicationSectionAllocationsQuery["applicationSections"]>;
type EdgeT = NonNullable<QueryT["edges"][0]>;
export type SectionNodeT = NonNullable<EdgeT["node"]>;
export type SuitableTimeRangeNodeT = SectionNodeT["suitableTimeRanges"][0];
export type ReservationUnitOptionNodeT = NonNullable<SectionNodeT["reservationUnitOptions"]>[0];

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
  firstSlotStart: number | undefined,
  lastSlotStart: number | undefined
): Cell[][] {
  const cells: Cell[][] = [];
  if (firstSlotStart == null || lastSlotStart == null) {
    return cells;
  }

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

export function timeSlotKeyToTime(slot: string): number {
  const [, hours, minutes] = slot.split("-").map(toNumber);
  if (hours == null || minutes == null) {
    return 0;
  }
  return set(new Date(), { hours, minutes }).getTime();
}

export function getTimeSlotOptions(
  day: DayT,
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
  const [day, hour, min] = slot.split("-").map(toNumber);
  return { day: day ?? 0, hour: (hour ?? 0) + (min ?? 0) / 60 };
}

export function encodeTimeSlot(day: number, hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${day}-${h < 10 ? `0${h}` : h}-${m < 10 ? `0${m}` : m}`;
}

function constructTimeSlot(day: number, begin: string): TimeSlot | null {
  const time = timeToMinutes(begin) / 60;
  if (time == null) {
    return null;
  }
  return { day, hour: time };
}

export function getTimeSeries(day: string, begin: string, end: string): string[] {
  const [, startHours, startMinutes] = begin.split("-").map(toNumber);
  const [, endHours, endMinutes] = end.split("-").map(toNumber);
  const timeSlots: string[] = [];
  if (startHours == null || startMinutes == null || endHours == null) {
    return timeSlots;
  }
  for (let i = startHours; i <= endHours; i += 1) {
    timeSlots.push(`${day}-${i}-00`);
    timeSlots.push(`${day}-${i}-30`);
  }

  if (startMinutes === 30) timeSlots.shift();
  if (endMinutes === 0) timeSlots.pop();

  return timeSlots;
}

export function formatSuitableTimeRange(
  t: TFunction,
  range: Pick<SuitableTimeRangeNode, "dayOfTheWeek" | "beginTime" | "endTime">
): string {
  const day = convertWeekday(range.dayOfTheWeek);
  const weekday = t(`translation:dayShort.${day}`);
  const begin = timeToMinutes(range.beginTime);
  const end = timeToMinutes(range.endTime);
  const timeRangeString = formatTimeRange(begin, end, true);
  return `${weekday} ${timeRangeString}`;
}

export function formatTimeRangeList(
  t: TFunction,
  aes: Array<Pick<SuitableTimeRangeNode, "dayOfTheWeek" | "beginTime" | "endTime" | "priority">>,
  priority: Priority
): string {
  const schedules = sort(
    aes.filter((s) => s.priority === priority),
    (a, b) => {
      const d1 = convertWeekday(a.dayOfTheWeek);
      const d2 = convertWeekday(b.dayOfTheWeek);
      if (d1 < d2) {
        return -1;
      } else if (d1 > d2) {
        return 1;
      }
      const begin1 = timeToMinutes(a.beginTime);
      const begin2 = timeToMinutes(b.beginTime);
      return begin1 - begin2;
    }
  );

  return filterNonNullable(schedules)
    .map((schedule) => formatSuitableTimeRange(t, schedule))
    .join(", ");
}

export function timeSlotKeyToScheduleTime(slot: string | undefined, padEnd = false): string {
  let [, hours, minutes] = slot?.split("-").map(toNumber) ?? [];
  if (hours == null || minutes == null) {
    return "";
  }
  if (padEnd) {
    if (minutes === 0) {
      minutes = 30;
    } else {
      hours = hours < 23 ? hours + 1 : 0;
      minutes = 0;
    }
  }

  return `${padStart(`${hours}`, 2, "0")}:${padStart(`${minutes}`, 2, "0")}:00`;
}

export function createDurationString(
  section: Pick<ApplicationSectionNode, "reservationMinDuration" | "reservationMaxDuration">,
  t: TFunction
) {
  const minDuration = section.reservationMinDuration;
  const maxDuration = section.reservationMaxDuration;

  const minDurString = formatDuration(t, { seconds: minDuration });
  const maxDurString = formatDuration(t, { seconds: maxDuration });
  const durationString = minDuration === maxDuration ? minDurString : `${minDurString ?? ""} - ${maxDurString ?? ""}`;
  return durationString;
}

export type AllocatedTimeSlotNodeT = SectionNodeT["reservationUnitOptions"][0]["allocatedTimeSlots"][0];

export function getRelatedTimeSlots(
  allocations: Array<Pick<AllocatedTimeSlotNodeT, "endTime" | "beginTime" | "dayOfTheWeek">>
): RelatedSlot[][] {
  const relatedSpacesTimeSlots = allocations;

  // split the data to days
  // sort every array by start time
  // run reduce to get contiguous time slots (and remove extras)
  // we should end up with 7 arrays (one for each day), each having a list of time slots (beginTime, endTime)
  // then we can use that data to draw the calendar
  const dayArray = [...Array(7)].map(() => []);
  const relatedSpacesTimeSlotsByDay = relatedSpacesTimeSlots.reduce<RelatedSlot[][]>((acc, ts) => {
    const day = convertWeekday(ts.dayOfTheWeek);
    const arr = acc[day];
    if (arr == null) {
      return acc;
    }
    const beginTime = timeToMinutes(ts.beginTime);
    const endTime = timeToMinutes(ts.endTime);
    arr.push({
      day,
      beginTime,
      endTime,
    });
    return acc;
  }, dayArray);

  // TODO sort by beginTime
  // TODO reduce the array to contiguous time slots

  return relatedSpacesTimeSlotsByDay;
}

export function isInsideSelection(
  selection: { day: DayT; start: number; end: number },
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
  day: DayT,
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
  const begin = timeToMinutes(beginTime) / 60;
  const end = timeToMinutes(endTime) / 60;
  if (begin == null || end == null) {
    return false;
  }
  const cellTime = cell.hour * 60 + cell.minute;
  const beginMinutes = begin * 60;
  const endMinutes = (end === 0 ? 24 : end) * 60;
  return cellTime >= beginMinutes && cellTime < endMinutes;
}

export function convertPriorityFilter(values: number[]): Priority[] {
  return values.reduce<Priority[]>((acc, x) => {
    if (x === 200) {
      return [...acc, Priority.Secondary];
    } else if (x === 300) {
      return [...acc, Priority.Primary];
    }
    return acc;
  }, []);
}
