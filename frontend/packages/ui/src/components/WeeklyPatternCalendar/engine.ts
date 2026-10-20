import { WEEKDAYS_SORTED } from "@ui/modules/const";
import type { Weekday } from "../../../gql/gql-types";
import type {
  CalendarData,
  VisibleHours,
  WeeklyPatternAvailability,
  WeeklyPatternSpan,
  WeeklyPatternValue,
} from "./types";

// Pure, framework-free grid math, so it can be unit tested without React or the DOM.
export const MINUTES_PER_DAY = 24 * 60;

export type Range = { beginMinutes: number; endMinutes: number };
// One day's cells indexed by step. `undefined` means "not painted", not "closed":
// openness is tracked separately through availability.
export type DayCells<TData> = ReadonlyArray<TData | undefined>;
export type CellGrid<TData> = Readonly<Record<Weekday, DayCells<TData>>>;
export type PaintMode<TData> = { kind: "paint"; data: TData } | { kind: "erase" };

export function assertValidStep(step: number): void {
  const dividesHour = 60 % step === 0;
  const wholeHoursDividingDay = step % 60 === 0 && MINUTES_PER_DAY % step === 0;
  if (!Number.isInteger(step) || step <= 0 || !(dividesHour || wholeHoursDividingDay)) {
    throw new RangeError(
      `step must divide an hour (e.g. 5, 15, 30, 60) or be a whole number of hours dividing a day (e.g. 120, 180); got ${step}`
    );
  }
}

export function shallowEqual(a: CalendarData, b: CalendarData): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return keysA.length === keysB.length && keysA.every((key) => key in b && Object.is(a[key], b[key]));
}

export function mergeRanges(ranges: ReadonlyArray<Range>): Range[] {
  const sorted = ranges
    .filter((range) => range.endMinutes > range.beginMinutes)
    .map((range) => ({ beginMinutes: range.beginMinutes, endMinutes: range.endMinutes }))
    .sort((a, b) => a.beginMinutes - b.beginMinutes || a.endMinutes - b.endMinutes);

  const merged: Range[] = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (last && range.beginMinutes <= last.endMinutes) {
      last.endMinutes = Math.max(last.endMinutes, range.endMinutes);
    } else {
      merged.push(range);
    }
  }
  return merged;
}

export function groupAvailability(availability: WeeklyPatternAvailability): Record<Weekday, Range[]> {
  const byDay = Object.fromEntries(WEEKDAYS_SORTED.map((weekday) => [weekday, [] as Range[]])) as Record<
    Weekday,
    Range[]
  >;
  for (const { weekday, beginMinutes, endMinutes } of availability) {
    byDay[weekday].push({ beginMinutes, endMinutes });
  }
  for (const weekday of WEEKDAYS_SORTED) {
    byDay[weekday] = mergeRanges(byDay[weekday]);
  }
  return byDay;
}

// A span is open only if it sits entirely inside one merged range.
export function isRangeOpen(ranges: ReadonlyArray<Range>, beginMinutes: number, endMinutes: number): boolean {
  return ranges.some((range) => range.beginMinutes <= beginMinutes && endMinutes <= range.endMinutes);
}

// Widens a range outward to the step boundaries so e.g. 08:30 at a 60-minute step still gets a full row.
export function snapOutward(range: Range, step: number): Range {
  return {
    beginMinutes: Math.max(0, Math.floor(range.beginMinutes / step) * step),
    endMinutes: Math.min(MINUTES_PER_DAY, Math.ceil(range.endMinutes / step) * step),
  };
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

/**
 * The grid's vertical extent: the explicit override, or the extent of the open ranges. Painted spans
 * always extend it, so saved times that fell outside the opening hours stay visible and removable.
 * `null` means there is nothing to show.
 */
export function resolveVisibleHours(
  override: VisibleHours | undefined,
  byDay: Readonly<Record<Weekday, ReadonlyArray<Range>>>,
  painted: ReadonlyArray<Range>,
  step: number
): Range | null {
  const base = override ?? extentOf(WEEKDAYS_SORTED.flatMap((weekday) => byDay[weekday]));
  const paintedExtent = extentOf(painted);
  const all = [base, paintedExtent].filter((range): range is Range => range != null);
  const union = extentOf(all);
  if (!union) {
    return null;
  }
  const snapped = snapOutward(union, step);
  return snapped.endMinutes > snapped.beginMinutes ? snapped : null;
}

// Expands the sparse list of spans into a dense per-cell grid.
export function patternToGrid<TData extends CalendarData>(
  value: WeeklyPatternValue<TData>,
  step: number
): CellGrid<TData> {
  const length = MINUTES_PER_DAY / step;
  const grid = Object.fromEntries(
    WEEKDAYS_SORTED.map((weekday) => [weekday, Array.from({ length }, () => undefined)])
  ) as Record<Weekday, Array<TData | undefined>>;

  for (const { weekday, beginMinutes, endMinutes, data } of value) {
    const first = Math.ceil(Math.max(0, beginMinutes) / step);
    const last = Math.floor(Math.min(MINUTES_PER_DAY, endMinutes) / step);
    for (let index = first; index < last; index++) {
      grid[weekday][index] = data;
    }
  }
  return grid;
}

// The inverse of patternToGrid: consecutive cells with equal data collapse into one span.
export function gridToPattern<TData extends CalendarData>(
  grid: CellGrid<TData>,
  step: number,
  isDataEqual: (a: TData, b: TData) => boolean
): WeeklyPatternValue<TData> {
  const spans: Array<WeeklyPatternSpan<TData>> = [];

  for (const weekday of WEEKDAYS_SORTED) {
    const cells = grid[weekday];
    let run: { start: number; data: TData } | null = null;

    for (let index = 0; index <= cells.length; index++) {
      const data = cells[index];
      if (run && data !== undefined && isDataEqual(run.data, data)) {
        continue;
      }
      if (run) {
        spans.push({ weekday, beginMinutes: run.start * step, endMinutes: index * step, data: run.data });
      }
      run = data !== undefined ? { start: index, data } : null;
    }
  }
  return spans;
}

/**
 * What a gesture starting on a cell does, or `null` if it can do nothing.
 * Closed cells can only be erased, because saved times may outlive the opening hours that allowed them.
 * Open cells erase when they already hold the brush's data. Otherwise they paint.
 */
export function paintModeFor<TData extends CalendarData>(
  current: TData | undefined,
  brush: TData | undefined,
  isOpen: boolean,
  isDataEqual: (a: TData, b: TData) => boolean
): PaintMode<TData> | null {
  if (!isOpen) {
    return current !== undefined ? { kind: "erase" } : null;
  }
  if (brush === undefined) {
    return null;
  }
  return current !== undefined && isDataEqual(current, brush) ? { kind: "erase" } : { kind: "paint", data: brush };
}

/** Erasing is allowed anywhere. Painting is allowed only on open cells. */
export function isEditableFor<TData>(mode: PaintMode<TData>, isOpen: (index: number) => boolean) {
  return (index: number) => mode.kind === "erase" || isOpen(index);
}

/** Returns `grid` itself when nothing changed, so callers can detect a no-op by reference. */
export function paintRange<TData>(
  grid: CellGrid<TData>,
  weekday: Weekday,
  from: number,
  to: number,
  mode: PaintMode<TData>,
  isEditable: (index: number) => boolean,
  isDataEqual: (a: TData, b: TData) => boolean
): CellGrid<TData> {
  const cells = grid[weekday];
  const first = Math.max(0, Math.min(from, to));
  const last = Math.min(cells.length - 1, Math.max(from, to));
  const nextData = mode.kind === "paint" ? mode.data : undefined;

  // Clone lazily so a drag over already-correct cells doesn't allocate.
  let next: Array<TData | undefined> | null = null;
  for (let index = first; index <= last; index++) {
    const existing = (next ?? cells)[index];
    const unchanged =
      existing === undefined || nextData === undefined ? existing === nextData : isDataEqual(existing, nextData);
    if (!isEditable(index) || unchanged) {
      continue;
    }
    next ??= [...cells];
    next[index] = nextData;
  }
  return next ? { ...grid, [weekday]: next } : grid;
}
