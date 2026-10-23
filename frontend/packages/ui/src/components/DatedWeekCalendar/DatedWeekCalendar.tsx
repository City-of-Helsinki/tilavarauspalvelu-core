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
import type { CSSProperties, ForwardedRef, KeyboardEvent, PointerEvent, ReactElement, Ref } from "react";
import { HiddenText, LiveRegion, SkipLink } from "../CalendarGrid/styles";
import { MINUTES_PER_DAY, assertValidStep } from "../WeeklyPatternCalendar/engine";
import type { CalendarData } from "../WeeklyPatternCalendar/types";
import {
  cellRange,
  dayKeyOf,
  isCellOpen,
  minutesOfDay,
  nowHourOffsetPercent,
  nowOffsetPercent,
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
  ListAlternative,
  NowDot,
  NowLine,
  RangeTitle,
  ResizeHandle,
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
  // Mirrors `moving` so a pointerup handler, bound once per drag, can read the latest preview instead of a stale one.
  const movingRef = useRef<DatedRange | null>(null);
  const updateMoving = (next: DatedRange | null) => {
    movingRef.current = next;
    setMoving(next);
  };
  const shownEvents = useMemo(
    () =>
      moving && draftId != null ? events.map((item) => (item.id === draftId ? { ...item, ...moving } : item)) : events,
    [events, draftId, moving]
  );
  const segmentsByDay = useMemo(() => segmentEvents(shownEvents, days), [shownEvents, days]);
  const open = useMemo(() => openRangesByDay(openRanges, days), [openRanges, days]);

  // Ticks once every 5 minutes, so the current time line keeps up without redrawing the grid more than that.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 300_000);
    return () => clearInterval(id);
  }, []);
  const wallNow = toWallClock(now);
  const todayKey = dayKeyOf(wallNow);

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

  // Shown only while today is one of the visible days and the current time falls inside the visible hours.
  const nowMinutes = minutesOfDay(wallNow);
  const nowRowIndex = Math.floor(nowMinutes / step);
  const showNowLine = dayKeys.includes(todayKey) && nowRowIndex >= firstIndex && nowRowIndex < endIndex;

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
    if (!onSelectSlot || !cellIsOpen(dayKey, index) || segmentsAt(dayKey, index).length > 0) {
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
    updateMoving(next);
    announce(describeRange(next));
    pendingCellFocus.current = { dayKey, index: Math.floor(minutesOfDay(start) / step) };
  };

  // Set while a pointer drag is in progress. `base` is the range it started from, read back at pointerup to
  // tell a drag that actually moved something from a plain click, which leaves the draft grabbed rather than
  // committing a no-op. `durationMs` keeps a move the same length as the pointer crosses cells.
  const dragInfoRef = useRef<{ mode: "move" | "resize"; base: DatedRange; durationMs: number } | null>(null);
  const [dragMode, setDragMode] = useState<"move" | "resize" | null>(null);

  // The window listeners must be the same functions every render to be removable, but should still call the
  // latest commitDraft and updateMoving. Boxing the real logic in a ref gets both.
  const endDragRef = useRef<(commit: boolean) => void>(() => {});
  useLayoutEffect(() => {
    endDragRef.current = (commit) => {
      const info = dragInfoRef.current;
      dragInfoRef.current = null;
      setDragMode(null);
      if (!commit) {
        // A pointercancel, e.g. a touch turning into a scroll, snaps the draft straight back.
        updateMoving(null);
        return;
      }
      const result = movingRef.current;
      if (!info || !result) {
        return;
      }
      const unchanged =
        result.start.getTime() === info.base.start.getTime() && result.end.getTime() === info.base.end.getTime();
      // A press and release without crossing into another cell is a click, not a move: it leaves the draft grabbed.
      if (unchanged) {
        return;
      }
      if (commitDraft(result)) {
        updateMoving(null);
      }
    };
  });
  const stableFinishDrag = useRef(() => endDragRef.current(true)).current;
  const stableCancelDrag = useRef(() => endDragRef.current(false)).current;

  const removeDragListeners = useCallback(() => {
    window.removeEventListener("pointerup", stableFinishDrag);
    window.removeEventListener("pointercancel", stableCancelDrag);
  }, [stableFinishDrag, stableCancelDrag]);

  const cancelDrag = () => {
    removeDragListeners();
    dragInfoRef.current = null;
    setDragMode(null);
  };

  // In case the calendar unmounts mid-drag, e.g. the user navigates away with the pointer still down.
  useEffect(() => removeDragListeners, [removeDragListeners]);

  // Starts a mouse or touch drag of the draft: dragging its body moves it, dragging the handle at its foot
  // resizes it, always keeping its start, as the Shorter and Longer buttons do.
  const beginDrag = (mode: "move" | "resize") => (event: PointerEvent<HTMLSpanElement>) => {
    if (!canMove || !draftEvent) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const base = movingRef.current ?? { start: draftEvent.start, end: draftEvent.end };
    dragInfoRef.current = { mode, base, durationMs: base.end.getTime() - base.start.getTime() };
    setDragMode(mode);
    updateMoving(base);
    if (mode === "move") {
      announce(draftLabels?.grabbed ?? "");
    }
    window.addEventListener("pointerup", stableFinishDrag);
    window.addEventListener("pointercancel", stableCancelDrag);
  };

  // Follows the pointer as it crosses cells while a drag is active. Resizing never moves the start.
  const dragOverCell = (dayKey: string, index: number) => {
    const info = dragInfoRef.current;
    const base = movingRef.current;
    if (!info || !base) {
      return;
    }
    const cell = cellRange(dayKey, index, step);
    if (info.mode === "move") {
      updateMoving({ start: cell.start, end: new Date(cell.start.getTime() + info.durationMs) });
    } else {
      const shortest = shiftRange({ start: base.start, end: base.start }, { minutes: step }).start;
      updateMoving({ start: base.start, end: cell.end < shortest ? shortest : cell.end });
    }
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
        cancelDrag();
        updateMoving(null);
        announce(draftLabels?.cancelled ?? "");
        return true;
      case "Enter":
      case " ":
        event.preventDefault();
        if (commitDraft(moving)) {
          updateMoving(null);
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
      updateMoving({ start: draftEvent.start, end: draftEvent.end });
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
    <DatedWeekRoot className={className} id={id} data-dragging={dragMode ?? undefined}>
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
              cancelDrag();
              updateMoving(null);
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
                  <th
                    role="rowheader"
                    scope="row"
                    data-row={row.index}
                    rowSpan={row.rowSpan}
                    aria-label={formatClock(row.beginMinutes)}
                  >
                    {Math.floor(row.beginMinutes / 60)}
                    {showNowLine && nowRowIndex >= row.index && nowRowIndex < row.index + 2 && (
                      <NowDot
                        aria-hidden
                        data-testid="dated-week-calendar__now-dot"
                        style={{ top: `${nowHourOffsetPercent(nowMinutes)}%` }}
                      />
                    )}
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
                      onPointerEnter={() => dragOverCell(dayKey, row.index)}
                      aria-label={`${longDay.format(keyToDate(dayKey))}, ${formatRange(begin, end)}, ${state}`}
                      aria-disabled={isOpen ? undefined : true}
                      aria-describedby={isDraft ? hintId : undefined}
                      data-availability={isOpen ? "open" : "closed"}
                      data-hour-start={row.beginMinutes % 60 === 0 ? "" : undefined}
                      data-run-start={begin === row.beginMinutes ? "" : undefined}
                      data-run-end={end === row.endMinutes ? "" : undefined}
                    >
                      {segments.map((segment) => {
                        const extra = getEventProps?.(segment.event);
                        const startsHere = segment.beginMinutes >= row.beginMinutes;
                        const endsHere = segment.endMinutes <= row.endMinutes;
                        const isDraggableDraft = canMove && segment.event.id === draftId;
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
                            data-testid={isDraggableDraft ? "dated-week-calendar__draft" : undefined}
                            onPointerDown={isDraggableDraft ? beginDrag("move") : undefined}
                            // Stops the browser's native text-selection drag from fighting the move gesture.
                            onMouseDown={isDraggableDraft ? (event) => event.preventDefault() : undefined}
                          >
                            {startsHere ? segment.event.title : null}
                            {isDraggableDraft && endsHere && (
                              <ResizeHandle
                                data-testid="dated-week-calendar__resize-handle"
                                onPointerDown={beginDrag("resize")}
                                onMouseDown={(event) => event.preventDefault()}
                              />
                            )}
                          </EventStripe>
                        );
                      })}
                      {showNowLine && row.index === nowRowIndex && (
                        <NowLine
                          aria-hidden
                          data-testid="dated-week-calendar__now-line"
                          style={{ top: `${nowOffsetPercent(nowMinutes, nowRowIndex, step)}%` }}
                        />
                      )}
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
