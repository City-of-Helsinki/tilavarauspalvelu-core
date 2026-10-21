"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type CellAddress = { dayKey: string; index: number };

type Options = {
  dayKeys: ReadonlyArray<string>;
  firstIndex: number;
  endIndex: number;
  rowsPerHour: number;
};

const addressKey = (dayKey: string, index: number) => `${dayKey}:${index}`;

// Roving tabindex and arrow key navigation for the grid, as in the ARIA Authoring Practices grid pattern.
export function useDatedWeekCalendar({ dayKeys, firstIndex, endIndex, rowsPerHour }: Options) {
  const [active, setActive] = useState<CellAddress | null>(null);
  const cellElements = useRef(new Map<string, HTMLTableCellElement>());

  const isShown = (address: CellAddress | null): address is CellAddress =>
    address != null && dayKeys.includes(address.dayKey) && address.index >= firstIndex && address.index < endIndex;

  // Falls back to the first cell when the remembered one is no longer shown, e.g. after changing week.
  const firstDay = dayKeys[0];
  const activeAddress: CellAddress | null = isShown(active)
    ? active
    : firstDay != null && endIndex > firstIndex
      ? { dayKey: firstDay, index: firstIndex }
      : null;

  const latest = useRef(activeAddress);
  useEffect(() => {
    latest.current = activeAddress;
  });

  const focusCell = (address: CellAddress) => {
    cellElements.current.get(addressKey(address.dayKey, address.index))?.focus();
  };

  // Exposed so a parent can move focus into the grid.
  const focus = useCallback(() => {
    const address = latest.current;
    if (address) {
      cellElements.current.get(addressKey(address.dayKey, address.index))?.focus();
    }
  }, []);

  const clampRow = (row: number) => Math.min(Math.max(row, firstIndex), endIndex - 1);

  const handleKeyDown = (event: KeyboardEvent<HTMLTableCellElement>, dayKey: string, index: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const dayPosition = dayKeys.indexOf(dayKey);
    const sideways = (offset: number) =>
      dayKeys[Math.min(Math.max(dayPosition + offset, 0), dayKeys.length - 1)] ?? dayKey;

    let target: CellAddress;
    switch (event.key) {
      case "ArrowDown":
        target = { dayKey, index: clampRow(index + 1) };
        break;
      case "ArrowUp":
        target = { dayKey, index: clampRow(index - 1) };
        break;
      case "ArrowRight":
        target = { dayKey: sideways(1), index };
        break;
      case "ArrowLeft":
        target = { dayKey: sideways(-1), index };
        break;
      case "PageDown":
        target = { dayKey, index: clampRow(index + rowsPerHour) };
        break;
      case "PageUp":
        target = { dayKey, index: clampRow(index - rowsPerHour) };
        break;
      case "Home":
        target = { dayKey, index: firstIndex };
        break;
      case "End":
        target = { dayKey, index: endIndex - 1 };
        break;
      default:
        return;
    }
    event.preventDefault();
    focusCell(target);
  };

  const cellBehaviour = (dayKey: string, index: number) => ({
    ref: (element: HTMLTableCellElement | null) => {
      const key = addressKey(dayKey, index);
      if (element) {
        cellElements.current.set(key, element);
      } else {
        cellElements.current.delete(key);
      }
    },
    tabIndex: activeAddress?.dayKey === dayKey && activeAddress.index === index ? 0 : -1,
    onFocus: () => setActive({ dayKey, index }),
    onKeyDown: (event: KeyboardEvent<HTMLTableCellElement>) => handleKeyDown(event, dayKey, index),
  });

  return { cellBehaviour, focus };
}
