import { addDays, format, startOfDay, startOfISOWeek } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { EXPECTED_TIMEZONE } from "@ui/modules/const";
import { MINUTES_PER_DAY, isRangeOpen, mergeRanges, snapOutward } from "../WeeklyPatternCalendar/engine";
import type { Range } from "../WeeklyPatternCalendar/engine";
import type { CalendarData } from "../WeeklyPatternCalendar/types";
import type { DatedEvent, DatedOpenRange, DatedRange, DatedVisibleHours, DatedWeekView } from "./types";

// Everything below works on "wall-clock" dates: a Date whose local fields read as Europe/Helsinki time.
// That way a day is always midnight to midnight, whatever time zone the browser is in.
export const DEFAULT_VISIBLE_HOURS: DatedVisibleHours = { beginMinutes: 6 * 60, endMinutes: MINUTES_PER_DAY };

export function toWallClock(date: Date): Date {
  return toZonedTime(date, EXPECTED_TIMEZONE);
}

export const dayKeyOf = (wallClock: Date): string => format(wallClock, "yyyy-MM-dd");

// Read from the clock fields. Elapsed time since midnight would be an hour off on the days the clocks change.
export const minutesOfDay = (wallClock: Date): number => wallClock.getHours() * 60 + wallClock.getMinutes();

/** The wall-clock days of the shown range, as midnight dates. A week starts on Monday. */
export function visibleDays(date: Date, view: DatedWeekView): Date[] {
  const day = startOfDay(toWallClock(date));
  if (view === "day") {
    return [day];
  }
  const monday = startOfISOWeek(day);
  return Array.from({ length: 7 }, (_, offset) => addDays(monday, offset));
}

/** The date to show after stepping one day or week in `direction` from `date`. */
export function stepDate(date: Date, view: DatedWeekView, direction: -1 | 1): Date {
  return addDays(date, direction * (view === "day" ? 1 : 7));
}

export type EventSegment<TData extends CalendarData> = {
  event: DatedEvent<TData>;
  dayKey: string;
  beginMinutes: number;
  endMinutes: number;
  /** Side-by-side column among the events that overlap this one. */
  lane: number;
  lanes: number;
};

type RawSegment<TData extends CalendarData> = Omit<EventSegment<TData>, "lane" | "lanes">;

// Gives overlapping segments of one day a column each. Segments that only touch end to end share a column.
function assignLanes<TData extends CalendarData>(segments: Array<RawSegment<TData>>): Array<EventSegment<TData>> {
  const sorted = [...segments].sort((a, b) => a.beginMinutes - b.beginMinutes || b.endMinutes - a.endMinutes);
  const result: Array<EventSegment<TData>> = [];
  let cluster: Array<EventSegment<TData>> = [];
  let clusterEnd = -Infinity;
  let laneEnds: number[] = [];

  const closeCluster = () => {
    for (const segment of cluster) {
      segment.lanes = laneEnds.length;
    }
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const segment of sorted) {
    if (cluster.length > 0 && segment.beginMinutes >= clusterEnd) {
      closeCluster();
    }
    let lane = laneEnds.findIndex((end) => end <= segment.beginMinutes);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(segment.endMinutes);
    } else {
      laneEnds[lane] = segment.endMinutes;
    }
    cluster.push({ ...segment, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, segment.endMinutes);
  }
  closeCluster();
  return result;
}

/** Cuts every event into one segment per day it touches. Events that end before they begin are dropped. */
export function segmentEvents<TData extends CalendarData>(
  events: ReadonlyArray<DatedEvent<TData>>,
  days: ReadonlyArray<Date>
): Map<string, Array<EventSegment<TData>>> {
  const byDay = new Map<string, Array<RawSegment<TData>>>(days.map((day) => [dayKeyOf(day), []]));

  for (const event of events) {
    const start = toWallClock(event.start);
    const end = toWallClock(event.end);
    if (end <= start) {
      continue;
    }
    for (const day of days) {
      const nextDay = addDays(day, 1);
      if (start >= nextDay || end <= day) {
        continue;
      }
      const beginMinutes = start > day ? minutesOfDay(start) : 0;
      const endMinutes = end < nextDay ? minutesOfDay(end) : MINUTES_PER_DAY;
      byDay.get(dayKeyOf(day))?.push({ event, dayKey: dayKeyOf(day), beginMinutes, endMinutes });
    }
  }

  return new Map([...byDay].map(([key, segments]) => [key, assignLanes(segments)]));
}

/** The open ranges of each shown day in wall-clock minutes. `null` for a day means everything is open. */
export function openRangesByDay(
  openRanges: ReadonlyArray<DatedOpenRange> | undefined,
  days: ReadonlyArray<Date>
): Map<string, Range[]> | null {
  if (!openRanges) {
    return null;
  }
  const byDay = new Map<string, Range[]>(days.map((day) => [dayKeyOf(day), []]));
  for (const range of openRanges) {
    const start = toWallClock(range.start);
    const end = toWallClock(range.end);
    for (const day of days) {
      const nextDay = addDays(day, 1);
      if (start >= nextDay || end <= day) {
        continue;
      }
      byDay.get(dayKeyOf(day))?.push({
        beginMinutes: start > day ? minutesOfDay(start) : 0,
        endMinutes: end < nextDay ? minutesOfDay(end) : MINUTES_PER_DAY,
      });
    }
  }
  return new Map([...byDay].map(([key, ranges]) => [key, mergeRanges(ranges)]));
}

export function isCellOpen(
  open: Map<string, Range[]> | null,
  dayKey: string,
  beginMinutes: number,
  endMinutes: number
) {
  return open == null || isRangeOpen(open.get(dayKey) ?? [], beginMinutes, endMinutes);
}

/**
 * The grid's vertical extent: the override, else the open ranges, else a default. Events always extend it
 * so nothing that happens is hidden. Snapped outward to the step.
 */
export function resolveVisibleHours(
  override: DatedVisibleHours | undefined,
  open: Map<string, Range[]> | null,
  segments: ReadonlyArray<Range>,
  step: number
): Range {
  const openRanges = open ? [...open.values()].flat() : [];
  const base = override ?? extentOf(openRanges) ?? DEFAULT_VISIBLE_HOURS;
  const union = extentOf([base, ...segments]) ?? base;
  const snapped = snapOutward(union, step);
  return snapped.endMinutes > snapped.beginMinutes ? snapped : DEFAULT_VISIBLE_HOURS;
}

function extentOf(ranges: ReadonlyArray<Range>): Range | null {
  if (ranges.length === 0) {
    return null;
  }
  return {
    beginMinutes: Math.min(...ranges.map((range) => range.beginMinutes)),
    endMinutes: Math.max(...ranges.map((range) => range.endMinutes)),
  };
}

/** The segments of a day that overlap the cell [beginMinutes, endMinutes). */
export function segmentsInCell<TData extends CalendarData>(
  segments: ReadonlyArray<EventSegment<TData>>,
  beginMinutes: number,
  endMinutes: number
): Array<EventSegment<TData>> {
  return segments.filter((segment) => segment.beginMinutes < endMinutes && segment.endMinutes > beginMinutes);
}

// A wall-clock moment as the real Date it is in Europe/Helsinki. Built from the clock fields so that
// moving by days or minutes follows the clock on the days the clocks change.
function fromWallClock(year: number, month: number, day: number, minutes: number): Date {
  return fromZonedTime(new Date(year, month, day, 0, minutes), EXPECTED_TIMEZONE);
}

/** The real time of the cell at `index` (counted in steps from midnight) on a yyyy-MM-dd day. */
export function cellRange(dayKey: string, index: number, step: number): DatedRange {
  const [year = 0, month = 1, day = 1] = dayKey.split("-").map(Number);
  return {
    start: fromWallClock(year, month - 1, day, index * step),
    end: fromWallClock(year, month - 1, day, (index + 1) * step),
  };
}

/** Moves a range by whole days and minutes of Helsinki wall-clock time. */
export function shiftRange(
  range: DatedRange,
  { days = 0, minutes = 0 }: { days?: number; minutes?: number }
): DatedRange {
  const move = (date: Date) => {
    const wall = toWallClock(date);
    return fromWallClock(wall.getFullYear(), wall.getMonth(), wall.getDate() + days, minutesOfDay(wall) + minutes);
  };
  return { start: move(range.start), end: move(range.end) };
}

/** Moves the end of a range, keeping it at least `minimum` minutes long. */
export function resizeRange(range: DatedRange, minutes: number, minimum: number): DatedRange {
  const end = shiftRange({ start: range.end, end: range.end }, { minutes }).start;
  const shortest = shiftRange({ start: range.start, end: range.start }, { minutes: minimum }).start;
  return { start: range.start, end: end < shortest ? shortest : end };
}
