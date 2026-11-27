import type { TFunction } from "next-i18next/pages";
import type { VisibleHours } from "@ui/components/WeeklyPatternCalendar/types";
import { convertWeekday } from "ui/src/modules/conversion";
import { formatDuration, formatTimeRange, minutesToHoursString, timeToMinutes } from "ui/src/modules/date-utils";
import { filterNonNullable, sort } from "ui/src/modules/helpers";
import { Priority } from "@gql/gql-types";
import type { SuitableTimeRangeNode, ApplicationSectionNode, ApplicationSectionAllocationsQuery } from "@gql/gql-types";
import { ALLOCATION_STEP_MINUTES } from "./allocationPattern";

type QueryT = NonNullable<ApplicationSectionAllocationsQuery["applicationSections"]>;
type EdgeT = NonNullable<QueryT["edges"][0]>;
export type SectionNodeT = NonNullable<EdgeT["node"]>;
export type SuitableTimeRangeNodeT = SectionNodeT["suitableTimeRanges"][0];
export type ReservationUnitOptionNodeT = NonNullable<SectionNodeT["reservationUnitOptions"]>[0];

/** One time the form offers. The value is minutes from midnight, the shape the Selection speaks in. */
export type TimeOption = { label: string; value: number };

/** Every step from the first time to the last one, both included. 1440 reads as `24:00`, not `00:00`. */
function timeOptions(beginMinutes: number, endMinutes: number): TimeOption[] {
  const options: TimeOption[] = [];
  for (let minutes = beginMinutes; minutes <= endMinutes; minutes += ALLOCATION_STEP_MINUTES) {
    options.push({ label: minutesToHoursString(minutes, true), value: minutes });
  }
  return options;
}

/**
 * The begin times of the form, taken from the hours the grid draws. The last step of the extent is left out,
 * because a Selection that begins there has no room for an end time.
 */
export function getBeginTimeOptions(extent: VisibleHours): TimeOption[] {
  return timeOptions(extent.beginMinutes, extent.endMinutes - ALLOCATION_STEP_MINUTES);
}

/**
 * The end times of the form. An end time is exclusive, so the first option is one step after the extent begins and
 * the last one is the end of the extent.
 */
export function getEndTimeOptions(extent: VisibleHours): TimeOption[] {
  return timeOptions(extent.beginMinutes + ALLOCATION_STEP_MINUTES, extent.endMinutes);
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

export function convertPriorityFilter(values: number[]): Priority[] {
  const result: Priority[] = [];
  for (const x of values) {
    if (x === 300) {
      result.push(Priority.Primary);
    } else if (x === 200) {
      result.push(Priority.Secondary);
    }
  }
  return result;
}
