"use client";

// See ResourceDayCalendar for why the row, cell and header roles are spelled out.
// oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role

import React, { memo } from "react";
import type { CSSProperties, KeyboardEvent, RefObject } from "react";
import { isCellOpen, segmentsInCell } from "../DatedWeekCalendar/engine";
import type { EventSegment } from "../DatedWeekCalendar/engine";
import type { DatedEvent, DatedEventProps } from "../DatedWeekCalendar/types";
import type { Range } from "../WeeklyPatternCalendar/engine";
import type { CalendarData } from "../WeeklyPatternCalendar/types";
import { formatRange } from "./format";
import { EventStripe, NowLine } from "./styles";
import type { TooltipController } from "./TooltipLayer";
import type { ResourceDayLabels, ResourceDayResource } from "./types";

export type Column = { index: number; beginMinutes: number; endMinutes: number };

type RowProps<TData extends CalendarData> = {
  resource: ResourceDayResource<TData>;
  segments: ReadonlyArray<EventSegment<TData>>;
  open: Map<string, Range[]> | null;
  dayKey: string;
  columns: ReadonlyArray<Column>;
  step: number;
  /** The shown extent, which a stripe is cut to. */
  shownBegin: number;
  shownEnd: number;
  /** The column of this row that holds the tab stop, or null when another row does. */
  activeIndex: number | null;
  /** The column the current time falls in, or null when the line isn't shown. */
  nowIndex: number | null;
  nowOffsetPercent: number;
  labels: ResourceDayLabels;
  getEventLabel: (event: DatedEvent<TData>) => string;
  getEventProps?: (event: DatedEvent<TData>) => DatedEventProps;
  getEventHref?: (event: DatedEvent<TData>) => string | undefined;
  /** Given only when there is a tooltip to show. */
  tooltipRef?: RefObject<TooltipController<TData> | null>;
  registerCell: (resourceId: string, index: number, element: HTMLTableCellElement | null) => void;
  onCellFocus: (resourceId: string, index: number) => void;
  onCellKeyDown: (event: KeyboardEvent<HTMLTableCellElement>, resourceId: string, index: number) => void;
  onCellClick: (resourceId: string, index: number) => void;
};

function ResourceDayRowImpl<TData extends CalendarData>({
  resource,
  segments: daySegments,
  open,
  dayKey,
  columns,
  step,
  shownBegin,
  shownEnd,
  activeIndex,
  nowIndex,
  nowOffsetPercent,
  labels,
  getEventLabel,
  getEventProps,
  getEventHref,
  tooltipRef,
  registerCell,
  onCellFocus,
  onCellKeyDown,
  onCellClick,
}: RowProps<TData>) {
  const firstIndex = columns[0]?.index;

  const stripeFor = (segment: EventSegment<TData>, cellBegin: number) => {
    const extra = getEventProps?.(segment.event);
    const begin = Math.max(segment.beginMinutes, shownBegin);
    const end = Math.min(segment.endMinutes, shownEnd);
    return (
      <EventStripe
        key={segment.event.id}
        aria-hidden
        {...extra}
        style={
          {
            ...extra?.style,
            "--lane": segment.lane,
            "--lanes": segment.lanes,
            left: `${((begin - cellBegin) / step) * 100}%`,
            width: `${((end - begin) / step) * 100}%`,
          } as CSSProperties
        }
        data-continues-before={segment.beginMinutes < shownBegin ? "" : undefined}
        data-continues-after={segment.endMinutes > shownEnd ? "" : undefined}
      >
        {segment.event.title}
      </EventStripe>
    );
  };

  return (
    <tr role="row">
      <th
        role="rowheader"
        scope="row"
        title={resource.title}
        aria-label={resource.isDraft ? `${resource.title}, ${labels.draftResource}` : resource.title}
        data-draft={resource.isDraft ? "" : undefined}
      >
        {resource.title}
      </th>
      {columns.map((column) => {
        const segments = segmentsInCell(daySegments, column.beginMinutes, column.endMinutes);
        const isOpen = isCellOpen(open, dayKey, column.beginMinutes, column.endMinutes);
        // A cell with one event that begins in it is named after the whole event.
        const only = segments.length === 1 ? segments[0] : undefined;
        const [begin, end] =
          only && only.beginMinutes >= column.beginMinutes
            ? [only.beginMinutes, only.endMinutes]
            : [column.beginMinutes, column.endMinutes];
        const opensTab = only != null && getEventHref?.(only.event) != null;
        const state =
          segments.length > 0
            ? segments.map((segment) => getEventLabel(segment.event)).join("; ") +
              (opensTab ? `, ${labels.opensInNewTab}` : "")
            : isOpen
              ? labels.free
              : labels.closed;
        // A stripe is drawn where its event begins, or at the first shown cell when it began earlier.
        const startingHere = segments.filter(
          (segment) =>
            (segment.beginMinutes >= column.beginMinutes && segment.beginMinutes < column.endMinutes) ||
            (column.index === firstIndex && segment.beginMinutes < column.beginMinutes)
        );
        return (
          <td
            key={column.index}
            role="gridcell"
            ref={(element) => registerCell(resource.id, column.index, element)}
            tabIndex={activeIndex === column.index ? 0 : -1}
            onFocus={() => onCellFocus(resource.id, column.index)}
            onKeyDown={(event) => onCellKeyDown(event, resource.id, column.index)}
            onClick={() => onCellClick(resource.id, column.index)}
            aria-label={`${resource.title}, ${formatRange(begin, end)}, ${state}`}
            aria-disabled={isOpen ? undefined : true}
            data-testid={`resource-day-calendar__cell-${resource.id}-${column.index}`}
            data-availability={isOpen ? "open" : "closed"}
            data-hour-start={column.beginMinutes % 60 === 0 ? "" : undefined}
            onMouseEnter={
              tooltipRef && segments.length > 0
                ? (event) =>
                    tooltipRef.current?.show(
                      segments.map((segment) => segment.event),
                      event.currentTarget.getBoundingClientRect()
                    )
                : undefined
            }
            onMouseLeave={tooltipRef ? () => tooltipRef.current?.hide() : undefined}
          >
            {startingHere.map((segment) => stripeFor(segment, column.beginMinutes))}
            {nowIndex === column.index && (
              <NowLine
                aria-hidden
                data-testid="resource-day-calendar__now-line"
                style={{ left: `${nowOffsetPercent}%` }}
              />
            )}
          </td>
        );
      })}
    </tr>
  );
}

/**
 * One resource's row. Memoised, so moving focus or the tooltip renders the rows whose tab stop changed and not the
 * whole grid. It only stays cheap when the callbacks and `labels` it is given keep their identity between renders.
 */
export const ResourceDayRow = memo(ResourceDayRowImpl) as typeof ResourceDayRowImpl;
