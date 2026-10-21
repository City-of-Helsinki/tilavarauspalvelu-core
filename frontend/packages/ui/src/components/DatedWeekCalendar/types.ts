import type { CSSProperties, ReactNode } from "react";
import type { CalendarData } from "../WeeklyPatternCalendar/types";

export type DatedWeekView = "day" | "week";

/** Something that happens on concrete dates. Position lives on the event, domain values live in `data`. */
export type DatedEvent<TData extends CalendarData> = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  data: TData;
};

/** A stretch of time when the cells are open. Everything is open when no ranges are given. */
export type DatedOpenRange = { start: Date; end: Date };

export type DatedVisibleHours = { beginMinutes: number; endMinutes: number };

export type DatedCellInfo<TData extends CalendarData> = {
  /** Calendar date of the column in Europe/Helsinki, formatted yyyy-MM-dd. */
  dayKey: string;
  /** Wall-clock minutes from midnight in Europe/Helsinki. */
  beginMinutes: number;
  endMinutes: number;
  availability: "open" | "closed";
  events: ReadonlyArray<DatedEvent<TData>>;
};

export type DatedEventProps = { className?: string; style?: CSSProperties } & Record<
  `data-${string}`,
  string | number | boolean | undefined
>;

export type DatedWeekHandle = { focus(): void };

export type DatedWeekLabels = {
  /** Name of the toolbar, e.g. "Calendar controls". */
  toolbar: string;
  previous: string;
  next: string;
  today: string;
  day: string;
  week: string;
  /** Summary of the text list that is the equal alternative to the grid. */
  list: string;
  /** Skip link text that leads to the list. */
  skipToList: string;
  /** Text of the list when nothing happens in the shown range. */
  emptyList: string;
  /** Cell state word for an open cell without events. */
  free: string;
  /** Cell state word for a closed cell without events. */
  closed: string;
  /** Said after an event that opens a new tab, e.g. "opens in a new tab". */
  opensInNewTab: string;
};

export type DatedWeekCalendarProps<TData extends CalendarData> = {
  /** Any moment inside the shown range. The range is the day or the Monday to Sunday week around it. */
  date: Date;
  onNavigate: (date: Date) => void;
  view: DatedWeekView;
  onViewChange: (view: DatedWeekView) => void;

  events: ReadonlyArray<DatedEvent<TData>>;
  openRanges?: ReadonlyArray<DatedOpenRange>;

  /** Grid granularity in minutes. Must divide an hour. */
  step: number;
  /** Replaces the extent derived from the open ranges. Events outside it still extend the grid. */
  visibleHours?: DatedVisibleHours;

  /** BCP 47 tag used for weekday, date and range names. */
  locale: string;
  labels: DatedWeekLabels;
  /** Translated description of one event for screen readers, e.g. "Confirmed reservation: Meeting". */
  getEventLabel: (event: DatedEvent<TData>) => string;
  getEventProps?: (event: DatedEvent<TData>) => DatedEventProps;
  /**
   * Where an event leads, opened in a new tab. Events with a link are links in the text list, and Enter or Space
   * on a cell opens the link of its only event. With several linked events Enter moves focus to them in the list.
   */
  getEventHref?: (event: DatedEvent<TData>) => string | undefined;
  /** Marks the grid busy while its events are being fetched. */
  isLoading?: boolean;
  /** Extra toolbar content, e.g. a button that edits the shown reservation. */
  toolbarExtra?: ReactNode;

  className?: string;
  id?: string;
  "aria-label": string;
};
