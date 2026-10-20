import { MINUTES_PER_DAY } from "@ui/components/WeeklyPatternCalendar/engine";
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
