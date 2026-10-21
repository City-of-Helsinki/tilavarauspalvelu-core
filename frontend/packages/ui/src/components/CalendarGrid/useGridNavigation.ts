"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GridAddress<TColumn extends string> = { column: TColumn; index: number };

type Options<TColumn extends string> = {
  columns: ReadonlyArray<TColumn>;
  /** First and last (exclusive) row index that is shown. */
  firstIndex: number;
  endIndex: number;
  rowsPerHour: number;
  /** The cell that holds the tab stop before anything has been focused. Defaults to the first shown cell. */
  defaultActive?: () => GridAddress<TColumn> | null;
};

const addressKey = (column: string, index: number) => `${column}:${index}`;

/**
 * Roving tabindex and cursor movement for a time grid, as in the ARIA Authoring Practices grid pattern.
 * Whatever a cell does besides moving focus is up to the calendar that uses this.
 */
export function useGridNavigation<TColumn extends string>({
  columns,
  firstIndex,
  endIndex,
  rowsPerHour,
  defaultActive,
}: Options<TColumn>) {
  const [active, setActive] = useState<GridAddress<TColumn> | null>(null);
  const cellElements = useRef(new Map<string, HTMLTableCellElement>());

  const isShown = (address: GridAddress<TColumn> | null): address is GridAddress<TColumn> =>
    address != null && columns.includes(address.column) && address.index >= firstIndex && address.index < endIndex;

  const firstColumn = columns[0];
  const fallback = () =>
    defaultActive?.() ??
    (firstColumn != null && endIndex > firstIndex ? { column: firstColumn, index: firstIndex } : null);
  // The remembered cell can scroll out of the shown range, e.g. after changing week.
  const activeAddress = isShown(active) ? active : fallback();

  // Read by `focus()`, which is exposed once through a ref handle and must not go stale.
  const latest = useRef(activeAddress);
  useEffect(() => {
    latest.current = activeAddress;
  });

  const focusCell = useCallback((address: GridAddress<TColumn>) => {
    cellElements.current.get(addressKey(address.column, address.index))?.focus();
  }, []);

  const focus = useCallback(() => {
    if (latest.current) {
      focusCell(latest.current);
    }
  }, [focusCell]);

  const clampRow = (row: number) => Math.min(Math.max(row, firstIndex), endIndex - 1);

  /** Where a navigation key leads from a cell, or null when the key doesn't navigate. */
  const targetFor = (key: string, column: TColumn, index: number): GridAddress<TColumn> | null => {
    const sideways = (offset: number) =>
      columns[Math.min(Math.max(columns.indexOf(column) + offset, 0), columns.length - 1)] ?? column;
    switch (key) {
      case "ArrowDown":
        return { column, index: clampRow(index + 1) };
      case "ArrowUp":
        return { column, index: clampRow(index - 1) };
      case "ArrowRight":
        return { column: sideways(1), index };
      case "ArrowLeft":
        return { column: sideways(-1), index };
      case "PageDown":
        return { column, index: clampRow(index + rowsPerHour) };
      case "PageUp":
        return { column, index: clampRow(index - rowsPerHour) };
      case "Home":
        return { column, index: firstIndex };
      case "End":
        return { column, index: endIndex - 1 };
      default:
        return null;
    }
  };

  /** The ref, tab stop and focus tracking every cell needs. */
  const cellProps = (column: TColumn, index: number) => ({
    ref: (element: HTMLTableCellElement | null) => {
      const key = addressKey(column, index);
      if (element) {
        cellElements.current.set(key, element);
      } else {
        cellElements.current.delete(key);
      }
    },
    tabIndex: activeAddress?.column === column && activeAddress.index === index ? 0 : -1,
    onFocus: () => setActive({ column, index }),
  });

  return { activeAddress, cellProps, targetFor, focus, focusCell };
}
