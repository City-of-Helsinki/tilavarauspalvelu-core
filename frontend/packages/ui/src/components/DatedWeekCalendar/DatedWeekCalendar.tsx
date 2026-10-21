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
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ForwardedRef, KeyboardEvent, ReactElement, Ref } from "react";
import { MINUTES_PER_DAY, assertValidStep } from "../WeeklyPatternCalendar/engine";
import type { CalendarData } from "../WeeklyPatternCalendar/types";
import {
  cellRange,
  dayKeyOf,
  isCellOpen,
  minutesOfDay,
  openRangesByDay,
  resizeRange,
  resolveVisibleHours,
  segmentEvents,
  segmentsInCell,
  shiftRange,
  stepDate,
  toWallClock,
  visibleDays,
} from "./engine";
import {
  DatedWeekRoot,
  EventStripe,
  GridScroller,
  HiddenText,
  ListAlternative,
  LiveRegion,
  RangeTitle,
  SkipLink,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
} from "./styles";
import type { DatedRange, DatedWeekCalendarProps, DatedWeekHandle } from "./types";
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
    isOpen: isOpenProp,
    onSelectSlot,
    draftId,
    onMoveDraft,
    isLoading,
    alternative,
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
  const hintId = `${listId}-hint`;
  const days = useMemo(() => visibleDays(date, view), [date, view]);
  const dayKeys = days.map((day) => dayKeyOf(day));
  const draftEvent = draftId != null ? events.find((item) => item.id === draftId) : undefined;
  const canMove = draftEvent != null && onMoveDraft != null;
  const interactive = onSelectSlot != null || canMove;
  const draftLabels = labels.draft;

  // The draft is previewed at its new place while it is being moved. The consumer owns the saved value.
  const [moving, setMoving] = useState<DatedRange | null>(null);
  const shownEvents = useMemo(
    () =>
      moving && draftId != null ? events.map((item) => (item.id === draftId ? { ...item, ...moving } : item)) : events,
    [events, draftId, moving]
  );
  const segmentsByDay = useMemo(() => segmentEvents(shownEvents, days), [shownEvents, days]);
  const open = useMemo(() => openRangesByDay(openRanges, days), [openRanges, days]);
  const todayKey = dayKeyOf(toWallClock(new Date()));

  const longDay = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
    [locale]
  );
  const shortDay = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" }),
    [locale]
  );

  const hours = resolveVisibleHours(visibleHours, open, [...segmentsByDay.values()].flat(), step);
  const firstIndex = hours.beginMinutes / step;
  const endIndex = hours.endMinutes / step;

  const [listOpen, setListOpen] = useState(false);
  const listRef = useRef<HTMLDetailsElement>(null);
  const pendingListFocus = useRef<string | null>(null);
  const pendingCellFocus = useRef<{ dayKey: string; index: number } | null>(null);
  const [message, setMessage] = useState({ text: "", count: 0 });

  // Alternating a trailing no-break space makes a repeated message announce again.
  const announce = useCallback((text: string) => {
    setMessage((previous) => ({ text, count: previous.count + 1 }));
  }, []);

  const describeRange = (range: DatedRange) => {
    const start = toWallClock(range.start);
    const end = toWallClock(range.end);
    const endMinutes = dayKeyOf(end) === dayKeyOf(start) ? minutesOfDay(end) : MINUTES_PER_DAY;
    return `${longDay.format(keyToDate(dayKeyOf(start)))}, ${formatRange(minutesOfDay(start), endMinutes)}`;
  };

  const openCells = useMemo(() => {
    if (!isOpenProp) {
      return null;
    }
    const cells = new Map<string, boolean>();
    for (const dayKey of dayKeys) {
      for (let index = firstIndex; index < endIndex; index++) {
        cells.set(`${dayKey}:${index}`, isOpenProp(cellRange(dayKey, index, step)));
      }
    }
    return cells;
    // dayKeys is a new array on every render, its content is what matters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpenProp, dayKeys.join(","), firstIndex, endIndex, step]);

  const cellIsOpen = (dayKey: string, index: number) =>
    openCells
      ? (openCells.get(`${dayKey}:${index}`) ?? false)
      : isCellOpen(open, dayKey, index * step, (index + 1) * step);

  const segmentsAt = (dayKey: string, index: number) =>
    segmentsInCell(segmentsByDay.get(dayKey) ?? [], index * step, (index + 1) * step);

  // An event with a link opens it when it is the only one in the cell. With several, they are reached as links in the list.
  const openLinked = (dayKey: string, index: number): boolean => {
    const linked = segmentsAt(dayKey, index).filter((segment) => getEventHref?.(segment.event) != null);
    const [first] = linked;
    if (!first) {
      return false;
    }
    const href = getEventHref?.(first.event);
    if (linked.length === 1 && href != null) {
      window.open(href, "_blank", "noopener,noreferrer");
      return true;
    }
    pendingListFocus.current = `${first.event.id}:${dayKey}`;
    setListOpen(true);
    return true;
  };

  const selectSlot = (dayKey: string, index: number) => {
    if (!onSelectSlot || !cellIsOpen(dayKey, index)) {
      return;
    }
    const range = cellRange(dayKey, index, step);
    const reason = onSelectSlot(range);
    announce(reason ?? `${draftLabels?.slotSelected ?? ""}: ${describeRange(range)}`);
  };

  // Asks the consumer to accept a new time for the draft. A reason to refuse is announced.
  const commitDraft = (range: DatedRange): boolean => {
    const reason = onMoveDraft?.(range) ?? null;
    announce(reason ?? `${draftLabels?.moved ?? ""}: ${describeRange(range)}`);
    return reason == null;
  };

  const previewDraft = (next: DatedRange) => {
    const start = toWallClock(next.start);
    const dayKey = dayKeyOf(start);
    // A move stays inside the shown days. Use the toolbar to change the week first.
    if (!dayKeys.includes(dayKey)) {
      return;
    }
    setMoving(next);
    announce(describeRange(next));
    pendingCellFocus.current = { dayKey, index: Math.floor(minutesOfDay(start) / step) };
  };

  // Keyboard move mode, as in ADR 0003. The arrows move, Shift and the arrows resize, Enter confirms, Escape cancels.
  const handleMoveKey = (event: KeyboardEvent<HTMLTableCellElement>): boolean => {
    if (!moving || event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }
    const sign = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setMoving(null);
        announce(draftLabels?.cancelled ?? "");
        return true;
      case "Enter":
      case " ":
        event.preventDefault();
        if (commitDraft(moving)) {
          setMoving(null);
        }
        return true;
      case "ArrowUp":
      case "ArrowDown":
        event.preventDefault();
        previewDraft(
          event.shiftKey ? resizeRange(moving, sign * step, step) : shiftRange(moving, { minutes: sign * step })
        );
        return true;
      case "ArrowLeft":
      case "ArrowRight":
        event.preventDefault();
        if (!event.shiftKey) {
          previewDraft(shiftRange(moving, { days: sign }));
        }
        return true;
      default:
        return false;
    }
  };

  const handleActivate = (dayKey: string, index: number) => {
    if (canMove && draftEvent && segmentsAt(dayKey, index).some((segment) => segment.event.id === draftId)) {
      setMoving({ start: draftEvent.start, end: draftEvent.end });
      announce(draftLabels?.grabbed ?? "");
      return;
    }
    if (!openLinked(dayKey, index)) {
      selectSlot(dayKey, index);
    }
  };

  const handleCellClick = (dayKey: string, index: number) => {
    if (!openLinked(dayKey, index)) {
      selectSlot(dayKey, index);
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

  const grid = useDatedWeekCalendar({
    dayKeys,
    firstIndex,
    endIndex,
    rowsPerHour: 60 / step,
    onActivate: handleActivate,
    onCellClick: handleCellClick,
    onKeyOverride: handleMoveKey,
  });

  // The grid shows the preview on the next render, so the cell can only be focused after it.
  useEffect(() => {
    const target = pendingCellFocus.current;
    if (target) {
      pendingCellFocus.current = null;
      grid.focusCell(target);
    }
  });
  useImperativeHandle(ref, () => ({ focus: grid.focus }), [grid.focus]);

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
      {alternative && <SkipLink href={`#${alternative.id}`}>{alternative.label}</SkipLink>}
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
      {canMove && draftLabels && draftEvent && (
        <ToolbarGroup role="group" aria-label={draftLabels.controls}>
          <ToolbarButton type="button" onClick={() => commitDraft(shiftRange(draftEvent, { minutes: -step }))}>
            {draftLabels.earlier}
          </ToolbarButton>
          <ToolbarButton type="button" onClick={() => commitDraft(shiftRange(draftEvent, { minutes: step }))}>
            {draftLabels.later}
          </ToolbarButton>
          <ToolbarButton type="button" onClick={() => commitDraft(resizeRange(draftEvent, -step, step))}>
            {draftLabels.shorter}
          </ToolbarButton>
          <ToolbarButton type="button" onClick={() => commitDraft(resizeRange(draftEvent, step, step))}>
            {draftLabels.longer}
          </ToolbarButton>
        </ToolbarGroup>
      )}
      <GridScroller style={{ "--days": days.length } as CSSProperties}>
        <table
          role="grid"
          aria-readonly={interactive ? undefined : true}
          aria-busy={isLoading || undefined}
          aria-label={ariaLabel}
          onBlur={(event) => {
            // Moving between cells also blurs the old one. Only leaving the grid cancels a move.
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setMoving(null);
            }
          }}
        >
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
                  const isOpen = cellIsOpen(dayKey, row.index);
                  const isDraft = canMove && segments.some((segment) => segment.event.id === draftId);
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
                      aria-describedby={isDraft ? hintId : undefined}
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
                            data-draft={segment.event.id === draftId ? "" : undefined}
                            data-moving={moving && segment.event.id === draftId ? "" : undefined}
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
      {canMove && <HiddenText id={hintId}>{draftLabels?.hint}</HiddenText>}
      <LiveRegion role="log" aria-atomic="true">
        {message.count % 2 === 0 ? message.text : `${message.text} `}
      </LiveRegion>
    </DatedWeekRoot>
  );
}

// forwardRef erases the generic. The cast restores it for call sites.
export const DatedWeekCalendar = forwardRef(DatedWeekTable) as <TData extends CalendarData>(
  props: DatedWeekCalendarProps<TData> & { ref?: Ref<DatedWeekHandle> }
) => ReactElement;
