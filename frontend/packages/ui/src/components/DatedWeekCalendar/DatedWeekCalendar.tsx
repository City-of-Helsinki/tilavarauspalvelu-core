"use client";

// A native <table role="grid"> is the APG pattern for a keyboard-navigable grid. See WeeklyPatternCalendar for why
// the row, cell and header roles are spelled out.
// oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role

import React, { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { CSSProperties, ForwardedRef, ReactElement, Ref } from "react";
import { assertValidStep } from "../WeeklyPatternCalendar/engine";
import type { CalendarData } from "../WeeklyPatternCalendar/types";
import {
  dayKeyOf,
  isCellOpen,
  openRangesByDay,
  resolveVisibleHours,
  segmentEvents,
  segmentsInCell,
  stepDate,
  toWallClock,
  visibleDays,
} from "./engine";
import {
  DatedWeekRoot,
  EventStripe,
  GridScroller,
  ListAlternative,
  RangeTitle,
  SkipLink,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
} from "./styles";
import type { DatedWeekCalendarProps, DatedWeekHandle } from "./types";
import { useDatedWeekCalendar } from "./useDatedWeekCalendar";

const pad = (value: number) => value.toString().padStart(2, "0");
const formatClock = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const formatRange = (beginMinutes: number, endMinutes: number) =>
  `${formatClock(beginMinutes)}–${formatClock(endMinutes)}`;

// A yyyy-MM-dd key as a UTC date, so formatting it with timeZone "UTC" never shifts the day.
const keyToDate = (dayKey: string) => new Date(`${dayKey}T00:00:00Z`);

function DatedWeekTable<TData extends CalendarData>(
  props: DatedWeekCalendarProps<TData>,
  ref: ForwardedRef<DatedWeekHandle>
): ReactElement {
  const {
    date,
    onNavigate,
    view,
    onViewChange,
    events,
    openRanges,
    step,
    visibleHours,
    locale,
    labels,
    getEventLabel,
    getEventProps,
    getEventHref,
    isLoading,
    toolbarExtra,
    className,
    id,
    "aria-label": ariaLabel,
  } = props;
  assertValidStep(step);
  if (60 % step !== 0) {
    throw new RangeError(`step must divide an hour; got ${step}`);
  }

  const listId = useId();
  const days = useMemo(() => visibleDays(date, view), [date, view]);
  const dayKeys = days.map((day) => dayKeyOf(day));
  const segmentsByDay = useMemo(() => segmentEvents(events, days), [events, days]);
  const open = useMemo(() => openRangesByDay(openRanges, days), [openRanges, days]);
  const todayKey = dayKeyOf(toWallClock(new Date()));

  const hours = resolveVisibleHours(visibleHours, open, [...segmentsByDay.values()].flat(), step);
  const firstIndex = hours.beginMinutes / step;
  const endIndex = hours.endMinutes / step;

  const [listOpen, setListOpen] = useState(false);
  const listRef = useRef<HTMLDetailsElement>(null);
  const pendingFocus = useRef<string | null>(null);

  // Enter on a cell opens its only linked event. With several, they are reached as links in the text list.
  const handleActivate = (dayKey: string, index: number) => {
    const segments = segmentsInCell(segmentsByDay.get(dayKey) ?? [], index * step, (index + 1) * step);
    const linked = segments.filter((segment) => getEventHref?.(segment.event) != null);
    const [first] = linked;
    if (!first) {
      return;
    }
    const href = getEventHref?.(first.event);
    if (linked.length === 1 && href != null) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    pendingFocus.current = `${first.event.id}:${dayKey}`;
    setListOpen(true);
  };

  // The list is not focusable while closed, so focus moves once it has opened.
  useEffect(() => {
    const key = pendingFocus.current;
    if (listOpen && key != null) {
      pendingFocus.current = null;
      listRef.current?.querySelector<HTMLElement>(`[data-list-key="${CSS.escape(key)}"]`)?.focus();
    }
  });

  const grid = useDatedWeekCalendar({
    dayKeys,
    firstIndex,
    endIndex,
    rowsPerHour: 60 / step,
    onActivate: handleActivate,
  });
  useImperativeHandle(ref, () => ({ focus: grid.focus }), [grid.focus]);

  const longDay = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
    [locale]
  );
  const shortDay = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" }),
    [locale]
  );
  const rangeTitle = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
    const first = keyToDate(dayKeys[0] ?? todayKey);
    const last = keyToDate(dayKeys.at(-1) ?? todayKey);
    return view === "day" ? formatter.format(first) : formatter.formatRange(first, last);
  }, [locale, dayKeys, view, todayKey]);

  const rows = [];
  for (let index = firstIndex; index < endIndex; index++) {
    const beginMinutes = index * step;
    const startsHour = index === firstIndex || beginMinutes % 60 === 0;
    const rowSpan = startsHour ? Math.min(endIndex, ((Math.floor(beginMinutes / 60) + 1) * 60) / step) - index : null;
    rows.push({ index, beginMinutes, endMinutes: beginMinutes + step, rowSpan });
  }

  const listItems = days.flatMap((day) =>
    [...(segmentsByDay.get(dayKeyOf(day)) ?? [])]
      .sort((a, b) => a.beginMinutes - b.beginMinutes)
      .map((segment) => ({
        key: `${segment.event.id}:${segment.dayKey}`,
        href: getEventHref?.(segment.event),
        text: `${longDay.format(keyToDate(segment.dayKey))}, ${formatRange(segment.beginMinutes, segment.endMinutes)}: ${getEventLabel(segment.event)}`,
      }))
  );

  return (
    <DatedWeekRoot className={className} id={id}>
      <SkipLink href={`#${listId}`}>{labels.skipToList}</SkipLink>
      <Toolbar role="toolbar" aria-label={labels.toolbar}>
        <ToolbarGroup>
          <ToolbarButton type="button" onClick={() => onNavigate(stepDate(date, view, -1))}>
            {labels.previous}
          </ToolbarButton>
          <ToolbarButton type="button" onClick={() => onNavigate(new Date())}>
            {labels.today}
          </ToolbarButton>
          <ToolbarButton type="button" onClick={() => onNavigate(stepDate(date, view, 1))}>
            {labels.next}
          </ToolbarButton>
        </ToolbarGroup>
        <RangeTitle role="status" aria-live="polite">
          {rangeTitle}
        </RangeTitle>
        <ToolbarGroup>
          <ToolbarButton type="button" aria-pressed={view === "day"} onClick={() => onViewChange("day")}>
            {labels.day}
          </ToolbarButton>
          <ToolbarButton type="button" aria-pressed={view === "week"} onClick={() => onViewChange("week")}>
            {labels.week}
          </ToolbarButton>
        </ToolbarGroup>
        {toolbarExtra}
      </Toolbar>
      <GridScroller style={{ "--days": days.length } as CSSProperties}>
        <table role="grid" aria-readonly="true" aria-busy={isLoading || undefined} aria-label={ariaLabel}>
          <colgroup>
            <col />
            {dayKeys.map((dayKey) => (
              <col key={dayKey} />
            ))}
          </colgroup>
          <thead>
            <tr role="row">
              <td aria-hidden />
              {days.map((day) => {
                const dayKey = dayKeyOf(day);
                return (
                  <th
                    key={dayKey}
                    role="columnheader"
                    scope="col"
                    aria-label={longDay.format(keyToDate(dayKey))}
                    aria-current={dayKey === todayKey ? "date" : undefined}
                  >
                    {shortDay.format(keyToDate(dayKey))}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.index} role="row">
                {row.rowSpan != null && (
                  <th role="rowheader" scope="row" rowSpan={row.rowSpan} aria-label={formatClock(row.beginMinutes)}>
                    {Math.floor(row.beginMinutes / 60)}
                  </th>
                )}
                {dayKeys.map((dayKey) => {
                  const segments = segmentsInCell(segmentsByDay.get(dayKey) ?? [], row.beginMinutes, row.endMinutes);
                  const isOpen = isCellOpen(open, dayKey, row.beginMinutes, row.endMinutes);
                  // A cell with one event that begins in it is named after the whole event, as a run is in the Weekly Pattern.
                  const only = segments.length === 1 ? segments[0] : undefined;
                  const [begin, end] =
                    only && only.beginMinutes >= row.beginMinutes
                      ? [only.beginMinutes, only.endMinutes]
                      : [row.beginMinutes, row.endMinutes];
                  const opensTab = only != null && getEventHref?.(only.event) != null;
                  const state =
                    segments.length > 0
                      ? segments.map((segment) => getEventLabel(segment.event)).join("; ") +
                        (opensTab ? `, ${labels.opensInNewTab}` : "")
                      : isOpen
                        ? labels.free
                        : labels.closed;
                  return (
                    <td
                      key={dayKey}
                      role="gridcell"
                      {...grid.cellBehaviour(dayKey, row.index)}
                      aria-label={`${longDay.format(keyToDate(dayKey))}, ${formatRange(begin, end)}, ${state}`}
                      aria-disabled={isOpen ? undefined : true}
                      data-availability={isOpen ? "open" : "closed"}
                      data-hour-start={row.beginMinutes % 60 === 0 ? "" : undefined}
                    >
                      {segments.map((segment) => {
                        const extra = getEventProps?.(segment.event);
                        const startsHere = segment.beginMinutes >= row.beginMinutes;
                        const endsHere = segment.endMinutes <= row.endMinutes;
                        return (
                          <EventStripe
                            key={segment.event.id}
                            aria-hidden
                            {...extra}
                            style={
                              { ...extra?.style, "--lane": segment.lane, "--lanes": segment.lanes } as CSSProperties
                            }
                            data-segment-start={startsHere ? "" : undefined}
                            data-segment-end={endsHere ? "" : undefined}
                          >
                            {startsHere ? segment.event.title : null}
                          </EventStripe>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
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
    </DatedWeekRoot>
  );
}

// forwardRef erases the generic. The cast restores it for call sites.
export const DatedWeekCalendar = forwardRef(DatedWeekTable) as <TData extends CalendarData>(
  props: DatedWeekCalendarProps<TData> & { ref?: Ref<DatedWeekHandle> }
) => ReactElement;
