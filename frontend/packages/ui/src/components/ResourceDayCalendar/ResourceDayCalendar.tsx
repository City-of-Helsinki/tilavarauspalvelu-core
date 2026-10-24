"use client";

// A native <table role="grid"> is the APG pattern for a keyboard-navigable grid. See WeeklyPatternCalendar for why
// the row, cell and header roles are spelled out.
// oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ForwardedRef, ReactElement, Ref } from "react";
import { LiveRegion, SkipLink } from "../CalendarGrid/styles";
import {
  cellRange,
  isCellOpen,
  segmentsInCell,
  dayKeyOf,
  minutesOfDay,
  nowHourOffsetPercent,
  nowOffsetPercent,
  openRangesByDay,
  resolveVisibleHours,
  segmentEvents,
  toWallClock,
  visibleDays,
} from "../DatedWeekCalendar/engine";
import { assertValidStep } from "../WeeklyPatternCalendar/engine";
import type { CalendarData } from "../WeeklyPatternCalendar/types";
import { formatClock, formatRange } from "./format";
import { ResourceDayRow } from "./Row";
import type { Column } from "./Row";
import { GridScroller, ListAlternative, NowDot, ResourceDayRoot } from "./styles";
import { TooltipLayer } from "./TooltipLayer";
import type { TooltipController } from "./TooltipLayer";
import type { ResourceDayCalendarProps, ResourceDayHandle } from "./types";
import { useResourceDayCalendar } from "./useResourceDayCalendar";

const NO_SEGMENTS: never[] = [];
const WHOLE_DAY = { beginMinutes: 0, endMinutes: 24 * 60 };
// The hour the view starts at when it is not today, so the night isn't what greets the user.
const MORNING_HOUR = 7;

function ResourceDayTable<TData extends CalendarData>(
  props: ResourceDayCalendarProps<TData>,
  ref: ForwardedRef<ResourceDayHandle>
): ReactElement {
  const {
    date,
    resources,
    step,
    visibleHours = WHOLE_DAY,
    labels,
    getEventLabel,
    getEventProps,
    getEventHref,
    renderEventTooltip,
    onSelectSlot,
    isLoading,
    className,
    id,
    "aria-label": ariaLabel,
  } = props;
  assertValidStep(step);
  if (60 % step !== 0) {
    throw new RangeError(`step must divide an hour; got ${step}`);
  }

  const listId = useId();
  // Keyed on the time, since a caller may hand over a new Date for the same day on every render.
  const dateMs = date.getTime();
  const days = useMemo(() => visibleDays(new Date(dateMs), "day"), [dateMs]);
  const dayKey = dayKeyOf(days[0] ?? toWallClock(date));
  const resourceIds = resources.map((resource) => resource.id);

  const segmentsByResource = useMemo(
    () => new Map(resources.map((resource) => [resource.id, segmentEvents(resource.events, days).get(dayKey) ?? []])),
    [resources, days, dayKey]
  );
  const openByResource = useMemo(
    () => new Map(resources.map((resource) => [resource.id, openRangesByDay(resource.openRanges, days)])),
    [resources, days]
  );

  // Ticks once every 5 minutes, so the current time line keeps up without redrawing the grid more than that.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 300_000);
    return () => clearInterval(timer);
  }, []);
  const wallNow = toWallClock(now);
  const isToday = dayKeyOf(wallNow) === dayKey;

  const hours = resolveVisibleHours(visibleHours, null, [...segmentsByResource.values()].flat(), step);
  const firstIndex = hours.beginMinutes / step;
  const endIndex = hours.endMinutes / step;

  const nowMinutes = minutesOfDay(wallNow);
  const nowIndex = Math.floor(nowMinutes / step);
  const showNowLine = isToday && nowIndex >= firstIndex && nowIndex < endIndex;
  const nowOffset = nowOffsetPercent(nowMinutes, nowIndex, step);
  const nowHourOffset = nowHourOffsetPercent(nowMinutes);

  // The tooltip owns its state, so hovering never renders the grid.
  const tooltipRef = useRef<TooltipController<TData> | null>(null);

  const [listOpen, setListOpen] = useState(false);
  const listRef = useRef<HTMLDetailsElement>(null);
  const pendingListFocus = useRef<string | null>(null);
  const [message, setMessage] = useState({ text: "", count: 0 });

  // Alternating a trailing no-break space makes a repeated message announce again.
  const announce = useCallback((text: string) => {
    setMessage((previous) => ({ text, count: previous.count + 1 }));
  }, []);

  const cellIsOpen = (resourceId: string, index: number) =>
    isCellOpen(openByResource.get(resourceId) ?? null, dayKey, index * step, (index + 1) * step);

  const segmentsAt = (resourceId: string, index: number) =>
    segmentsInCell(segmentsByResource.get(resourceId) ?? [], index * step, (index + 1) * step);

  // An event with a link opens it when it is the only one in the cell. With several, they are reached as links in the list.
  const openLinked = (resourceId: string, index: number): boolean => {
    const linked = segmentsAt(resourceId, index).filter((segment) => getEventHref?.(segment.event) != null);
    const [first] = linked;
    if (!first) {
      return false;
    }
    const href = getEventHref?.(first.event);
    if (linked.length === 1 && href != null) {
      window.open(href, "_blank", "noopener,noreferrer");
      return true;
    }
    pendingListFocus.current = `${resourceId}:${first.event.id}`;
    setListOpen(true);
    return true;
  };

  const handleActivate = (resourceId: string, index: number) => {
    if (openLinked(resourceId, index)) {
      return;
    }
    if (!onSelectSlot || !cellIsOpen(resourceId, index) || segmentsAt(resourceId, index).length > 0) {
      return;
    }
    const reason = onSelectSlot(resourceId, cellRange(dayKey, index, step));
    if (reason != null) {
      announce(reason);
    }
  };

  // The list is not focusable while closed, so focus moves once it has opened.
  useEffect(() => {
    const key = pendingListFocus.current;
    if (listOpen && key != null) {
      pendingListFocus.current = null;
      listRef.current?.querySelector<HTMLElement>(`[data-list-key="${CSS.escape(key)}"]`)?.focus();
    }
  });

  const grid = useResourceDayCalendar({
    resourceIds,
    firstIndex,
    endIndex,
    rowsPerHour: 60 / step,
    onActivate: handleActivate,
  });
  useImperativeHandle(ref, () => ({ focus: grid.focus }), [grid.focus]);

  // Start at the current hour, or the morning on other days, instead of at midnight.
  const scrollerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const hour = isToday ? Math.floor(minutesOfDay(toWallClock(new Date())) / 60) : MORNING_HOUR;
    const header = scroller?.querySelector<HTMLElement>(`[data-hour="${hour}"]`);
    if (scroller && header) {
      scroller.scrollLeft = Math.max(header.offsetLeft - 35, 0);
    }
    // Only a change of day should move the view, not every redraw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  const columns = useMemo(() => {
    const result: Column[] = [];
    for (let index = firstIndex; index < endIndex; index++) {
      result.push({ index, beginMinutes: index * step, endMinutes: (index + 1) * step });
    }
    return result;
  }, [firstIndex, endIndex, step]);
  const hourHeaders = useMemo(() => {
    const result: Array<{ hour: number; colSpan: number }> = [];
    for (let index = firstIndex; index < endIndex;) {
      const hour = Math.floor((index * step) / 60);
      const colSpan = Math.min(endIndex, ((hour + 1) * 60) / step) - index;
      result.push({ hour, colSpan });
      index += colSpan;
    }
    return result;
  }, [firstIndex, endIndex, step]);

  const listItems = useMemo(
    () =>
      resources.flatMap((resource) =>
        [...(segmentsByResource.get(resource.id) ?? [])]
          .sort((a, b) => a.beginMinutes - b.beginMinutes)
          .map((segment) => ({
            key: `${resource.id}:${segment.event.id}`,
            href: getEventHref?.(segment.event),
            text: `${resource.title}, ${formatRange(segment.beginMinutes, segment.endMinutes)}: ${getEventLabel(segment.event)}`,
          }))
      ),
    [resources, segmentsByResource, getEventHref, getEventLabel]
  );

  return (
    <ResourceDayRoot className={className} id={id}>
      <SkipLink href={`#${listId}`}>{labels.skipToList}</SkipLink>
      <GridScroller
        ref={scrollerRef}
        style={{ "--steps": columns.length } as CSSProperties}
        data-testid="resource-day-calendar__scroller"
      >
        <table
          role="grid"
          aria-readonly={onSelectSlot ? undefined : true}
          aria-busy={isLoading || undefined}
          aria-label={ariaLabel}
        >
          <colgroup>
            <col />
            {columns.map((column) => (
              <col key={column.index} />
            ))}
          </colgroup>
          <thead>
            <tr role="row">
              <td aria-hidden />
              {hourHeaders.map(({ hour, colSpan }) => (
                <th
                  key={hour}
                  role="columnheader"
                  scope="col"
                  colSpan={colSpan}
                  data-hour={hour}
                  aria-label={formatClock(hour * 60)}
                >
                  {hour}
                  {showNowLine && nowIndex >= hour * 2 && nowIndex < (hour + 1) * colSpan && (
                    <NowDot
                      aria-hidden
                      data-testid="resource-day-calendar__now-line"
                      style={{ left: `${nowHourOffset}%` }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <ResourceDayRow<TData>
                key={resource.id}
                resource={resource}
                segments={segmentsByResource.get(resource.id) ?? NO_SEGMENTS}
                open={openByResource.get(resource.id) ?? null}
                dayKey={dayKey}
                columns={columns}
                step={step}
                shownBegin={hours.beginMinutes}
                shownEnd={hours.endMinutes}
                activeIndex={grid.activeAddress?.column === resource.id ? grid.activeAddress.index : null}
                nowIndex={showNowLine ? nowIndex : null}
                nowOffsetPercent={showNowLine ? nowOffset : 0}
                labels={labels}
                getEventLabel={getEventLabel}
                getEventProps={getEventProps}
                getEventHref={getEventHref}
                tooltipRef={renderEventTooltip ? tooltipRef : undefined}
                registerCell={grid.registerCell}
                onCellFocus={grid.onCellFocus}
                onCellKeyDown={grid.onCellKeyDown}
                onCellClick={grid.onCellClick}
              />
            ))}
          </tbody>
        </table>
      </GridScroller>
      <ListAlternative
        id={listId}
        ref={listRef}
        tabIndex={-1}
        open={listOpen}
        onToggle={(event) => setListOpen(event.currentTarget.open)}
      >
        <summary>{labels.list}</summary>
        {listItems.length > 0 ? (
          <ul>
            {listItems.map((item) => (
              <li key={item.key}>
                {item.href != null ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" data-list-key={item.key}>
                    {item.text}, {labels.opensInNewTab}
                  </a>
                ) : (
                  item.text
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>{labels.emptyList}</p>
        )}
      </ListAlternative>
      {renderEventTooltip && <TooltipLayer controllerRef={tooltipRef} render={renderEventTooltip} />}
      <LiveRegion role="log" aria-atomic="true">
        {message.count % 2 === 0 ? message.text : `${message.text} `}
      </LiveRegion>
    </ResourceDayRoot>
  );
}

// forwardRef erases the generic. The cast restores it for call sites.
export const ResourceDayCalendar = forwardRef(ResourceDayTable) as <TData extends CalendarData>(
  props: ResourceDayCalendarProps<TData> & { ref?: Ref<ResourceDayHandle> }
) => ReactElement;
