"use client";

import { useCallback, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useGridNavigation } from "../CalendarGrid/useGridNavigation";

type Options = {
  resourceIds: ReadonlyArray<string>;
  firstIndex: number;
  endIndex: number;
  rowsPerHour: number;
  /** Called for Enter and Space on a cell, and for a click or tap on it. */
  onActivate?: (resourceId: string, index: number) => void;
};

/**
 * Everything it returns except `activeAddress` keeps its identity between renders, so a memoised row only
 * renders again when its own data or its own tab stop changes.
 */
export function useResourceDayCalendar({ resourceIds, firstIndex, endIndex, rowsPerHour, onActivate }: Options) {
  const navigation = useGridNavigation({
    columns: resourceIds,
    firstIndex,
    endIndex,
    rowsPerHour,
    timeAxis: "horizontal",
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLTableCellElement>, resourceId: string, index: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate?.(resourceId, index);
      return;
    }
    const target = navigation.targetFor(event.key, resourceId, index);
    if (target) {
      event.preventDefault();
      navigation.focusCell(target);
    }
  };

  // The handlers below are only called from events, so they can read the latest closures through a ref.
  const latest = useRef({ handleKeyDown, onActivate });
  useEffect(() => {
    latest.current = { handleKeyDown, onActivate };
  });

  const onCellKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableCellElement>, resourceId: string, index: number) =>
      latest.current.handleKeyDown(event, resourceId, index),
    []
  );
  const onCellClick = useCallback(
    (resourceId: string, index: number) => latest.current.onActivate?.(resourceId, index),
    []
  );

  return {
    activeAddress: navigation.activeAddress,
    registerCell: navigation.registerCell,
    onCellFocus: navigation.markActive,
    onCellKeyDown,
    onCellClick,
    focus: navigation.focus,
  };
}
