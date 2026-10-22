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

export type WeeklyPatternCellInfo<TData extends CalendarData> = WeekdayInterval & {
  data: TData | undefined;
  selected: boolean;
  isRunStart: boolean;
  isRunEnd: boolean;
  runBeginMinutes: number;
  runEndMinutes: number;
  availability: "open" | "closed";
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
  /** Replaces the extent derived from `availability`. Painted spans outside it still extend the grid. */
  visibleHours?: VisibleHours;

  /** The data a gesture paints. Without a brush nothing can be painted (erasing still works). */
  brush?: TData;
  /** Defaults to a shallow comparison of the data objects. */
  isDataEqual?: (a: TData, b: TData) => boolean;
  /** Return a reason to refuse a paint. The reason is announced to screen readers. */
  isValidPaint?: (span: WeeklyPatternSpan<TData>) => string | null;

  /** BCP 47 tag used for weekday names. */
  locale: string;
  /** Translated state word for a cell, e.g. "Closed", "Free", "Primary". */
  getStateLabel: (cell: WeeklyPatternCellInfo<TData>) => string;
  getCellAppearance?: (data: TData) => CellAppearance | undefined;
  getCellProps?: (cell: WeeklyPatternCellInfo<TData>) => WeeklyPatternCellProps;
  /** The equal form for the same task. A skip link to it is shown before the grid. */
  alternative: { id: string; label: string };

  className?: string;
  style?: CSSProperties;
  id?: string;
  "aria-label": string;
  "aria-describedby"?: string;
};
