"use client";

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

  const cellBehaviour = (resourceId: string, index: number) => ({
    ...navigation.cellProps(resourceId, index),
    onKeyDown: (event: KeyboardEvent<HTMLTableCellElement>) => handleKeyDown(event, resourceId, index),
    onClick: () => onActivate?.(resourceId, index),
  });

  return { cellBehaviour, focus: navigation.focus };
}
