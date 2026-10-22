import type { ReactNode } from "react";
import type {
  DatedEvent,
  DatedEventProps,
  DatedOpenRange,
  DatedRange,
  DatedVisibleHours,
  DatedWeekLabels,
} from "../DatedWeekCalendar/types";
import type { CalendarData } from "../WeeklyPatternCalendar/types";

/** One row of the grid, e.g. a reservation unit. */
export type ResourceDayResource<TData extends CalendarData> = {
  id: string;
  title: string;
  /** A draft is marked in the row header, visibly and for screen readers. */
  isDraft?: boolean;
  events: ReadonlyArray<DatedEvent<TData>>;
  /** Everything is open when no ranges are given. */
  openRanges?: ReadonlyArray<DatedOpenRange>;
};

export type ResourceDayLabels = Pick<
  DatedWeekLabels,
  "list" | "skipToList" | "emptyList" | "free" | "closed" | "opensInNewTab"
> & {
  /** Said after the name of a draft resource. */
  draftResource: string;
};

export type ResourceDayHandle = { focus(): void };

export type ResourceDayCalendarProps<TData extends CalendarData> = {
  /** Any moment inside the shown day. */
  date: Date;
  resources: ReadonlyArray<ResourceDayResource<TData>>;

  /** Grid granularity in minutes. Must divide an hour. */
  step: number;
  /** The times shown. Defaults to the whole day. Events outside it still extend the grid. */
  visibleHours?: DatedVisibleHours;

  labels: ResourceDayLabels;
  /** Translated description of one event for screen readers, e.g. "Confirmed reservation: Meeting". */
  getEventLabel: (event: DatedEvent<TData>) => string;
  getEventProps?: (event: DatedEvent<TData>) => DatedEventProps;
  /**
   * Where an event leads, opened in a new tab. Events with a link are links in the text list, and Enter or Space
   * on a cell opens the link of its only event. With several linked events Enter moves focus to them in the list.
   */
  getEventHref?: (event: DatedEvent<TData>) => string | undefined;
  /**
   * Content of the tooltip shown while a mouse hovers a cell with events, e.g. the whole title that the stripe
   * cuts short. Purely visual: it is hidden from screen readers, which get the same facts from the cell label.
   * Return null for events without one.
   */
  renderEventTooltip?: (event: DatedEvent<TData>) => ReactNode;
  /**
   * Called when a free open cell is chosen by click, tap, Enter or Space. Return a reason to refuse, which is
   * announced, or null to accept. Without it cells can't be chosen and the grid is read only.
   */
  onSelectSlot?: (resourceId: string, range: DatedRange) => string | null;
  /** Marks the grid busy while its events are being fetched. */
  isLoading?: boolean;

  className?: string;
  id?: string;
  "aria-label": string;
};
