import type { CSSProperties, ReactNode } from "react";
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
  /** The cell holds a value, so it is part of a painted run. */
  painted: boolean;
  /**
   * What `aria-selected` reports. The same as `painted` while painting is the user's own choice. A mode where the
   * consumer owns a separate selection reports that instead, so a drawn cell is not announced as selected.
   */
  selected: boolean;
  isRunStart: boolean;
  isRunEnd: boolean;
  runBeginMinutes: number;
  runEndMinutes: number;
  /** First cell of the Selection, so a view can draw a frame around the whole run. False outside select mode. */
  isSelectionStart: boolean;
  /** Last cell of the Selection. False outside select mode. */
  isSelectionEnd: boolean;
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

export type WeeklyPatternSelectionAnnouncements = {
  /** Spoken (with weekday and time range appended) after a Selection is chosen, e.g. "Selected". */
  chosen: string;
  /** Spoken (with weekday and time range appended) after the Selection is cleared, e.g. "Selection cleared". */
  cleared: string;
};

/** Painting writes the value. Each gesture paints or erases, and a paint can be refused. */
type EditableProps<TData extends CalendarData> = {
  readOnly?: false;
  onChange: (value: WeeklyPatternValue<TData>) => void;
  announcements: WeeklyPatternAnnouncements;
  selection?: never;
  onSelectionChange?: never;
  selectionAnnouncements?: never;
};

/** Nothing can be changed. The value is only drawn. */
type ReadOnlyProps<TData extends CalendarData> = {
  readOnly: true;
  onChange?: (value: WeeklyPatternValue<TData>) => void;
  announcements?: WeeklyPatternAnnouncements;
  selection?: never;
  onSelectionChange?: never;
  selectionAnnouncements?: never;
};

/**
 * The gestures choose a Selection, which is one span on one weekday that the consumer owns. The value is still
 * drawn, so a layer such as Demand and the Selection live in the same cell. `aria-selected` marks only the
 * Selection here.
 */
type SelectProps<TData extends CalendarData> = {
  readOnly?: false;
  /** Never called in this mode. It is taken so the props of a form field can still be spread in. */
  onChange?: (value: WeeklyPatternValue<TData>) => void;
  announcements?: never;
  /** The chosen span, or `null` when nothing is chosen. */
  selection: WeekdayInterval | null;
  /**
   * Called with the span every committed gesture chose, or with `null` when the Selection is cleared. There is no
   * return value, so a Selection is never refused.
   */
  onSelectionChange: (next: WeekdayInterval | null) => void;
  selectionAnnouncements: WeeklyPatternSelectionAnnouncements;
};

export type WeeklyPatternCalendarProps<TData extends CalendarData> = (
  | EditableProps<TData>
  | ReadOnlyProps<TData>
  | SelectProps<TData>
) & {
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
  /**
   * How a weekday name is shown in the column header. Short is for a narrow day column, where a long name such as
   * "keskiviikko" does not fit. The header keeps the long name as its accessible name either way, so a screen
   * reader hears the same words, and so does a cell label.
   */
  weekdayNameStyle?: "long" | "short";
  /** Translated state word for a cell, e.g. "Closed", "Free", "Primary". */
  getStateLabel: (cell: WeeklyPatternCellInfo<TData>) => string;
  getCellAppearance?: (data: TData) => CellAppearance | undefined;
  getCellProps?: (cell: WeeklyPatternCellInfo<TData>) => WeeklyPatternCellProps;
  /**
   * Replaces what a cell shows. The default shows the hour, and where a painted run begins and ends. The cell's
   * accessible name comes from `getStateLabel`, so this changes only what is on screen.
   */
  renderCellContent?: (cell: WeeklyPatternCellInfo<TData>) => ReactNode;
  /** The equal form for the same task. A skip link to it is shown before the grid. */
  alternative: { id: string; label: string };

  className?: string;
  style?: CSSProperties;
  id?: string;
  "aria-label": string;
  "aria-describedby"?: string;
};
