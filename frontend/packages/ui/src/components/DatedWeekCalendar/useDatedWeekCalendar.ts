"use client";

import type { KeyboardEvent } from "react";
import { useGridNavigation } from "../CalendarGrid/useGridNavigation";

type CellAddress = { dayKey: string; index: number };

type Options = {
  dayKeys: ReadonlyArray<string>;
  firstIndex: number;
  endIndex: number;
  rowsPerHour: number;
  /** Called for Enter and Space on a cell. */
  onActivate?: (dayKey: string, index: number) => void;
  /** Called for a click or tap on a cell. */
  onCellClick?: (dayKey: string, index: number) => void;
  /** Sees every key first. Return true when it handled the key, so the grid doesn't. */
  onKeyOverride?: (event: KeyboardEvent<HTMLTableCellElement>) => boolean;
};

export function useDatedWeekCalendar({
  dayKeys,
  firstIndex,
  endIndex,
  rowsPerHour,
  onActivate,
  onCellClick,
  onKeyOverride,
}: Options) {
  const navigation = useGridNavigation({ columns: dayKeys, firstIndex, endIndex, rowsPerHour });

  const handleKeyDown = (event: KeyboardEvent<HTMLTableCellElement>, dayKey: string, index: number) => {
    if (onKeyOverride?.(event)) {
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate?.(dayKey, index);
      return;
    }
    const target = navigation.targetFor(event.key, dayKey, index);
    if (target) {
      event.preventDefault();
      navigation.focusCell(target);
    }
  };

  const cellBehaviour = (dayKey: string, index: number) => ({
    ...navigation.cellProps(dayKey, index),
    onKeyDown: (event: KeyboardEvent<HTMLTableCellElement>) => handleKeyDown(event, dayKey, index),
    onClick: () => onCellClick?.(dayKey, index),
  });

  const focusCell = ({ dayKey, index }: CellAddress) => navigation.focusCell({ column: dayKey, index });

  return { cellBehaviour, focus: navigation.focus, focusCell };
}
