import type { CSSProperties } from "react";
import type { Weekday } from "../../../gql/gql-types";

export type CalendarData = Record<string, unknown>;

export type WeekdayInterval = {
  weekday: Weekday;
  /** Inclusive, wall-clock minutes from midnight (0-1439). */
  beginMinutes: number;
  /** Exclusive, wall-clock minutes from midnight (1 to 1440, where 1440 is the end of the day). */
  endMinutes: number;
};

/** The open intervals across the week. Cells outside them are closed and can't be painted. */
export type WeeklyPatternAvailability = ReadonlyArray<WeekdayInterval>;

/** A painted interval. Position lives on the interval, domain values live in `data`. */
export type WeeklyPatternSpan<TData extends CalendarData> = WeekdayInterval & { data: TData };

export type WeeklyPatternValue<TData extends CalendarData> = ReadonlyArray<WeeklyPatternSpan<TData>>;

export type VisibleHours = { beginMinutes: number; endMinutes: number };

export type CellAppearance = "primary" | "secondary";

export type CellAvailability = "open" | "closed" | "unavailable";

export type WeeklyPatternCellInfo<TData extends CalendarData> = WeekdayInterval & {
  data: TData | undefined;
  selected: boolean;
  isRunStart: boolean;
  isRunEnd: boolean;
  /**
   * The first (last) painted cell of a block: the cell before (after) it is not painted, whatever the data. Runs of
   * different data that touch form one block, so only a block's edges are drawn as the ends of a time.
   */
  isBlockStart: boolean;
  isBlockEnd: boolean;
  runBeginMinutes: number;
  runEndMinutes: number;
  /**
   * Open is inside `availability`. Closed is outside it, and can still be painted when `paintable` reaches it.
   * Unavailable is outside `paintable` too, so nothing can be painted there.
   */
  availability: CellAvailability;
};

export type WeeklyPatternCellProps = { className?: string; style?: CSSProperties } & Record<
  `data-${string}`,
  string | number | boolean | undefined
>;

export type WeeklyPatternHandle = { focus(): void };

export type WeeklyPatternAnnouncements = {
  /** Spoken (with weekday and time range appended) after painting, e.g. "Added". */
  painted: string;
  /** Spoken (with weekday and time range appended) after erasing, e.g. "Removed". */
  erased: string;
};

type EditableProps<TData extends CalendarData> = {
  readOnly?: false;
  onChange: (value: WeeklyPatternValue<TData>) => void;
  announcements: WeeklyPatternAnnouncements;
};

type ReadOnlyProps<TData extends CalendarData> = {
  readOnly: true;
  onChange?: (value: WeeklyPatternValue<TData>) => void;
  announcements?: WeeklyPatternAnnouncements;
};

export type WeeklyPatternCalendarProps<TData extends CalendarData> = (EditableProps<TData> | ReadOnlyProps<TData>) & {
  // Controlled value/onChange pair, shaped like a react-hook-form Controller field.
  value: WeeklyPatternValue<TData>;
  onBlur?: () => void;
  name?: string;
  disabled?: boolean;

  /** Grid granularity in minutes. Must divide an hour, or be a whole number of hours dividing a day. */
  step: number;
  availability: WeeklyPatternAvailability;
  /**
   * Where a gesture can paint or select, when that reaches past `availability`. The cells it adds stay closed but
   * can be painted, and the cells outside both are unavailable. Without it, painting stops at `availability`.
   */
  paintable?: WeeklyPatternAvailability;
  /** Replaces the extent derived from `availability`. Painted spans outside it still extend the grid. */
  visibleHours?: VisibleHours;

  /** The data a gesture paints. Without a brush nothing can be painted (erasing still works). */
  brush?: TData;
  /** Defaults to a shallow comparison of the data objects. */
  isDataEqual?: (a: TData, b: TData) => boolean;
  /** Return a reason to refuse a paint. The reason is announced to screen readers. */
  isValidSelection?: (span: WeeklyPatternSpan<TData>) => string | null;

  /** Translated state word for a cell, e.g. "Closed", "Free", "Primary". */
  getStateLabel: (cell: WeeklyPatternCellInfo<TData>) => string;
  getCellAppearance?: (data: TData) => CellAppearance | undefined;
  /**
   * Why a painted run is invalid, or `null` when it is fine. Called for painted cells, with the run's extent on the
   * cell and every run painted on that day, in order (including a gesture in progress), for rules that depend on the
   * neighbouring runs. An invalid run is marked (`data-invalid`), its reason is added to the cells' accessible names,
   * and it is shown in a tooltip while the run is hovered or holds focus.
   * The time being painted (a drag until release, a Shift+Arrow sweep until Shift is released), with the runs touching
   * it, is checked only once the paint ends. Other runs, also on the same day, are checked as usual.
   */
  getRunError?: (cell: WeeklyPatternCellInfo<TData>, dayRuns: WeeklyPatternValue<TData>) => string | null;
  getCellProps?: (cell: WeeklyPatternCellInfo<TData>) => WeeklyPatternCellProps;
  /**
   * The equal alternative for the same task, e.g. a form or a list of the times. A skip link to it is shown before the
   * grid. Leave it out when the alternative is already as easy to reach, e.g. in a tab next to the calendar.
   */
  alternative?: { id: string; label: string };

  className?: string;
  style?: CSSProperties;
  id?: string;
  "aria-label": string;
  "aria-describedby"?: string;
};
