import { groupBy } from "lodash-es";
import {
  groupAvailability,
  gridToPattern,
  isRangeOpen,
  paintRange,
  patternToGrid,
  shallowEqual,
} from "@ui/components/WeeklyPatternCalendar/engine";
import type { WeeklyPatternValue } from "@ui/components/WeeklyPatternCalendar/types";
import {
  findTooShortRuns,
  fromPattern,
  isInsideOpeningHours,
  SUITABLE_TIME_STEP_MINUTES,
  toAvailability,
  toPattern,
} from "ui/src/modules/suitableTimes";
import type { ReservableTimeSlots, SuitableTimeData } from "ui/src/modules/suitableTimes";
import type { Priority, Weekday } from "@gql/gql-types";
import type { SuitableTimeRangeFormValues } from "./form";

export type TimeRangeInput = { weekday: Weekday; beginMinutes: number; endMinutes: number; priority: Priority };

// The saved ranges as the calendar shows them. Neighbouring ranges with the same priority are joined.
export function listTimeRanges(
  ranges: ReadonlyArray<SuitableTimeRangeFormValues>
): WeeklyPatternValue<SuitableTimeData> {
  const step = SUITABLE_TIME_STEP_MINUTES;
  return gridToPattern(patternToGrid(toPattern(ranges), step), step, shallowEqual);
}

/**
 * Which of the listed times (from `listTimeRanges`) are shorter than the minimum duration (in seconds), position for
 * position, by the same rules as the calendar and the form validation (`findTooShortRuns`, applied per day).
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

/**
 * Adds a time range, in the same way as painting it in the calendar.
 * Returns `null` when the range is not fully inside the times that can be booked.
 */
export function addTimeRange(
  ranges: ReadonlyArray<SuitableTimeRangeFormValues>,
  { weekday, beginMinutes, endMinutes, priority }: TimeRangeInput,
  openingHours: ReservableTimeSlots
): SuitableTimeRangeFormValues[] | null {
  const step = SUITABLE_TIME_STEP_MINUTES;
  const open = groupAvailability(toAvailability(openingHours))[weekday];
  if (!isRangeOpen(open, beginMinutes, endMinutes)) {
    return null;
  }
  const grid = paintRange(
    patternToGrid(toPattern(ranges), step),
    weekday,
    beginMinutes / step,
    endMinutes / step - 1,
    { kind: "paint", data: { priority } },
    () => true,
    shallowEqual
  );
  return fromPattern(gridToPattern(grid, step, shallowEqual));
}

export function removeTimeRange(
  ranges: ReadonlyArray<SuitableTimeRangeFormValues>,
  position: number
): SuitableTimeRangeFormValues[] {
  return fromPattern(listTimeRanges(ranges).filter((_, i) => i !== position));
}

/**
 * A key of the times as the calendar shows them, however they are split into ranges.
 * listTimeRanges lists them in calendar order (by weekday, then time), so equal times give equal keys without sorting.
 */
function timesKey(ranges: ReadonlyArray<SuitableTimeRangeFormValues>): string {
  return listTimeRanges(ranges)
    .map(({ weekday, beginMinutes, endMinutes, data }) => `${weekday} ${beginMinutes}-${endMinutes} ${data.priority}`)
    .join(",");
}

/** Whether two lists hold the same times, as the calendar shows them (however they are split into ranges). */
export function hasSameTimes(
  a: ReadonlyArray<SuitableTimeRangeFormValues>,
  b: ReadonlyArray<SuitableTimeRangeFormValues>
): boolean {
  return timesKey(a) === timesKey(b);
}

/** Which of the listed times (from `listTimeRanges`) reach outside the opening hours, position for position. */
export function findOutsideListed(
  listed: WeeklyPatternValue<SuitableTimeData>,
  openingHours: ReservableTimeSlots
): boolean[] {
  return fromPattern(listed).map((range) => !isInsideOpeningHours([range], openingHours));
}

/**
 * Which of the saved ranges are invalid, index for index: too short, or outside the opening hours, by the same rules
 * as the calendar and the time list. A range is judged as part of the listed time it belongs to (see `listTimeRanges`).
 */
export function findInvalidRanges(
  ranges: ReadonlyArray<SuitableTimeRangeFormValues>,
  minDurationSeconds: number,
  openingHours: ReservableTimeSlots
): boolean[] {
  const listed = listTimeRanges(ranges);
  const tooShort = findTooShortListed(listed, minDurationSeconds);
  const outside = findOutsideListed(listed, openingHours);
  return toPattern(ranges).map(({ weekday, beginMinutes, endMinutes, data }) => {
    const position = listed.findIndex(
      (run) =>
        run.weekday === weekday &&
        run.data.priority === data.priority &&
        run.beginMinutes <= beginMinutes &&
        endMinutes <= run.endMinutes
    );
    return position !== -1 && (tooShort[position] === true || outside[position] === true);
  });
}
