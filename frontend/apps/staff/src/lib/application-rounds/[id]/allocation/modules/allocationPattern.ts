import {
  gridToPattern,
  isRangeOpen,
  mergeRanges,
  MINUTES_PER_DAY,
  shallowEqual,
} from "@ui/components/WeeklyPatternCalendar/engine";
import type { Range } from "@ui/components/WeeklyPatternCalendar/engine";
import type { VisibleHours, WeekdayInterval, WeeklyPatternValue } from "@ui/components/WeeklyPatternCalendar/types";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import { timeToMinutes } from "ui/src/modules/date-utils";
import { endTimeToMinutes } from "ui/src/modules/suitableTimes";
import type { Priority, Weekday } from "@gql/gql-types";

/**
 * What the allocation calendar draws, built from the query result alone. There is no React and no GraphQL here,
 * so every rule below can be read and tested on its own.
 *
 * The words are the ones in GLOSSARY.md. Demand is how many Application Sections still want a time, an Allocation
 * is a time staff gave a section on the shown reservation unit, and an Affecting Allocation takes a time away from
 * that unit.
 */

/** The grid granularity. 15 minutes for every reservation unit, so a quarter hour request is drawn where it is. */
export const ALLOCATION_STEP_MINUTES = 15;

/** The hours the grid always shows. The extent grows from here, it never clips. */
export const ALLOCATION_MINIMUM_HOURS: VisibleHours = { beginMinutes: 7 * 60, endMinutes: MINUTES_PER_DAY };

const CELLS_PER_DAY = MINUTES_PER_DAY / ALLOCATION_STEP_MINUTES;

/** The whole week as dense cells, which is what a run of equal cells is read off. */
type CellsByWeekday = Record<Weekday, Array<AllocationCellData | undefined>>;

/** A weekday and a time range, the shape every allocation time arrives in. */
type AllocationTimes = {
  dayOfTheWeek: Weekday;
  beginTime: string;
  endTime: string;
};

/** A Suitable Time Range, as the allocation query returns it. */
export type AllocationRange = AllocationTimes & { priority: Priority };

/** An Allocation or an Affecting Allocation, as the allocation query returns it. Only an Allocation has a pk. */
export type AllocationSlot = AllocationTimes & { pk?: number | null };

/**
 * The parts of an Application Section this module reads. A query node fits as it is. The caller narrows
 * `reservationUnitOptions` to the shown reservation unit, so every Allocation here is on that unit.
 */
export type AllocationSection = {
  pk?: number | null;
  suitableTimeRanges: ReadonlyArray<AllocationRange>;
  reservationUnitOptions: ReadonlyArray<{ allocatedTimeSlots: ReadonlyArray<AllocationSlot> }>;
};

/** The priorities to count. Null or empty means every priority. */
export type PriorityFilter = ReadonlyArray<Priority> | null | undefined;

/**
 * One resolved state per cell. A cell is allocated, or taken by an Affecting Allocation, or it holds Demand with a
 * count. A label cannot say "allocated, and two others still want this", which nobody can see today either.
 */
export type AllocationCellData = { state: "allocated" } | { state: "affecting" } | { state: "demand"; count: number };

export type AllocationPatternArgs = {
  /** The Application Sections of the shown reservation unit. */
  sections: ReadonlyArray<AllocationSection>;
  /** The flat list of Affecting Allocations the query returns. */
  affecting: ReadonlyArray<AllocationSlot>;
  priorityFilter?: PriorityFilter;
  /** The current Selection. It is only read for the extent, because the calendar draws it itself. */
  selection?: WeekdayInterval | null;
};

export type AllocationPattern = {
  pattern: WeeklyPatternValue<AllocationCellData>;
  extent: VisibleHours;
};

export type AllocationHighlightKind = "range" | "allocation";

/** One outlined span. A range comes from a Suitable Time Range, an allocation from an Allocation. */
export type AllocationHighlight = WeekdayInterval & { kind: AllocationHighlightKind };

export type AllocationHighlightArgs = {
  sections: ReadonlyArray<AllocationSection>;
  /** The Application Section to outline, whose Suitable Time Ranges and Allocations are both shown. */
  sectionPk?: number | null;
  /** The single Allocation to outline. It wins, because the two search params are mutually exclusive. */
  allocationPk?: number | null;
  priorityFilter?: PriorityFilter;
};

// The API writes the end of the day as 00:00, which the grid models as minute 1440.
function toRange(times: AllocationTimes): Range {
  return { beginMinutes: timeToMinutes(times.beginTime), endMinutes: endTimeToMinutes(times.endTime) };
}

/**
 * The one rule for "this span wants this time". A cell and a Selection both use it, so the number in a cell and
 * the number of request cards cannot drift apart.
 */
function overlaps(a: Range, b: Range): boolean {
  return a.beginMinutes < b.endMinutes && a.endMinutes > b.beginMinutes;
}

function matchesPriority(range: AllocationRange, priorityFilter: PriorityFilter): boolean {
  return priorityFilter == null || priorityFilter.length === 0 || priorityFilter.includes(range.priority);
}

/** The Suitable Time Ranges of one section on one weekday, after the priority filter. */
function rangesOn(section: AllocationSection, weekday: Weekday, priorityFilter?: PriorityFilter): Range[] {
  return section.suitableTimeRanges
    .filter((range) => range.dayOfTheWeek === weekday && matchesPriority(range, priorityFilter))
    .map((range) => toRange(range));
}

function allocationsOf(section: AllocationSection): AllocationSlot[] {
  return section.reservationUnitOptions.flatMap((option) => option.allocatedTimeSlots);
}

function onWeekday<T extends AllocationTimes>(times: ReadonlyArray<T>, weekday: Weekday): T[] {
  return times.filter((time) => time.dayOfTheWeek === weekday);
}

function cellAt(index: number): Range {
  return {
    beginMinutes: index * ALLOCATION_STEP_MINUTES,
    endMinutes: (index + 1) * ALLOCATION_STEP_MINUTES,
  };
}

/**
 * The state of one cell. An Allocation wins over an Affecting Allocation, which wins over Demand. A section counts
 * once for a cell, however many of its ranges reach into it.
 */
function resolveCell(
  cell: Range,
  demand: ReadonlyArray<ReadonlyArray<Range>>,
  allocated: ReadonlyArray<Range>,
  affecting: ReadonlyArray<Range>
): AllocationCellData | undefined {
  if (allocated.some((range) => overlaps(range, cell))) {
    return { state: "allocated" };
  }
  if (affecting.some((range) => overlaps(range, cell))) {
    return { state: "affecting" };
  }
  const count = demand.filter((ranges) => ranges.some((range) => overlaps(range, cell))).length;
  return count > 0 ? { state: "demand", count } : undefined;
}

function dayCells(
  weekday: Weekday,
  { sections, affecting, priorityFilter }: AllocationPatternArgs
): Array<AllocationCellData | undefined> {
  const demand = sections
    .map((section) => rangesOn(section, weekday, priorityFilter))
    .filter((ranges) => ranges.length > 0);
  const allocations = sections.flatMap((section) => allocationsOf(section));
  const allocated = onWeekday(allocations, weekday).map((slot) => toRange(slot));
  const taken = onWeekday(affecting, weekday).map((slot) => toRange(slot));

  return Array.from({ length: CELLS_PER_DAY }, (_, index) => resolveCell(cellAt(index), demand, allocated, taken));
}

/** 07:00 to 24:00 is the minimum. Every span extends it, and so does the Selection, so a poll cannot hide it. */
function toExtent(pattern: WeeklyPatternValue<AllocationCellData>, selection: WeekdayInterval | null): VisibleHours {
  const spans: Range[] = [ALLOCATION_MINIMUM_HOURS, ...pattern];
  if (selection != null) {
    spans.push(selection);
  }
  return {
    beginMinutes: Math.min(...spans.map((span) => span.beginMinutes)),
    endMinutes: Math.max(...spans.map((span) => span.endMinutes)),
  };
}

/**
 * What the calendar draws, and the hours it draws it in. Every boundary in the data is a multiple of 15, because a
 * Suitable Time Range is constrained to `:00`, `:15`, `:30` and `:45` and an Allocation is validated as a multiple
 * of 15, so nothing is rounded or snapped on the way in.
 */
export function toAllocationPattern(args: AllocationPatternArgs): AllocationPattern {
  const grid = Object.fromEntries(
    WEEKDAYS_SORTED.map((weekday) => [weekday, dayCells(weekday, args)])
  ) as CellsByWeekday;

  const pattern = gridToPattern<AllocationCellData>(grid, ALLOCATION_STEP_MINUTES, shallowEqual);
  return { pattern, extent: toExtent(pattern, args.selection ?? null) };
}

function toHighlight(times: AllocationTimes, kind: AllocationHighlightKind): AllocationHighlight {
  return { weekday: times.dayOfTheWeek, ...toRange(times), kind };
}

/**
 * The spans to outline. One Application Section shows its Suitable Time Ranges and its Allocations, and one
 * Allocation shows itself alone.
 */
export function toHighlightRanges({
  sections,
  sectionPk,
  allocationPk,
  priorityFilter,
}: AllocationHighlightArgs): AllocationHighlight[] {
  if (allocationPk != null) {
    const slot = sections
      .flatMap((section) => allocationsOf(section))
      .find((candidate) => candidate.pk === allocationPk);
    return slot == null ? [] : [toHighlight(slot, "allocation")];
  }

  const section = sectionPk == null ? null : sections.find((candidate) => candidate.pk === sectionPk);
  if (section == null) {
    return [];
  }
  return [
    ...section.suitableTimeRanges
      .filter((range) => matchesPriority(range, priorityFilter))
      .map((range) => toHighlight(range, "range")),
    ...allocationsOf(section).map((slot) => toHighlight(slot, "allocation")),
  ];
}

/**
 * Whether the Selection can be allocated to the section. The section's ranges on that weekday are merged first, so
 * a Selection across two touching ranges fits. This is the backend's rule in `fits_in_time_range`. The priority
 * filter decides which cards show, not whether a time fits, so it is not read here.
 */
export function fitsSection(selection: WeekdayInterval, section: AllocationSection): boolean {
  const merged = mergeRanges(rangesOn(section, selection.weekday));
  // isRangeOpen asks exactly this: the span lies fully inside one merged range.
  return isRangeOpen(merged, selection.beginMinutes, selection.endMinutes);
}

/** Whether the section wants the span, by the same rule a cell's number uses. */
export function wantsInterval(
  interval: WeekdayInterval,
  section: AllocationSection,
  priorityFilter?: PriorityFilter
): boolean {
  return rangesOn(section, interval.weekday, priorityFilter).some((range) => overlaps(range, interval));
}

/**
 * The Affecting Allocation that takes the Selection's time, or null when the time is free. The cell state and the
 * column's block both use this, so they cannot drift apart.
 */
export function findBlockingAffecting<T extends AllocationSlot>(
  selection: WeekdayInterval,
  affecting: ReadonlyArray<T>
): T | null {
  return onWeekday(affecting, selection.weekday).find((slot) => overlaps(toRange(slot), selection)) ?? null;
}
