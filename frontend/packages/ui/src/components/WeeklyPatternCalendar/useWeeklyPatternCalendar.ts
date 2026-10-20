"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { WEEKDAYS_SORTED } from "@ui/modules/const";
import { Weekday } from "../../../gql/gql-types";
import {
  assertValidStep,
  groupAvailability,
  gridToPattern,
  isEditableFor,
  isRangeOpen,
  paintModeFor,
  paintRange,
  patternToGrid,
  resolveVisibleHours,
  shallowEqual,
} from "./engine";
import type { CellGrid, PaintMode } from "./engine";
import type {
  CalendarData,
  WeeklyPatternAnnouncements,
  WeeklyPatternCalendarProps,
  WeeklyPatternCellInfo,
  WeeklyPatternValue,
} from "./types";

export type WeeklyPatternOptions<TData extends CalendarData> = Pick<
  WeeklyPatternCalendarProps<TData>,
  | "value"
  | "onBlur"
  | "step"
  | "availability"
  | "visibleHours"
  | "brush"
  | "isDataEqual"
  | "isValidSelection"
  | "disabled"
> & {
  onChange: (value: WeeklyPatternValue<TData>) => void;
  readOnly?: boolean;
  announcements: WeeklyPatternAnnouncements;
  /** Spoken description of a span, e.g. "Monday, 10:00-11:00". */
  describeSpan: (weekday: Weekday, beginMinutes: number, endMinutes: number) => string;
};

type CellAddress = { weekday: Weekday; index: number };
// A pointer drag: the cell it started on, the cell the pointer is over now, and whether it paints or erases.
type Gesture<TData> = { weekday: Weekday; anchor: number; current: number; mode: PaintMode<TData> };
// A Shift+Arrow keyboard sweep on one weekday. The mode is fixed when the sweep starts.
type Sweep<TData> = { weekday: Weekday; anchor: number; mode: PaintMode<TData> };

export type GridRow = {
  index: number;
  beginMinutes: number;
  endMinutes: number;
  /** Set on the rows that start an hour (or every row when the step is an hour or more). */
  headerRowSpan: number | null;
};

const addressKey = (weekday: Weekday, index: number) => `${weekday}:${index}`;

export function useWeeklyPatternCalendar<TData extends CalendarData>({
  value,
  onChange,
  onBlur,
  step,
  availability,
  visibleHours,
  brush,
  isDataEqual = shallowEqual,
  isValidSelection,
  readOnly = false,
  disabled = false,
  announcements,
  describeSpan,
}: WeeklyPatternOptions<TData>) {
  assertValidStep(step);

  const days = WEEKDAYS_SORTED;
  const rangesByDay = groupAvailability(availability);
  const hours = resolveVisibleHours(visibleHours, rangesByDay, value, step);
  const firstIndex = hours ? hours.beginMinutes / step : 0;
  const endIndex = hours ? hours.endMinutes / step : 0;
  const rowsPerHour = Math.max(1, 60 / step);
  const baseGrid = patternToGrid(value, step);

  const isOpen = (weekday: Weekday, index: number) =>
    isRangeOpen(rangesByDay[weekday], index * step, (index + 1) * step);

  const [gesture, setGesture] = useState<Gesture<TData> | null>(null);
  const [active, setActive] = useState<CellAddress | null>(null);
  const [message, setMessage] = useState({ text: "", count: 0 });
  const gestureRef = useRef<Gesture<TData> | null>(null);
  const sweepRef = useRef<Sweep<TData> | null>(null);
  const pointerTypeRef = useRef("mouse");
  const cellElements = useRef(new Map<string, HTMLTableCellElement>());

  // Live-region text. Alternating a trailing no-break space makes a repeated message announce again.
  const announce = useCallback((text: string) => {
    setMessage((previous) => ({ text, count: previous.count + 1 }));
  }, []);

  // While dragging, preview the gesture without committing it to `value`.
  const grid: CellGrid<TData> = gesture
    ? paintRange(
        baseGrid,
        gesture.weekday,
        gesture.anchor,
        gesture.current,
        gesture.mode,
        isEditableFor(gesture.mode, (index) => isOpen(gesture.weekday, index)),
        isDataEqual
      )
    : baseGrid;

  const defaultActive = (): CellAddress | null => {
    for (let index = firstIndex; index < endIndex; index++) {
      for (const weekday of days) {
        if (isOpen(weekday, index)) {
          return { weekday, index };
        }
      }
    }
    return hours ? { weekday: days[0] ?? Weekday.Monday, index: firstIndex } : null;
  };
  const activeAddress = active && active.index >= firstIndex && active.index < endIndex ? active : defaultActive();

  // The window pointer listeners and the imperative `focus()` are set up once, so they read the
  // latest props through this ref. Written in an effect because React Compiler forbids ref writes in render.
  const latest = useRef({
    baseGrid,
    onChange,
    step,
    isDataEqual,
    isOpen,
    isValidSelection,
    announcements,
    describeSpan,
    activeAddress,
  });
  useEffect(() => {
    latest.current = {
      baseGrid,
      onChange,
      step,
      isDataEqual,
      isOpen,
      isValidSelection,
      announcements,
      describeSpan,
      activeAddress,
    };
  });

  const interactive = !readOnly && !disabled;

  const modeAt = (weekday: Weekday, index: number): PaintMode<TData> | null =>
    interactive ? paintModeFor(baseGrid[weekday]?.[index], brush, isOpen(weekday, index), isDataEqual) : null;

  // The single path through which every gesture changes `value`. `spanFrom` is where the whole
  // gesture began, so validation and the announcement describe the entire span, not just the last step.
  const commit = useCallback(
    (weekday: Weekday, from: number, to: number, mode: PaintMode<TData>, spanFrom: number = from) => {
      const current = latest.current;
      const next = paintRange(
        current.baseGrid,
        weekday,
        from,
        to,
        mode,
        isEditableFor(mode, (index) => current.isOpen(weekday, index)),
        current.isDataEqual
      );
      if (next === current.baseGrid) {
        return;
      }
      const beginMinutes = Math.min(spanFrom, from, to) * current.step;
      const endMinutes = (Math.max(spanFrom, from, to) + 1) * current.step;
      if (mode.kind === "paint" && current.isValidSelection) {
        const reason = current.isValidSelection({ weekday, beginMinutes, endMinutes, data: mode.data });
        if (reason) {
          announce(reason);
          return;
        }
      }
      current.onChange(gridToPattern(next, current.step, current.isDataEqual));
      const verb = mode.kind === "paint" ? current.announcements.painted : current.announcements.erased;
      announce(`${verb}: ${current.describeSpan(weekday, beginMinutes, endMinutes)}`);
    },
    [announce]
  );

  const focusCell = (address: CellAddress) => {
    cellElements.current.get(addressKey(address.weekday, address.index))?.focus();
  };

  // Exposed through the ref handle so react-hook-form's field.ref can focus the grid.
  const focus = useCallback(() => {
    const address = latest.current.activeAddress;
    if (address) {
      cellElements.current.get(addressKey(address.weekday, address.index))?.focus();
    }
  }, []);

  const endGesture = useCallback(
    (shouldCommit: boolean) => {
      const finished = gestureRef.current;
      if (!finished) {
        return;
      }
      gestureRef.current = null;
      setGesture(null);
      if (shouldCommit) {
        commit(finished.weekday, finished.anchor, finished.current, finished.mode);
      }
    },
    [commit]
  );

  // A drag can end outside the table, so the listeners live on the window while a gesture is active.
  const gestureActive = gesture != null;
  useEffect(() => {
    if (!gestureActive) {
      return;
    }
    const finish = () => endGesture(true);
    const cancel = () => endGesture(false);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [gestureActive, endGesture]);

  const startGesture = (weekday: Weekday, index: number) => {
    const mode = modeAt(weekday, index);
    if (!mode) {
      return;
    }
    const started: Gesture<TData> = { weekday, anchor: index, current: index, mode };
    gestureRef.current = started;
    setGesture(started);
  };

  // Dragging across weekdays is intentionally unsupported: a gesture paints a single-day range.
  const extendGesture = (weekday: Weekday, index: number) => {
    const running = gestureRef.current;
    if (!running || running.weekday !== weekday || running.current === index) {
      return;
    }
    const extended = { ...running, current: index };
    gestureRef.current = extended;
    setGesture(extended);
  };

  const toggleCell = (weekday: Weekday, index: number) => {
    const mode = modeAt(weekday, index);
    if (mode) {
      commit(weekday, index, index, mode);
    }
  };

  // Keyboard equivalent of a drag. The mode is decided once per sweep so it doesn't flip
  // when later cells are in a different state.
  const sweep = (weekday: Weekday, from: number, to: number) => {
    let running = sweepRef.current;
    if (!running || running.weekday !== weekday) {
      const anchor = modeAt(weekday, from) ? from : to;
      const mode = modeAt(weekday, anchor);
      if (!mode) {
        return;
      }
      running = { weekday, anchor, mode };
      sweepRef.current = running;
    }
    commit(weekday, from, to, running.mode, running.anchor);
  };

  const clampRow = (row: number) => Math.min(Math.max(row, firstIndex), endIndex - 1);

  const handleKeyDown = (event: KeyboardEvent<HTMLTableCellElement>, weekday: Weekday, index: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const dayPosition = days.indexOf(weekday);
    const sideways = (offset: number) => days[Math.min(Math.max(dayPosition + offset, 0), days.length - 1)] ?? weekday;

    let target: CellAddress;
    switch (event.key) {
      case "ArrowDown":
        target = { weekday, index: clampRow(index + 1) };
        break;
      case "ArrowUp":
        target = { weekday, index: clampRow(index - 1) };
        break;
      case "ArrowRight":
        target = { weekday: sideways(1), index };
        break;
      case "ArrowLeft":
        target = { weekday: sideways(-1), index };
        break;
      case "PageDown":
        target = { weekday, index: clampRow(index + rowsPerHour) };
        break;
      case "PageUp":
        target = { weekday, index: clampRow(index - rowsPerHour) };
        break;
      case "Home":
        target = { weekday, index: firstIndex };
        break;
      case "End":
        target = { weekday, index: endIndex - 1 };
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        sweepRef.current = null;
        toggleCell(weekday, index);
        return;
      default:
        return;
    }

    event.preventDefault();
    if (event.shiftKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      sweep(weekday, index, target.index);
    } else {
      sweepRef.current = null;
    }
    focusCell(target);
  };

  // Touch is handled as a plain tap on click, and non-primary mouse buttons are ignored.
  const handlePointerDown = (event: PointerEvent<HTMLTableCellElement>, weekday: Weekday, index: number) => {
    pointerTypeRef.current = event.pointerType === "touch" ? "touch" : "mouse";
    if (event.pointerType === "touch" || event.button > 0) {
      return;
    }
    event.currentTarget.focus();
    startGesture(weekday, index);
  };

  const rows: GridRow[] = [];
  for (let index = firstIndex; index < endIndex; index++) {
    const beginMinutes = index * step;
    const startsHeader = step >= 60 || index === firstIndex || beginMinutes % 60 === 0;
    const nextHourIndex = ((Math.floor(beginMinutes / 60) + 1) * 60) / step;
    rows.push({
      index,
      beginMinutes,
      endMinutes: beginMinutes + step,
      headerRowSpan: startsHeader ? (step >= 60 ? 1 : Math.min(endIndex, nextHourIndex) - index) : null,
    });
  }

  const cellInfo = (weekday: Weekday, index: number): WeeklyPatternCellInfo<TData> => {
    const dayCells = grid[weekday];
    const data = dayCells?.[index];
    const previous = dayCells?.[index - 1];
    const next = dayCells?.[index + 1];
    const isRunStart = data !== undefined && (previous === undefined || !isDataEqual(previous, data));
    const isRunEnd = data !== undefined && (next === undefined || !isDataEqual(next, data));

    let runBeginMinutes = index * step;
    let runEndMinutes = (index + 1) * step;
    if (data !== undefined) {
      let start = index;
      while (start > 0) {
        const before = dayCells?.[start - 1];
        if (before === undefined || !isDataEqual(before, data)) {
          break;
        }
        start -= 1;
      }
      let end = index;
      while (dayCells && end + 1 < dayCells.length) {
        const after = dayCells[end + 1];
        if (after === undefined || !isDataEqual(after, data)) {
          break;
        }
        end += 1;
      }
      runBeginMinutes = start * step;
      runEndMinutes = (end + 1) * step;
    }

    return {
      weekday,
      beginMinutes: index * step,
      endMinutes: (index + 1) * step,
      data,
      selected: data !== undefined,
      isRunStart,
      isRunEnd,
      runBeginMinutes,
      runEndMinutes,
      availability: isOpen(weekday, index) ? "open" : "closed",
    };
  };

  const cellBehaviour = (weekday: Weekday, index: number) => ({
    ref: (element: HTMLTableCellElement | null) => {
      const key = addressKey(weekday, index);
      if (element) {
        cellElements.current.set(key, element);
      } else {
        cellElements.current.delete(key);
      }
    },
    // Roving tabindex: only the active cell is in the tab order.
    tabIndex: !disabled && activeAddress?.weekday === weekday && activeAddress.index === index ? 0 : -1,
    onFocus: () => setActive({ weekday, index }),
    onKeyDown: (event: KeyboardEvent<HTMLTableCellElement>) => handleKeyDown(event, weekday, index),
    onPointerDown: (event: PointerEvent<HTMLTableCellElement>) => handlePointerDown(event, weekday, index),
    onPointerEnter: () => extendGesture(weekday, index),
    // Stops the browser's native text-selection drag from fighting the paint gesture.
    onMouseDown: (event: MouseEvent<HTMLTableCellElement>) => event.preventDefault(),
    onClick: () => {
      if (pointerTypeRef.current === "touch") {
        toggleCell(weekday, index);
      }
    },
  });

  const tableHandlers = {
    onBlur: (event: FocusEvent<HTMLTableElement>) => {
      // Moving between cells also blurs the old cell. Only leaving the table counts as a blur.
      if (event.currentTarget.contains(event.relatedTarget)) {
        return;
      }
      sweepRef.current = null;
      onBlur?.();
    },
    onKeyUp: (event: KeyboardEvent<HTMLTableElement>) => {
      if (event.key === "Shift") {
        sweepRef.current = null;
      }
    },
  };

  const liveMessage = message.count % 2 === 0 ? message.text : `${message.text} `;

  return { days, rows, cellInfo, cellBehaviour, tableHandlers, focus, liveMessage };
}
