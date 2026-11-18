import {
  groupAvailability,
  gridToPattern,
  isRangeOpen,
  MINUTES_PER_DAY,
  paintRange,
  patternToGrid,
  shallowEqual,
} from "@ui/components/WeeklyPatternCalendar/engine";
import type { WeeklyPatternValue } from "@ui/components/WeeklyPatternCalendar/types";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import {
  findTooShortListed,
  fromPattern,
  isInsideOpeningHours,
  listSuitableTimes,
  SUITABLE_TIME_STEP_MINUTES,
  toAvailability,
  toPattern,
} from "ui/src/modules/suitableTimes";
import type { ReservableTimeSlots, SuitableTimeData } from "ui/src/modules/suitableTimes";
import type { Priority, Weekday } from "@gql/gql-types";
import type { SuitableTimeRangeFormValues } from "./form";

export type TimeRangeInput = { weekday: Weekday; beginMinutes: number; endMinutes: number; priority: Priority };

// The saved ranges as the calendar shows them (see `listSuitableTimes`, which the form validation uses too).
export function listTimeRanges(
  ranges: ReadonlyArray<SuitableTimeRangeFormValues>
): WeeklyPatternValue<SuitableTimeData> {
  return listSuitableTimes(ranges);
}

export { findTooShortListed };

/** The days that have any time open, in week order. */
export function listOpenWeekdays(openingHours: ReservableTimeSlots): Weekday[] {
  const open = groupAvailability(toAvailability(openingHours));
  return WEEKDAYS_SORTED.filter((weekday) => listStartOptions(openingHours, weekday, open).length > 0);
}

/** The start times (in minutes) that can be picked on a day: every step whose first step is open. */
export function listStartOptions(
  openingHours: ReservableTimeSlots,
  weekday: Weekday,
  open = groupAvailability(toAvailability(openingHours))
): number[] {
  const step = SUITABLE_TIME_STEP_MINUTES;
  const options: number[] = [];
  for (let minutes = 0; minutes + step <= MINUTES_PER_DAY; minutes += step) {
    if (isRangeOpen(open[weekday], minutes, minutes + step)) {
      options.push(minutes);
    }
  }
  return options;
}

/** The end times (in minutes) that can be picked for a start: every step up to where its opening hours end. */
export function listEndOptions(openingHours: ReservableTimeSlots, weekday: Weekday, beginMinutes: number): number[] {
  const step = SUITABLE_TIME_STEP_MINUTES;
  const open = groupAvailability(toAvailability(openingHours))[weekday];
  const options: number[] = [];
  for (let minutes = beginMinutes + step; isRangeOpen(open, beginMinutes, minutes); minutes += step) {
    options.push(minutes);
  }
  return options;
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
