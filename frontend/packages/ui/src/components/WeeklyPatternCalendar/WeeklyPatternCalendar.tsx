"use client";

// A native <table role="grid"> is the APG pattern for a keyboard-navigable grid. The row, cell and header
// roles are spelled out even though the table elements imply them, because not every assistive technology
// (or test tool) derives them from a table that has been given the grid role.
// oxlint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { ForwardedRef, ReactElement, Ref } from "react";
import { useTranslation } from "next-i18next/pages";
import type { TFunction } from "i18next";
import { WEEKDAYS_SORTED } from "@ui/modules/const";
import { formatTimeRange, minutesToHoursString } from "@ui/modules/date-utils";
import { formatClock, formatClockRange } from "@ui/modules/time-helpers";
import type { Weekday } from "../../../gql/gql-types";
import { HiddenText, LiveRegion, SkipLink } from "../CalendarGrid/styles";
import { RunErrorTooltip } from "./RunErrorTooltip";
import { WeeklyPatternRoot, WeeklyPatternScroller, WeeklyPatternStickyHeader } from "./styles";
import type {
  CalendarData,
  CellAvailability,
  WeeklyPatternCalendarProps,
  WeeklyPatternCellInfo,
  WeeklyPatternHandle,
} from "./types";
import { useWeeklyPatternCalendar } from "./useWeeklyPatternCalendar";

const NOOP = () => {};
const NO_ANNOUNCEMENTS = { painted: "", erased: "" };

// How long the tooltip stays after the pointer leaves its run, so the pointer can move onto it (WCAG 1.4.13).
const TOOLTIP_HIDE_DELAY_MS = 200;

type CellPosition = { weekday: Weekday; index: number };

function cellFromTarget(target: EventTarget | null): CellPosition | null {
  const cell = target instanceof Element ? target.closest<HTMLElement>("td[data-weekday]") : null;
  return cell ? { weekday: cell.dataset.weekday as Weekday, index: Number(cell.dataset.index) } : null;
}

const runCellSelector = (weekday: Weekday, beginMinutes: number) =>
  `td[data-weekday="${weekday}"][data-begin-minutes="${beginMinutes}"]`;

// Keeps the previous object when the cell is the same, so React skips the re-render.
const keepIfSame = (next: CellPosition | null) => (previous: CellPosition | null) =>
  previous?.weekday === next?.weekday && previous?.index === next?.index ? previous : next;

function weekdayNames(style: "long" | "short", t: TFunction): Record<Weekday, string> {
  return Object.fromEntries(
    WEEKDAYS_SORTED.map((weekday) => [
      weekday,
      t(`common:weekday${style === "long" ? "Long" : "Short"}Enum.${weekday}`),
    ])
  ) as Record<Weekday, string>;
}

function WeeklyPatternTable<TData extends CalendarData>(
  props: WeeklyPatternCalendarProps<TData>,
  ref: ForwardedRef<WeeklyPatternHandle>
): ReactElement {
  const { t } = useTranslation("application");
  const {
    value,
    onChange = NOOP,
    onBlur,
    name,
    disabled,
    readOnly,
    announcements = NO_ANNOUNCEMENTS,
    step,
    availability,
    paintable,
    visibleHours,
    brush,
    isDataEqual,
    isValidSelection,
    getStateLabel,
    getCellAppearance,
    getCellProps,
    getRunError,
    alternative,
    className,
    style,
    ...tableAttributes
  } = props;

  const longNames = useMemo(() => weekdayNames("long", t), [t]);

  const grid = useWeeklyPatternCalendar({
    value,
    onChange,
    onBlur,
    step,
    availability,
    paintable,
    visibleHours,
    brush,
    isDataEqual,
    isValidSelection,
    readOnly,
    disabled,
    announcements,
    describeSpan: (weekday, beginMinutes, endMinutes) =>
      `${longNames[weekday]}, ${formatClockRange(beginMinutes, endMinutes)}`,
  });

  useImperativeHandle(ref, () => ({ focus: grid.focus }), [grid.focus]);

  // The sticky header copy lives outside the scroll area, so it follows the grid's horizontal scroll by hand.
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const syncStickyHeader = (event: React.UIEvent<HTMLDivElement>) => {
    if (stickyHeaderRef.current) {
      stickyHeaderRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  const columns = (
    <colgroup>
      <col />
      {grid.days.map((weekday) => (
        <col key={weekday} />
      ))}
    </colgroup>
  );

  // The time being painted isn't validated until the paint ends, so a run on its way to a valid length isn't flagged
  // at its first cell. Every other run, also on the same day, keeps its error.
  const runErrorOf = (cell: WeeklyPatternCellInfo<TData>) =>
    cell.selected && !grid.isPaintPending(cell.weekday, cell.beginMinutes / step)
      ? (getRunError?.(cell, grid.dayRuns(cell.weekday)) ?? null)
      : null;

  // The run error tooltip follows the hovered cell, or else the cell focused from the keyboard. Only the cell position is
  // kept in state, and the run is looked up again on render, so the tooltip follows the run as it is painted longer or
  // shorter.
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<CellPosition | null>(null);
  const [focused, setFocused] = useState<CellPosition | null>(null);
  // A click focuses the cell too (the grid keeps one cell focusable). That focus must not open the tooltip, or it would
  // show once the pointer leaves the calendar. Only keyboard use does, like :focus-visible, which jsdom can't tell.
  const isPointerFocus = useRef(false);
  const [dismissedRun, setDismissedRun] = useState<string | null>(null);
  // Leaving a run whose tooltip is shown moves `hovered` on only after a delay, so the pointer can cross the cells
  // between the run and the tooltip. The delay starts when the pointer leaves the run and isn't restarted by the cells
  // it crosses: only the cell it ends on is kept, in `pendingHover`.
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingHover = useRef<CellPosition | null>(null);
  const cancelHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = undefined;
  }, []);
  const hoverAfterDelay = useCallback((next: CellPosition | null) => {
    pendingHover.current = next;
    hideTimer.current ??= setTimeout(() => {
      hideTimer.current = undefined;
      setHovered(keepIfSame(pendingHover.current));
    }, TOOLTIP_HIDE_DELAY_MS);
  }, []);
  const hideHover = useCallback(() => {
    cancelHide();
    setHovered(null);
  }, [cancelHide]);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const runKeyOf = (info: WeeklyPatternCellInfo<TData>) => `${info.weekday}:${info.runBeginMinutes}`;
  const invalidRunAt = (position: CellPosition | null) => {
    const info = position ? grid.cellInfo(position.weekday, position.index) : null;
    return info && runErrorOf(info) ? runKeyOf(info) : null;
  };

  const activeCell = hovered ?? focused;
  const activeInfo = activeCell ? grid.cellInfo(activeCell.weekday, activeCell.index) : null;
  const activeError = activeInfo ? runErrorOf(activeInfo) : null;
  const activeRun = activeInfo && activeError ? runKeyOf(activeInfo) : null;
  const dismissTooltip = useCallback(() => setDismissedRun(activeRun), [activeRun]);
  // Escape hides the tooltip of that run only. Another run, or coming back later, shows it again.
  // Reset while rendering when the run changes (React's "adjusting state on a prop change" pattern), not in an effect.
  const [previousActiveRun, setPreviousActiveRun] = useState(activeRun);
  if (activeRun !== previousActiveRun) {
    setPreviousActiveRun(activeRun);
    setDismissedRun(null);
  }

  // A closed cell can still be painted when `paintable` reaches it. An unavailable cell never can.
  const isDisabledCell = (availability: CellAvailability) =>
    availability === "unavailable" || (availability === "closed" && !paintable);

  // The first cell of a run names the whole run. The cells after it name only themselves.
  const getCellLabel = (cell: WeeklyPatternCellInfo<TData>) => {
    const [begin, end] = cell.isRunStart
      ? [cell.runBeginMinutes, cell.runEndMinutes]
      : [cell.beginMinutes, cell.endMinutes];
    const label = `${longNames[cell.weekday]}, ${formatClockRange(begin, end)}, ${getStateLabel(cell)}`;
    const error = runErrorOf(cell);
    return error ? `${label}, ${error}` : label;
  };

  // A run's first cell shows where it starts, its last where it ends, the rest a connector.
  // A run of two cells or fewer shows the whole range once, on its last cell.
  const getCellContent = (cell: WeeklyPatternCellInfo<TData>): React.ReactNode => {
    if (!cell.selected) {
      return minutesToHoursString(cell.beginMinutes, true);
    }
    // The visible label of a run. A real element rather than generated content, so the end time can be styled on its
    // own (e.g. red when the run is too short). Hidden from assistive technology: the cell's aria-label says it all.
    if (cell.isRunStart && cell.data && getCellAppearance?.(cell.data)) {
      return (
        <span data-run-time aria-hidden>
          {minutesToHoursString(cell.runBeginMinutes, true)}–
          <span data-run-end-time>{minutesToHoursString(cell.runEndMinutes, true)}</span>
        </span>
      );
    }
    if (cell.runEndMinutes - cell.runBeginMinutes <= 2 * step) {
      return cell.isRunEnd ? formatTimeRange(cell.runBeginMinutes, cell.runEndMinutes) : null;
    }
    if (cell.isRunStart) {
      return minutesToHoursString(cell.beginMinutes, true);
    }
    return "|";
  };

  return (
    <>
      <SkipLink href={`#${alternative.id}`}>{alternative.label}</SkipLink>
      <WeeklyPatternRoot ref={rootRef} className={className} style={style}>
        {/* A visual copy of the weekday header that stays at the top of the page. See WeeklyPatternStickyHeader. */}
        <WeeklyPatternStickyHeader ref={stickyHeaderRef} aria-hidden="true" data-testid="weekly-pattern__sticky-header">
          <table role="presentation">
            {columns}
            <thead>
              <tr>
                <td aria-hidden />
                {grid.days.map((weekday) => (
                  <th key={weekday} role="presentation">
                    {longNames[weekday]}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </WeeklyPatternStickyHeader>
        <WeeklyPatternScroller onScroll={syncStickyHeader}>
          <table
            {...tableAttributes}
            {...grid.tableHandlers}
            onPointerOver={(event) => {
              // Touch has no hover, and a held button means a paint gesture, which the tooltip would only cover.
              const isHover = event.pointerType !== "touch" && event.buttons === 0;
              const next = isHover ? cellFromTarget(event.target) : null;
              const isTooltipShown = hovered != null && activeRun != null && activeRun !== dismissedRun;
              if (isHover && isTooltipShown && invalidRunAt(next) !== activeRun) {
                hoverAfterDelay(next);
                return;
              }
              cancelHide();
              setHovered(keepIfSame(next));
            }}
            onPointerLeave={() => hoverAfterDelay(null)}
            // Capture, so these run before the cells' own handlers (which may move focus) and leave theirs in place.
            onPointerDownCapture={() => {
              isPointerFocus.current = true;
              setFocused(null);
            }}
            onKeyDownCapture={(event) => {
              isPointerFocus.current = false;
              // Escape dismisses the tooltip, and must not bring up the focused cell's in place of the hovered one's.
              if (event.key !== "Escape") {
                setFocused(keepIfSame(cellFromTarget(event.target)));
              }
            }}
            onFocus={(event) => setFocused(isPointerFocus.current ? null : keepIfSame(cellFromTarget(event.target)))}
            onBlur={(event) => {
              grid.tableHandlers.onBlur(event);
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setFocused(null);
                // Coming back, e.g. with Tab, is keyboard focus again.
                isPointerFocus.current = false;
              }
            }}
            role="grid"
            aria-multiselectable="true"
            aria-readonly={readOnly || undefined}
            aria-disabled={disabled || undefined}
            data-name={name}
            data-readonly={readOnly ? "" : undefined}
            data-disabled={disabled ? "" : undefined}
          >
            {columns}
            <thead>
              <tr role="row">
                {/* The corner above the time labels is not a column header, so it is a plain td. */}
                <td aria-hidden />
                {grid.days.map((weekday) => (
                  <th key={weekday} role="columnheader" scope="col">
                    <HiddenText>{longNames[weekday]}</HiddenText>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.rows.map((row) => (
                <tr key={row.index} role="row">
                  {row.headerRowSpan != null && (
                    <th
                      role="rowheader"
                      scope="row"
                      rowSpan={row.headerRowSpan}
                      aria-label={formatClock(row.beginMinutes)}
                    >
                      {Math.floor(row.beginMinutes / 60)}
                    </th>
                  )}
                  {grid.days.map((weekday) => {
                    const cell = grid.cellInfo(weekday, row.index);
                    const appearance = cell.data ? getCellAppearance?.(cell.data) : undefined;
                    return (
                      <td
                        key={weekday}
                        role="gridcell"
                        {...getCellProps?.(cell)}
                        {...grid.cellBehaviour(weekday, row.index)}
                        aria-label={getCellLabel(cell)}
                        aria-selected={cell.selected}
                        aria-disabled={isDisabledCell(cell.availability) ? true : undefined}
                        data-weekday={weekday}
                        data-index={row.index}
                        data-begin-minutes={cell.beginMinutes}
                        data-availability={cell.availability}
                        data-appearance={appearance}
                        data-selected={cell.selected ? "" : undefined}
                        data-hour-start={cell.beginMinutes % 60 === 0 ? "" : undefined}
                        data-time-start={formatClock(cell.beginMinutes)}
                        data-time-end={formatClock(cell.endMinutes)}
                        data-runtime-start={minutesToHoursString(cell.runBeginMinutes, true)}
                        data-runtime-end={minutesToHoursString(cell.runEndMinutes, true)}
                        data-run-start={cell.isRunStart ? "" : undefined}
                        data-run-end={cell.isRunEnd ? "" : undefined}
                        data-block-start={cell.isBlockStart ? "" : undefined}
                        data-block-end={cell.isBlockEnd ? "" : undefined}
                        data-invalid={runErrorOf(cell) ? "" : undefined}
                      >
                        {getCellContent(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </WeeklyPatternScroller>
        <LiveRegion role="status" aria-live="polite" aria-atomic="true">
          {grid.liveMessage}
        </LiveRegion>
        {activeInfo && activeError && activeRun !== dismissedRun && (
          <RunErrorTooltip
            root={rootRef}
            startSelector={runCellSelector(activeInfo.weekday, activeInfo.runBeginMinutes)}
            endSelector={runCellSelector(activeInfo.weekday, activeInfo.runEndMinutes - step)}
            activeSelector={runCellSelector(activeInfo.weekday, activeInfo.beginMinutes)}
            text={activeError}
            onDismiss={dismissTooltip}
            onPointerEnter={cancelHide}
            onPointerLeave={hideHover}
          />
        )}
      </WeeklyPatternRoot>
    </>
  );
}

// forwardRef erases the generic. The cast restores it for call sites.
export const WeeklyPatternCalendar = forwardRef(WeeklyPatternTable) as <TData extends CalendarData>(
  props: WeeklyPatternCalendarProps<TData> & { ref?: Ref<WeeklyPatternHandle> }
) => ReactElement;
