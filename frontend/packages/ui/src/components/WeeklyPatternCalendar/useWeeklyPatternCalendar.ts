"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { WEEKDAYS_SORTED } from "@ui/modules/const";
import { Weekday } from "../../../gql/gql-types";
import { useGridNavigation } from "../CalendarGrid/useGridNavigation";
import type { GridAddress } from "../CalendarGrid/useGridNavigation";
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
  WeekdayInterval,
  WeeklyPatternAnnouncements,
  WeeklyPatternCalendarProps,
  WeeklyPatternCellInfo,
  WeeklyPatternSelectionAnnouncements,
  WeeklyPatternValue,
} from "./types";

/** The three select mode props, which only mean something together. Without them the gestures paint. */
export type WeeklyPatternSelectMode = {
  selection: WeekdayInterval | null;
  onSelectionChange: (next: WeekdayInterval | null) => void;
  announcements: WeeklyPatternSelectionAnnouncements;
};

export type WeeklyPatternOptions<TData extends CalendarData> = Pick<
  WeeklyPatternCalendarProps<TData>,
  "value" | "onBlur" | "step" | "availability" | "visibleHours" | "brush" | "isDataEqual" | "isValidPaint" | "disabled"
> & {
  onChange: (value: WeeklyPatternValue<TData>) => void;
  readOnly?: boolean;
  announcements: WeeklyPatternAnnouncements;
  /** Given in select mode, where the gestures choose a Selection and `value` is never written. */
  select?: WeeklyPatternSelectMode;
  /** Spoken description of a span, e.g. "Monday, 10:00-11:00". */
  describeSpan: (weekday: Weekday, beginMinutes: number, endMinutes: number) => string;
};

// A pointer drag on one weekday: the cell it started on and the cell the pointer is over now. A paint gesture
// also carries what it does, which is fixed on the cell it started on. A select gesture needs no mode, because
// choosing a Selection has one meaning.
type Gesture<TData> = { weekday: Weekday; anchor: number; current: number } & (
  | { kind: "paint"; mode: PaintMode<TData> }
  | { kind: "select" }
);

// The keyboard twin of a gesture, on one weekday. A paint sweep fixes its mode when the sweep starts. A select
// sweep holds the end that stays put, so the moving end can shrink the Selection as well as grow it.
type Sweep<TData> = { weekday: Weekday; anchor: number } & (
  | { kind: "paint"; mode: PaintMode<TData> }
  | { kind: "select" }
);

/**
 * What a cell does on a gesture. One of the two objects below is picked, once, from the mode the grid is in, so
 * no handler has to ask which mode it is in.
 */
type CellGestures = {
  /** A pointer press, which starts a gesture. */
  press: (weekday: Weekday, index: number) => void;
  /** A touch tap, which acts on the one cell it hits. */
  tap: (weekday: Weekday, index: number) => void;
  keyDown: (event: KeyboardEvent<HTMLTableCellElement>, weekday: Weekday, index: number) => void;
};

export type GridRow = {
  index: number;
  beginMinutes: number;
  endMinutes: number;
  /** Set on the rows that start an hour (or every row when the step is an hour or more). */
  headerRowSpan: number | null;
};

/** The span a run of cells covers, with an exclusive end, as every interval in this calendar has. */
function intervalOf(weekday: Weekday, from: number, to: number, step: number): WeekdayInterval {
  return {
    weekday,
    beginMinutes: Math.min(from, to) * step,
    endMinutes: (Math.max(from, to) + 1) * step,
  };
}

// Which cells a Selection covers. Rounded outward, so a cell the Selection only reaches into still counts.
function selectionCells(selection: WeekdayInterval | null, step: number) {
  if (!selection) {
    return null;
  }
  return {
    weekday: selection.weekday,
    first: Math.floor(selection.beginMinutes / step),
    last: Math.ceil(selection.endMinutes / step) - 1,
  };
}

function sameInterval(a: WeekdayInterval | null, b: WeekdayInterval | null): boolean {
  if (a == null || b == null) {
    return a === b;
  }
  return a.weekday === b.weekday && a.beginMinutes === b.beginMinutes && a.endMinutes === b.endMinutes;
}

export function useWeeklyPatternCalendar<TData extends CalendarData>({
  value,
  onChange,
  onBlur,
  step,
  availability,
  visibleHours,
  brush,
  isDataEqual = shallowEqual,
  isValidPaint,
  readOnly = false,
  disabled = false,
  announcements,
  select,
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

  // The whole span has to sit inside one open range, which is also what stops a Selection crossing a closed cell.
  const isSpanOpen = (weekday: Weekday, from: number, to: number) =>
    isRangeOpen(rangesByDay[weekday], Math.min(from, to) * step, (Math.max(from, to) + 1) * step);

  const [gesture, setGesture] = useState<Gesture<TData> | null>(null);
  const [message, setMessage] = useState({ text: "", count: 0 });
  const gestureRef = useRef<Gesture<TData> | null>(null);
  const sweepRef = useRef<Sweep<TData> | null>(null);
  const pointerTypeRef = useRef("mouse");

  // Live-region text. Alternating a trailing no-break space makes a repeated message announce again.
  const announce = useCallback((text: string) => {
    setMessage((previous) => ({ text, count: previous.count + 1 }));
  }, []);

  // While dragging, preview the gesture without committing it to `value`.
  const grid: CellGrid<TData> =
    gesture?.kind === "paint"
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

  // The tab stop starts on the first open cell, so the grid isn't entered through a closed one.
  const defaultActive = (): GridAddress<Weekday> | null => {
    for (let index = firstIndex; index < endIndex; index++) {
      for (const weekday of days) {
        if (isOpen(weekday, index)) {
          return { column: weekday, index };
        }
      }
    }
    return hours ? { column: days[0] ?? Weekday.Monday, index: firstIndex } : null;
  };
  const navigation = useGridNavigation<Weekday>({ columns: days, firstIndex, endIndex, rowsPerHour, defaultActive });

  // The window pointer listeners are set up once, so they read the
  // latest props through this ref. Written in an effect because React Compiler forbids ref writes in render.
  const latest = useRef({
    baseGrid,
    onChange,
    step,
    isDataEqual,
    isOpen,
    isValidPaint,
    announcements,
    select,
    describeSpan,
  });
  useEffect(() => {
    latest.current = {
      baseGrid,
      onChange,
      step,
      isDataEqual,
      isOpen,
      isValidPaint,
      announcements,
      select,
      describeSpan,
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
      if (mode.kind === "paint" && current.isValidPaint) {
        const reason = current.isValidPaint({ weekday, beginMinutes, endMinutes, data: mode.data });
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

  // The single path through which every gesture chooses a Selection. A gesture that lands on the span that is
  // already chosen commits nothing, so nothing is announced twice.
  const chooseSelection = useCallback(
    (weekday: Weekday, from: number, to: number) => {
      const current = latest.current;
      if (!current.select) {
        return;
      }
      const next = intervalOf(weekday, from, to, current.step);
      if (sameInterval(current.select.selection, next)) {
        return;
      }
      current.select.onSelectionChange(next);
      const described = current.describeSpan(next.weekday, next.beginMinutes, next.endMinutes);
      announce(`${current.select.announcements.chosen}: ${described}`);
    },
    [announce]
  );

  const clearSelection = useCallback(() => {
    const current = latest.current;
    const cleared = current.select?.selection;
    if (!current.select || !cleared) {
      return;
    }
    current.select.onSelectionChange(null);
    const described = current.describeSpan(cleared.weekday, cleared.beginMinutes, cleared.endMinutes);
    announce(`${current.select.announcements.cleared}: ${described}`);
  }, [announce]);

  const endGesture = useCallback(
    (shouldCommit: boolean) => {
      const finished = gestureRef.current;
      if (!finished) {
        return;
      }
      gestureRef.current = null;
      setGesture(null);
      if (!shouldCommit) {
        return;
      }
      // Releasing is the one thing the two modes do differently at the end of a gesture.
      if (finished.kind === "paint") {
        commit(finished.weekday, finished.anchor, finished.current, finished.mode);
      } else {
        chooseSelection(finished.weekday, finished.anchor, finished.current);
      }
    },
    [commit, chooseSelection]
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

  const startGesture = (started: Gesture<TData>) => {
    gestureRef.current = started;
    setGesture(started);
  };

  // Dragging across weekdays is intentionally unsupported: a gesture paints or chooses a single-day range.
  const extendGesture = (weekday: Weekday, index: number) => {
    const running = gestureRef.current;
    if (!running || running.weekday !== weekday || running.current === index) {
      return;
    }
    // A Selection cannot cross a closed cell, so the open end stops where the open range does.
    if (running.kind === "select" && !isSpanOpen(weekday, running.anchor, index)) {
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
  const paintSweep = (weekday: Weekday, from: number, to: number) => {
    let running = sweepRef.current;
    if (running?.kind !== "paint" || running.weekday !== weekday) {
      const anchor = modeAt(weekday, from) ? from : to;
      const mode = modeAt(weekday, anchor);
      if (!mode) {
        return;
      }
      running = { kind: "paint", weekday, anchor, mode };
      sweepRef.current = running;
    }
    commit(weekday, from, to, running.mode, running.anchor);
  };

  const paintGestures: CellGestures = {
    press: (weekday, index) => {
      const mode = modeAt(weekday, index);
      if (mode) {
        startGesture({ kind: "paint", weekday, anchor: index, current: index, mode });
      }
    },
    tap: toggleCell,
    keyDown: (event, weekday, index) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        sweepRef.current = null;
        toggleCell(weekday, index);
        return;
      }

      const target = navigation.targetFor(event.key, weekday, index);
      if (!target) {
        return;
      }

      event.preventDefault();
      if (event.shiftKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        paintSweep(weekday, index, target.index);
      } else {
        sweepRef.current = null;
      }
      navigation.focusCell(target);
    },
  };

  // What a select gesture may do on a cell. A Selection cannot start on a closed cell, so a closed cell allows
  // nothing. This is the select mode twin of `modeAt`.
  const canSelect = (weekday: Weekday, index: number) => interactive && isOpen(weekday, index);

  /**
   * The end of the Selection that stays put while Shift and an arrow move the other one. It is the far end when
   * focus sits on one end of the Selection, and the focused cell itself otherwise. Once a sweep runs the anchor
   * is held, because the consumer owns the Selection and may not have echoed the last change back yet.
   */
  const sweepAnchor = (weekday: Weekday, index: number): number => {
    const running = sweepRef.current;
    if (running?.kind === "select" && running.weekday === weekday) {
      return running.anchor;
    }
    const chosen = selectionCells(select?.selection ?? null, step);
    if (chosen?.weekday === weekday) {
      if (index === chosen.first) {
        return chosen.last;
      }
      if (index === chosen.last) {
        return chosen.first;
      }
    }
    return index;
  };

  const selectSweep = (weekday: Weekday, index: number, to: number) => {
    const anchor = sweepAnchor(weekday, index);
    if (!interactive || !isSpanOpen(weekday, anchor, to)) {
      // The end cannot move onto or across a closed cell, so neither it nor focus moves at all.
      return;
    }
    sweepRef.current = { kind: "select", weekday, anchor };
    chooseSelection(weekday, anchor, to);
    navigation.focusCell({ column: weekday, index: to });
  };

  const chooseCell = (weekday: Weekday, index: number) => {
    if (canSelect(weekday, index)) {
      chooseSelection(weekday, index, index);
    }
  };

  const selectGestures: CellGestures = {
    press: (weekday, index) => {
      if (canSelect(weekday, index)) {
        startGesture({ kind: "select", weekday, anchor: index, current: index });
      }
    },
    tap: chooseCell,
    keyDown: (event, weekday, index) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        sweepRef.current = null;
        chooseCell(weekday, index);
        return;
      }

      if (event.key === "Escape") {
        sweepRef.current = null;
        if (interactive) {
          clearSelection();
        }
        return;
      }

      const target = navigation.targetFor(event.key, weekday, index);
      if (!target) {
        return;
      }

      event.preventDefault();
      if (event.shiftKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        selectSweep(weekday, index, target.index);
        return;
      }
      // A plain arrow key only moves focus. The Selection stays as it is.
      sweepRef.current = null;
      navigation.focusCell(target);
    },
  };

  const gestures = select ? selectGestures : paintGestures;

  const handleKeyDown = (event: KeyboardEvent<HTMLTableCellElement>, weekday: Weekday, index: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    gestures.keyDown(event, weekday, index);
  };

  // Touch is handled as a plain tap on click, and non-primary mouse buttons are ignored.
  const handlePointerDown = (event: PointerEvent<HTMLTableCellElement>, weekday: Weekday, index: number) => {
    pointerTypeRef.current = event.pointerType === "touch" ? "touch" : "mouse";
    if (event.pointerType === "touch" || event.button > 0) {
      return;
    }
    event.currentTarget.focus();
    gestures.press(weekday, index);
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

  // While a select gesture runs, the span it covers is the Selection the cells show. It is committed on release,
  // so until then the consumer's own `selection` is one gesture behind.
  const shownSelection =
    gesture?.kind === "select"
      ? intervalOf(gesture.weekday, gesture.anchor, gesture.current, step)
      : (select?.selection ?? null);
  const selectionRun = select ? selectionCells(shownSelection, step) : null;

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

    const painted = data !== undefined;
    const chosen = selectionRun?.weekday === weekday ? selectionRun : null;

    return {
      weekday,
      beginMinutes: index * step,
      endMinutes: (index + 1) * step,
      data,
      painted,
      // Painting is the user's choice in editable and read only mode, so it is what `aria-selected` reports
      // there. In select mode the Selection is the choice, and a painted cell is only a layer the consumer draws.
      selected: select ? chosen != null && index >= chosen.first && index <= chosen.last : painted,
      isRunStart,
      isRunEnd,
      runBeginMinutes,
      runEndMinutes,
      isSelectionStart: chosen != null && index === chosen.first,
      isSelectionEnd: chosen != null && index === chosen.last,
      availability: isOpen(weekday, index) ? "open" : "closed",
    };
  };

  const cellBehaviour = (weekday: Weekday, index: number) => ({
    ...navigation.cellProps(weekday, index),
    // A disabled grid has no tab stop.
    tabIndex: disabled ? -1 : navigation.cellProps(weekday, index).tabIndex,
    onKeyDown: (event: KeyboardEvent<HTMLTableCellElement>) => handleKeyDown(event, weekday, index),
    onPointerDown: (event: PointerEvent<HTMLTableCellElement>) => handlePointerDown(event, weekday, index),
    onPointerEnter: () => extendGesture(weekday, index),
    // Stops the browser's native text-selection drag from fighting the paint gesture.
    onMouseDown: (event: MouseEvent<HTMLTableCellElement>) => event.preventDefault(),
    onClick: () => {
      if (pointerTypeRef.current === "touch") {
        gestures.tap(weekday, index);
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

  return { days, rows, cellInfo, cellBehaviour, tableHandlers, focus: navigation.focus, liveMessage };
}
