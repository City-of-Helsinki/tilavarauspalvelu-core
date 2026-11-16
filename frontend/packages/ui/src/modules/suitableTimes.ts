import { groupBy } from "lodash-es";
import {
  gridToPattern,
  groupAvailability,
  isRangeOpen,
  mergeRanges,
  MINUTES_PER_DAY,
  patternToGrid,
  shallowEqual,
} from "@ui/components/WeeklyPatternCalendar/engine";
import type {
  VisibleHours,
  WeeklyPatternAvailability,
  WeeklyPatternValue,
} from "@ui/components/WeeklyPatternCalendar/types";
import { Priority } from "../../gql/gql-types";
import type { ApplicationRoundTimeSlotNode, Weekday } from "../../gql/gql-types";
import { formatApiTimeUnsafe, timeToMinutes } from "./date-utils";
import { filterNonNullable } from "./helpers";

// Conversions between the API shapes of Suitable Time Ranges and Reservable Times and the Weekly Pattern Calendar.

export const SUITABLE_TIME_STEP_MINUTES = 15;

// Both apps always show the same frame, 07:00 to 24:00, whatever the opening hours are.
export const SUITABLE_TIME_VISIBLE_HOURS: VisibleHours = { beginMinutes: 7 * 60, endMinutes: MINUTES_PER_DAY };

export type SuitableTimeData = { priority: Priority };

export type SuitableTimeRangeValues = {
  dayOfTheWeek: Weekday;
  beginTime: string;
  endTime: string;
  priority: Priority;
};

export type ReservableTimeSlots = Readonly<
  Array<Pick<ApplicationRoundTimeSlotNode, "weekday" | "isClosed" | "reservableTimes">>
>;

// The API writes the end of the day as 00:00, which the calendar models as minute 1440.
export function endTimeToMinutes(time: string): number {
  return timeToMinutes(time) || MINUTES_PER_DAY;
}

// formatApiTimeUnsafe writes the end of the day (24:00) back as 00:00.
function minutesToTime(minutes: number): string {
  return formatApiTimeUnsafe(Math.floor(minutes / 60), minutes % 60);
}

/** A run of one priority on one day, in minutes. */
export type PriorityRun = { priority: Priority; beginMinutes: number; endMinutes: number };

/**
 * Which of one day's runs are shorter than the minimum duration (in seconds), index for index.
 * `runs` must be in order, with touching runs of the same priority merged (as the calendar draws them).
 *
 * A primary run must be long enough by itself.
 * A secondary run long enough by itself is always fine.
 * A shorter secondary run can be a buffer next to primary time, so it counts together with every run it touches (its
 * block). But a buffer only helps a long enough primary run: touching a too short primary run, it is too short too.
 * E.g. with a 60 min minimum, 60 min primary + 30 min secondary is fine, in 30 min primary + 30 min secondary both are
 * too short, and in 30 min primary + 60 min secondary only the primary is.
 */
export function findTooShortRuns(runs: ReadonlyArray<PriorityRun>, minDurationSeconds: number): boolean[] {
  return findTooShortReasons(runs, minDurationSeconds).map((reason) => reason != null);
}

/**
 * Why a run is too short, by the rules of `findTooShortRuns`: `tooShort` when it (or the block it buffers) is shorter
 * than the minimum, `nextToShortPrimary` when it is a secondary buffer that is too short only because the primary run
 * it touches is. The latter is fixed by lengthening that primary run.
 */
export type TooShortReason = "tooShort" | "nextToShortPrimary";

/** Like `findTooShortRuns`, but with the reason for each too short run, and `null` for the fine ones. */
export function findTooShortReasons(
  runs: ReadonlyArray<PriorityRun>,
  minDurationSeconds: number
): Array<TooShortReason | null> {
  const isShort = (beginMinutes: number, endMinutes: number) => (endMinutes - beginMinutes) * 60 < minDurationSeconds;
  const isShortPrimary = (run: PriorityRun | undefined) =>
    run?.priority === Priority.Primary && isShort(run.beginMinutes, run.endMinutes);
  const touches = (earlier: PriorityRun | undefined, later: PriorityRun | undefined) =>
    earlier != null && later != null && earlier.endMinutes === later.beginMinutes;

  return runs.map((run, index) => {
    if (run.priority === Priority.Primary) {
      return isShortPrimary(run) ? "tooShort" : null;
    }
    if (!isShort(run.beginMinutes, run.endMinutes)) {
      return null;
    }
    const before = runs[index - 1];
    const after = runs[index + 1];
    if ((touches(before, run) && isShortPrimary(before)) || (touches(run, after) && isShortPrimary(after))) {
      return "nextToShortPrimary";
    }
    // The block: this run and every run touching it, outwards in both directions.
    let first = run;
    for (const candidate of runs.slice(0, index).reverse()) {
      if (!touches(candidate, first)) {
        break;
      }
      first = candidate;
    }
    let last = run;
    for (const candidate of runs.slice(index + 1)) {
      if (!touches(last, candidate)) {
        break;
      }
      last = candidate;
    }
    return isShort(first.beginMinutes, last.endMinutes) ? "tooShort" : null;
  });
}

/**
 * The times as the calendar and the time list show them: each range painted on the grid in order, so a later range
 * replaces an earlier one where they overlap, and neighbouring times of the same priority joined. Validation judges
 * these times too, so a saved list is valid exactly when what the user sees is.
 */
export function listSuitableTimes(
  ranges: ReadonlyArray<SuitableTimeRangeValues>
): WeeklyPatternValue<SuitableTimeData> {
  const step = SUITABLE_TIME_STEP_MINUTES;
  return gridToPattern(patternToGrid(toPattern(ranges), step), step, shallowEqual);
}

/**
 * Which of the listed times (from `listSuitableTimes`) are shorter than the minimum duration (in seconds), position
 * for position, by the rules of `findTooShortRuns` applied per day.
 */
export function findTooShortListed(
  listed: WeeklyPatternValue<SuitableTimeData>,
  minDurationSeconds: number
): boolean[] {
  const flags = listed.map(() => false);
  const byDay = groupBy(
    listed.map((run, position) => ({ run, position })),
    ({ run }) => run.weekday
  );
  for (const entries of Object.values(byDay)) {
    const runs = entries.map(({ run: { beginMinutes, endMinutes, data } }) => ({
      priority: data.priority,
      beginMinutes,
      endMinutes,
    }));
    const results = findTooShortRuns(runs, minDurationSeconds);
    for (const [i, { position }] of entries.entries()) {
      flags[position] = results[i] ?? false;
    }
  }
  return flags;
}

/** Whether any of the times as listed (see `listSuitableTimes`) is shorter than the minimum duration (in seconds). */
export function hasTooShortTimes(ranges: ReadonlyArray<SuitableTimeRangeValues>, minDurationSeconds: number): boolean {
  return findTooShortListed(listSuitableTimes(ranges), minDurationSeconds).includes(true);
}

/**
 * How many reservations of the minimum duration (in seconds) fit in the times, side by side.
 * A reservation can be allocated anywhere inside touching times of any priority (as the backend merges them), so each
 * block of touching times fits as many as its length allows. Several fit on one day, in one block or in separate ones.
 * E.g. with a 60 min minimum, 10:00-13:00 fits three, and 10:00-11:00 with 12:00-13:00 on the same day fits two.
 */
export function countFittingReservations(
  ranges: ReadonlyArray<Pick<SuitableTimeRangeValues, "dayOfTheWeek" | "beginTime" | "endTime">>,
  minDurationSeconds: number
): number {
  const byDay = groupBy(ranges, (range) => range.dayOfTheWeek);
  let count = 0;
  for (const dayRanges of Object.values(byDay)) {
    const blocks = mergeRanges(
      dayRanges.map(({ beginTime, endTime }) => ({
        beginMinutes: timeToMinutes(beginTime),
        endMinutes: endTimeToMinutes(endTime),
      }))
    );
    for (const { beginMinutes, endMinutes } of blocks) {
      count += minDurationSeconds > 0 ? Math.floor(((endMinutes - beginMinutes) * 60) / minDurationSeconds) : 1;
    }
  }
  return count;
}

/** Whether every range is fully inside the opening hours, i.e. can be applied for. */
export function isInsideOpeningHours(
  ranges: ReadonlyArray<Pick<SuitableTimeRangeValues, "dayOfTheWeek" | "beginTime" | "endTime">>,
  openingHours: ReservableTimeSlots
): boolean {
  const open = groupAvailability(toAvailability(openingHours));
  return ranges.every(({ dayOfTheWeek, beginTime, endTime }) =>
    isRangeOpen(open[dayOfTheWeek], timeToMinutes(beginTime), endTimeToMinutes(endTime))
  );
}

export function toAvailability(slots: ReservableTimeSlots): WeeklyPatternAvailability {
  return slots.flatMap(({ weekday, isClosed, reservableTimes }) =>
    isClosed
      ? []
      : filterNonNullable(reservableTimes).map(({ begin, end }) => ({
          weekday,
          beginMinutes: timeToMinutes(begin),
          endMinutes: endTimeToMinutes(end),
        }))
  );
}

export function toPattern(ranges: ReadonlyArray<SuitableTimeRangeValues>): WeeklyPatternValue<SuitableTimeData> {
  return ranges.map(({ dayOfTheWeek, beginTime, endTime, priority }) => ({
    weekday: dayOfTheWeek,
    beginMinutes: timeToMinutes(beginTime),
    endMinutes: endTimeToMinutes(endTime),
    data: { priority },
  }));
}

export function fromPattern(pattern: WeeklyPatternValue<SuitableTimeData>): SuitableTimeRangeValues[] {
  return pattern.map(({ weekday, beginMinutes, endMinutes, data }) => ({
    dayOfTheWeek: weekday,
    beginTime: minutesToTime(beginMinutes),
    endTime: minutesToTime(endMinutes),
    priority: data.priority,
  }));
}

export function priorityKey(priority: Priority): "primary" | "secondary" {
  return priority === Priority.Primary ? "primary" : "secondary";
}
